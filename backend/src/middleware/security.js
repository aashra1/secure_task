const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
});

const sanitizeInput = (req, _res, next) => {
  const clean = (value) => {
    if (typeof value === "string") return xss(value);
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, clean(v)]),
      );
    return value;
  };
  req.body = clean(req.body || {});
  req.query = clean(req.query || {});
  next();
};

const preventNoSqlInjection = mongoSanitize({ replaceWith: "_" });

module.exports = { securityHeaders, sanitizeInput, preventNoSqlInjection };
