const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const { URL } = require("url");

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

const rejectNoSqlOperators = (req, res, next) => {
  const unsafeKey = (value) => {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(unsafeKey);
    return Object.entries(value).some(
      ([key, child]) =>
        key.startsWith("$") ||
        key.includes(".") ||
        ["__proto__", "prototype", "constructor"].includes(key) ||
        unsafeKey(child),
    );
  };
  if (unsafeKey(req.body) || unsafeKey(req.query) || unsafeKey(req.params)) {
    return res.status(400).json({ message: "Invalid request structure" });
  }
  return next();
};

const normalizeHost = (value) => {
  try {
    return new URL(`http://${value}`).hostname.toLowerCase();
  } catch {
    return "";
  }
};

const allowedHosts = () => {
  const configured = (process.env.ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => normalizeHost(host.trim()))
    .filter(Boolean);
  const frontendHosts = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => {
      try {
        return new URL(origin.trim()).hostname.toLowerCase();
      } catch {
        return "";
      }
    })
    .filter(Boolean);
  return new Set(["localhost", "127.0.0.1", "::1", ...frontendHosts, ...configured]);
};

const validateHostHeader = (req, res, next) => {
  // This application never uses a forwarded host. Rejecting it prevents an
  // upstream proxy mistake from turning it into a password-reset/URL poisoner.
  if (
    req.get("x-forwarded-host") ||
    req.get("x-original-host") ||
    /(?:^|[;,]\s*)host=/i.test(req.get("forwarded") || "")
  ) {
    return res.status(400).json({ message: "Untrusted forwarded host header" });
  }
  const rawHost = req.get("host");
  const host = normalizeHost(rawHost);
  if (!rawHost || !host || rawHost.includes(",") || !allowedHosts().has(host)) {
    return res.status(400).json({ message: "Invalid Host header" });
  }
  return next();
};

const rejectFileUploads = (req, res, next) => {
  const contentType = String(req.get("content-type") || "").toLowerCase();
  if (
    contentType.startsWith("multipart/form-data") ||
    contentType.startsWith("application/octet-stream") ||
    contentType.startsWith("application/pdf")
  ) {
    return res.status(415).json({ message: "File uploads are not supported" });
  }
  const containsFileField = (value) => {
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(containsFileField);
    return Object.entries(value).some(
      ([field, child]) =>
        ["file", "files", "attachment", "attachments", "document", "documents"].includes(
          field.toLowerCase(),
        ) || containsFileField(child),
    );
  };
  if (containsFileField(req.body)) {
    return res.status(400).json({ message: "File attachments are not allowed" });
  }
  return next();
};

module.exports = {
  securityHeaders,
  sanitizeInput,
  preventNoSqlInjection,
  rejectNoSqlOperators,
  validateHostHeader,
  rejectFileUploads,
};
