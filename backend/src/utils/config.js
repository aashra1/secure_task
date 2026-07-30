const assertStrongSecret = (name) => {
  const value = process.env[name];
  if (!value || Buffer.byteLength(value) < 32) {
    throw new Error(`${name} must be configured with at least 32 bytes`);
  }
  return value;
};

const validateSecurityConfig = () => {
  const accessSecret = assertStrongSecret("JWT_SECRET");
  const refreshSecret = assertStrongSecret("JWT_REFRESH_SECRET");
  assertStrongSecret("SESSION_SECRET");
  if (accessSecret === refreshSecret) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
  }
  if (process.env.NODE_ENV === "production" && !process.env.ENCRYPTION_KEY && !process.env.MFA_ENCRYPTION_KEY) {
    throw new Error("An MFA encryption key must be configured in production");
  }
};

module.exports = { validateSecurityConfig };
