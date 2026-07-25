const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  jti: { type: String, required: true },
  refreshTokenHash: { type: String, required: true },
  userAgent: String,
  ip: String,
  expiresAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  passwordHistory: [{ type: String, select: false }],
  profile: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    avatarUrl: String,
    bio: { type: String, maxlength: 500 }
  },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: String,
  emailVerificationExpires: Date,
  resetPasswordTokenHash: String,
  resetPasswordExpires: Date,
  mfa: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, select: false },
    pendingSecret: { type: String, select: false },
    backupCodes: [{ type: String, select: false }]
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  sessions: [sessionSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.virtual('isLocked').get(function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const rounds = Number(process.env.SALT_ROUNDS || 12);
  this.password = await bcrypt.hash(this.password, rounds);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.passwordWasUsed = async function passwordWasUsed(candidate) {
  const hashes = [this.password, ...(this.passwordHistory || [])].filter(Boolean);
  const checks = await Promise.all(hashes.map((hash) => bcrypt.compare(candidate, hash)));
  return checks.some(Boolean);
};

userSchema.methods.recordFailedLogin = async function recordFailedLogin() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function resetLoginAttempts() {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

userSchema.methods.generateJwt = function generateJwt(jti) {
  return jwt.sign({ sub: this._id.toString(), role: this.role, jti }, process.env.JWT_SECRET, {
    expiresIn: Number(process.env.JWT_EXPIRY || 3600)
  });
};

userSchema.methods.createRawToken = function createRawToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

userSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.password;
    delete ret.passwordHistory;
    ret.mfa = { enabled: Boolean(ret.mfa?.enabled) };
    delete ret.sessions;
    delete ret.emailVerificationTokenHash;
    delete ret.resetPasswordTokenHash;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
