const rateLimit = require('express-rate-limit');

const ipBlockList = new Set((process.env.IP_BLOCK_LIST || '').split(',').filter(Boolean));
const ipAllowList = new Set((process.env.ADMIN_IP_ALLOW_LIST || '127.0.0.1,::1').split(',').filter(Boolean));

const blockListedIps = (req, res, next) => {
  if (ipBlockList.has(req.ip)) return res.status(403).json({ message: 'IP blocked' });
  return next();
};

const makeLimiter = ({ windowMs, limit, keyGenerator }) => rateLimit({
  windowMs,
  limit,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ message: 'Too many attempts. Try again later.' })
});

const emailKey = (req) => `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`;
const challengeKey = (req) => `${req.ip}:${String(req.body?.challenge || req.body?.userId || '')}`;
const generalLimiter = makeLimiter({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 100)
});
const loginLimiter = makeLimiter({
  windowMs: Number(process.env.LOGIN_RATE_WINDOW_MINUTES || 15) * 60 * 1000,
  limit: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
  keyGenerator: emailKey
});
const registerLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.REGISTER_RATE_LIMIT_PER_HOUR || 10)
});
const passwordResetLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.PASSWORD_RESET_RATE_LIMIT_PER_HOUR || 3),
  keyGenerator: emailKey
});
const mfaLimiter = makeLimiter({
  windowMs: Number(process.env.MFA_RATE_WINDOW_MINUTES || 15) * 60 * 1000,
  limit: Number(process.env.MFA_MAX_ATTEMPTS || 5),
  keyGenerator: challengeKey
});
const refreshLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.REFRESH_RATE_LIMIT_PER_HOUR || 30)
});

module.exports = {
  authLimiter: generalLimiter,
  generalLimiter, loginLimiter, registerLimiter, passwordResetLimiter, mfaLimiter,
  refreshLimiter, ipBlockList, ipAllowList, blockListedIps
};
