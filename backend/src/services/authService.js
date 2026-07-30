const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const emailService = require('./emailService');
const { validateEmail, validatePassword } = require('../utils/validators');
const { decryptIfEncrypted } = require('../utils/encryption');
const googleClient = new OAuth2Client();
const jwtDefaults = {
  algorithm: 'HS256',
  issuer: process.env.JWT_ISSUER || 'securetask-api',
  audience: process.env.JWT_AUDIENCE || 'securetask-web'
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const logAudit = async (req, action, status = 'success', details = {}, userId = req.user?._id) => {
  await AuditLog.create({
    user: userId,
    action,
    status,
    details,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

const generateTokens = async (user, req, mfa = true) => {
  const jti = uuidv4();
  const refreshRaw = crypto.randomBytes(48).toString('hex');
  const refreshToken = jwt.sign({ sub: user._id.toString(), jti, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    ...jwtDefaults,
    expiresIn: Number(process.env.JWT_REFRESH_EXPIRY || 604800)
  });
  const refreshTokenHash = await bcrypt.hash(`${refreshRaw}.${refreshToken}`, Number(process.env.SALT_ROUNDS || 12));
  const expiresAt = new Date(Date.now() + Number(process.env.JWT_REFRESH_EXPIRY || 604800) * 1000);
  user.sessions.push({ jti, refreshTokenHash, userAgent: req.get('user-agent'), ip: req.ip, expiresAt });
  user.sessions = user.sessions.filter((session) => session.expiresAt > new Date()).slice(-5);
  await user.save();
  const accessToken = jwt.sign({ sub: user._id.toString(), role: user.role, jti, mfa, type: 'access' }, process.env.JWT_SECRET, {
    ...jwtDefaults,
    expiresIn: Number(process.env.JWT_EXPIRY || 3600)
  });
  return { accessToken, refreshToken: `${refreshRaw}.${refreshToken}`, jti };
};

const register = async (req) => {
  const { email, password, profile = {} } = req.body;
  if (!validateEmail(email)) throw Object.assign(new Error('Invalid email'), { status: 400 });
  const strength = validatePassword(password);
  if (!strength.valid) throw Object.assign(new Error(strength.errors.join(', ')), { status: 400 });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw Object.assign(new Error('Email already registered'), { status: 409 });
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    email,
    password,
    profile: { name: profile.name || req.body.name || 'SecureTask User' },
    emailVerificationTokenHash: hashToken(verifyToken),
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  await emailService.sendVerificationEmail(user, verifyToken);
  await logAudit(req, 'REGISTER', 'success', { email: user.email }, user._id);
  return user;
};

const login = async (req) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase(), isActive: true }).select('+password +passwordHistory +mfa.secret +mfa.backupCodes');
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (user.isLocked) throw Object.assign(new Error('Account locked. Try again later.'), { status: 423 });
  if (!user.password) throw Object.assign(new Error('Use Google to sign in to this account'), { status: 401 });
  const ok = await user.comparePassword(password);
  if (!ok) {
    await user.recordFailedLogin();
    await logAudit(req, 'LOGIN_FAILURE', 'failure', { email }, user._id);
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  await user.resetLoginAttempts();
  if (user.mfa.enabled) return { mfaRequired: true, mfaChallenge: generateMfaChallenge(user) };
  const tokens = await generateTokens(user, req, false);
  await logAudit(req, 'LOGIN_SUCCESS', 'success', {}, user._id);
  return { user, ...tokens };
};

const googleLogin = async (req) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw Object.assign(new Error('Google sign-in is not configured'), { status: 503 });
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
  } catch {
    throw Object.assign(new Error('Invalid Google credential'), { status: 401 });
  }
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw Object.assign(new Error('Google account email is not verified'), { status: 401 });
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ googleId: payload.sub, isActive: true }).select('+googleId +mfa.secret +mfa.backupCodes');
  let created = false;

  if (!user) {
    user = await User.findOne({ email, isActive: true }).select('+googleId +mfa.secret +mfa.backupCodes');
    if (user && user.googleId && user.googleId !== payload.sub) {
      throw Object.assign(new Error('This email is linked to another Google account'), { status: 409 });
    }
    if (user && !user.googleId) {
      const googleControlsEmail = email.endsWith('@gmail.com') || Boolean(payload.hd);
      if (!googleControlsEmail) {
        throw Object.assign(new Error('Sign in with your password before linking this Google account'), { status: 409 });
      }
      user.googleId = payload.sub;
      user.isEmailVerified = true;
      if (!user.profile.avatarUrl && payload.picture) user.profile.avatarUrl = payload.picture;
      await user.save();
    }
  }

  if (!user) {
    user = await User.create({
      email,
      googleId: payload.sub,
      profile: {
        name: payload.name || 'SecureTask User',
        avatarUrl: payload.picture
      },
      isEmailVerified: true
    });
    created = true;
  }

  if (user.isLocked) throw Object.assign(new Error('Account locked. Try again later.'), { status: 423 });
  if (user.mfa.enabled) return { mfaRequired: true, mfaChallenge: generateMfaChallenge(user) };

  const tokens = await generateTokens(user, req, false);
  await logAudit(req, created ? 'REGISTER' : 'LOGIN_SUCCESS', 'success', { provider: 'google' }, user._id);
  return { user, ...tokens };
};

