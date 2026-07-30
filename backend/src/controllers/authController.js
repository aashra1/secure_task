const crypto = require('crypto');
const User = require('../models/User');
const authService = require('../services/authService');

const setAuthCookies = (res, tokens) => {
  res.cookie('accessToken', tokens.accessToken, { ...authService.cookieOptions(), maxAge: Number(process.env.JWT_EXPIRY || 3600) * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, { ...authService.cookieOptions(), maxAge: Number(process.env.JWT_REFRESH_EXPIRY || 604800) * 1000 });
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req);
    res.status(201).json({ message: 'Registered. Please verify your email.', user });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req);
    if (result.mfaRequired) return res.json(result);
    setAuthCookies(res, result);
    return res.json({ user: result.user });
  } catch (error) { return next(error); }
};

const googleLogin = async (req, res, next) => {
  try {
    const result = await authService.googleLogin(req);
    if (result.mfaRequired) return res.json(result);
    setAuthCookies(res, result);
    return res.json({ user: result.user });
  } catch (error) { return next(error); }
};

const verifyMfa = async (req, res, next) => {
  try {
    const result = await authService.verifyMfa(req);
    setAuthCookies(res, result);
    res.json({ user: result.user });
  } catch (error) { next(error); }
};

const setupMfa = async (req, res, next) => {
  try { res.json(await authService.setupMfa(req)); } catch (error) { next(error); }
};

const confirmMfa = async (req, res, next) => {
  try { res.json(await authService.confirmMfa(req)); } catch (error) { next(error); }
};

const disableMfa = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+mfa.secret +mfa.backupCodes');
    user.mfa = { enabled: false, backupCodes: [] };
    await user.save();
    await authService.logAudit(req, 'MFA_DISABLED');
    res.json({ message: 'MFA disabled' });
  } catch (error) { next(error); }
};

const refreshToken = async (req, res, next) => {
  try {
    const tokens = await authService.refreshToken(req);
    setAuthCookies(res, tokens);
    res.json({ message: 'Token refreshed' });
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Password changed. Please sign in again.' });
  } catch (error) { next(error); }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req);
    res.json({ message: 'If the account exists, a reset link was sent.' });
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req);
    res.json({ message: 'Password reset complete' });
  } catch (error) { next(error); }
};

const verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyEmail(req);
    res.json({ message: 'Email verified' });
  } catch (error) { next(error); }
};

const resendVerification = async (req, res, next) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    req.user.emailVerificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    req.user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await req.user.save();
    const emailService = require('../services/emailService');
    await emailService.sendVerificationEmail(req.user, token);
    res.json({ message: 'Verification email sent' });
  } catch (error) { next(error); }
};

module.exports = {
  register, login, googleLogin, verifyMfa, setupMfa, confirmMfa, disableMfa, refreshToken,
  logout, changePassword, requestPasswordReset, resetPassword, verifyEmail, resendVerification
};
