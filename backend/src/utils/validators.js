const xss = require('xss');

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 12) errors.push('Password must be at least 12 characters');
  if (password && password.length > 128) errors.push('Password must be at most 128 characters');
  if (!/[a-z]/.test(password || '')) errors.push('Password must include a lowercase letter');
  if (!/[A-Z]/.test(password || '')) errors.push('Password must include an uppercase letter');
  if (!/\d/.test(password || '')) errors.push('Password must include a number');
  if (!/[^A-Za-z0-9]/.test(password || '')) errors.push('Password must include a special character');
  return { valid: errors.length === 0, errors };
};

const sanitizeUserInput = (value) => {
  if (typeof value === 'string') return xss(value.trim());
  if (Array.isArray(value)) return value.map(sanitizeUserInput);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, sanitizeUserInput(val)]));
  }
  return value;
};

module.exports = { validateEmail, validatePassword, sanitizeUserInput };