const verifyMfa = async (req) => {
  const challenge = req.cookies.mfaChallenge;
  let challengePayload;
  try {
    challengePayload = jwt.verify(challenge, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: jwtDefaults.issuer,
      audience: jwtDefaults.audience
    });
  } catch {
    throw Object.assign(new Error('Invalid or expired MFA challenge'), { status: 401 });
  }
  if (challengePayload.type !== 'mfa_challenge') {
    throw Object.assign(new Error('Invalid or expired MFA challenge'), { status: 401 });
  }
  const user = await User.findById(challengePayload.sub).select('+mfa.secret +mfa.backupCodes');
  if (!user || !user.mfa.enabled) throw Object.assign(new Error('Invalid MFA request'), { status: 400 });
  const token = String(req.body.token || '').replace(/\s+/g, '');
  const totpValid = speakeasy.totp.verify({ secret: decryptIfEncrypted(user.mfa.secret), encoding: 'base32', token, window: 1 });
  const backupIndex = user.mfa.backupCodes.findIndex((codeHash) => bcrypt.compareSync(token, codeHash));
  if (!totpValid && backupIndex === -1) {
    await logAudit(req, 'MFA_VERIFICATION_FAILED', 'failure', {}, user._id);
    throw Object.assign(new Error('Invalid MFA token'), { status: 401 });
  }
  if (backupIndex >= 0) user.mfa.backupCodes.splice(backupIndex, 1);
  const tokens = await generateTokens(user, req, true);
  await logAudit(req, 'LOGIN_SUCCESS', 'success', { mfa: true }, user._id);
  return { user, ...tokens };
};

const setupMfa = async (req) => {
  const secret = speakeasy.generateSecret({ name: `SecureTask:${req.user.email}`, issuer: process.env.MFA_ISSUER || 'SecureTask' });
  req.user.mfa.pendingSecret = secret.base32;
  await req.user.save();
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  await logAudit(req, 'MFA_SETUP');
  return { qrCode, secret: secret.base32 };
};

const confirmMfa = async (req) => {
  const user = await User.findById(req.user._id).select('+mfa.pendingSecret +mfa.backupCodes');
  const valid = speakeasy.totp.verify({ secret: decryptIfEncrypted(user.mfa.pendingSecret), encoding: 'base32', token: req.body.token, window: 1 });
  if (!valid) throw Object.assign(new Error('Invalid MFA token'), { status: 400 });
  const rawCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex'));
  user.mfa.secret = user.mfa.pendingSecret;
  user.mfa.pendingSecret = undefined;
  user.mfa.enabled = true;
  user.mfa.backupCodes = await Promise.all(rawCodes.map((code) => bcrypt.hash(code, Number(process.env.SALT_ROUNDS || 12))));
  await user.save();
  await logAudit(req, 'MFA_CONFIRMED');
  return { backupCodes: rawCodes };
};

