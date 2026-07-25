const rateLimit = require('express-rate-limit');

const ipBlockList = new Set((process.env.IP_BLOCK_LIST || '').split(',').filter(Boolean));
const ipAllowList = new Set((process.env.ADMIN_IP_ALLOW_LIST || '127.0.0.1,::1').split(',').filter(Boolean));

const blockListedIps = (req, res, next) => {
  if (ipBlockList.has(req.ip)) return res.status(403).json({ message: 'IP blocked' });
  return next();
};

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts' }
});

module.exports = { generalLimiter, authLimiter, ipBlockList, ipAllowList, blockListedIps };
