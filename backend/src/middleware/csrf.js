const crypto = require("crypto");

const CSRF_COOKIE = "csrfToken";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const secret = () => process.env.CSRF_SECRET || process.env.SESSION_SECRET;

const sign = (nonce) =>
  crypto.createHmac("sha256", secret()).update(nonce).digest("base64url");

const createToken = () => {
  const nonce = crypto.randomBytes(32).toString("base64url");
  return `${nonce}.${sign(nonce)}`;
};

const validSignedToken = (token) => {
  if (!token || typeof token !== "string" || token.length > 160) return false;
  const [nonce, signature, extra] = token.split(".");
  if (!nonce || !signature || extra) return false;
  const expected = sign(nonce);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const csrfProtection = (req, res, next) => {
  if (!secret()) {
    return res.status(500).json({ message: "CSRF protection is not configured" });
  }

  let cookieToken = req.cookies[CSRF_COOKIE];
  if (!validSignedToken(cookieToken)) {
    cookieToken = createToken();
    res.cookie(CSRF_COOKIE, cookieToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 2 * 60 * 60 * 1000,
    });
  }

  if (SAFE_METHODS.has(req.method)) return next();

  const headerToken = req.get("x-csrf-token");
  const headerBuffer = Buffer.from(String(headerToken || ""));
  const cookieBuffer = Buffer.from(String(cookieToken || ""));
  if (
    !validSignedToken(cookieToken) ||
    headerBuffer.length !== cookieBuffer.length ||
    !crypto.timingSafeEqual(headerBuffer, cookieBuffer)
  ) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next();
};

module.exports = { csrfProtection };