const refreshToken = async (req) => {
  const presented = req.cookies.refreshToken;
  if (!presented) throw Object.assign(new Error('Refresh token required'), { status: 401 });
  if (!/^[a-f0-9]{96}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(presented)) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }
  const rawJwt = presented.split('.').slice(1).join('.');
  const payload = jwt.verify(rawJwt, process.env.JWT_REFRESH_SECRET, {
    algorithms: ['HS256'],
    issuer: jwtDefaults.issuer,
    audience: jwtDefaults.audience
  });
  if (payload.type !== 'refresh') throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  const user = await User.findById(payload.sub);
  const session = user?.sessions.find((item) => item.jti === payload.jti);
  if (!session || !(await bcrypt.compare(presented, session.refreshTokenHash))) throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  user.sessions = user.sessions.filter((item) => item.jti !== payload.jti);
  await user.save();
  return generateTokens(user, req, true);
};

const generateMfaChallenge = (user) => jwt.sign(
  { sub: user._id.toString(), type: 'mfa_challenge' },
  process.env.JWT_SECRET,
  { ...jwtDefaults, expiresIn: '5m' }
);

const logout = async (req) => {
  req.user.sessions = req.user.sessions.filter((session) => session.jti !== req.auth.jti);
  await req.user.save();
  await logAudit(req, 'LOGOUT');
};

const changePassword = async (req) => {
  const user = await User.findById(req.user._id).select('+password +passwordHistory');
  if (!(await user.comparePassword(req.body.currentPassword))) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });
  if (await user.passwordWasUsed(req.body.newPassword)) throw Object.assign(new Error('Cannot reuse recent passwords'), { status: 400 });
  const strength = validatePassword(req.body.newPassword);
  if (!strength.valid) throw Object.assign(new Error(strength.errors.join(', ')), { status: 400 });
  user.passwordHistory = [user.password, ...(user.passwordHistory || [])].slice(0, 5);
  user.password = req.body.newPassword;
  user.sessions = [];
  await user.save();
  await logAudit(req, 'PASSWORD_CHANGED');
};

const requestPasswordReset = async (req) => {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase() });
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashToken(token);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  await emailService.sendResetPasswordEmail(user, token);
};

const resetPassword = async (req) => {
  const user = await User.findOne({ resetPasswordTokenHash: hashToken(req.body.token), resetPasswordExpires: { $gt: new Date() } }).select('+password +passwordHistory');
  if (!user) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });
  if (await user.passwordWasUsed(req.body.newPassword)) throw Object.assign(new Error('Cannot reuse recent passwords'), { status: 400 });
  user.passwordHistory = [user.password, ...(user.passwordHistory || [])].slice(0, 5);
  user.password = req.body.newPassword;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  user.sessions = [];
  await user.save();
  await logAudit(req, 'PASSWORD_RESET', 'success', {}, user._id);
};

const verifyEmail = async (req) => {
  const user = await User.findOne({ emailVerificationTokenHash: hashToken(req.params.token), emailVerificationExpires: { $gt: new Date() } });
  if (!user) throw Object.assign(new Error('Invalid or expired verification token'), { status: 400 });
  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  await logAudit(req, 'EMAIL_VERIFIED', 'success', {}, user._id);
};

module.exports = {
  cookieOptions, register, login, googleLogin, verifyMfa, setupMfa, confirmMfa, generateTokens,
  refreshToken, logout, changePassword, requestPasswordReset, resetPassword, verifyEmail, logAudit
};
