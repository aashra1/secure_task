const crypto = require('crypto');

const getKey = () => {
  const material = process.env.MFA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!material && process.env.NODE_ENV === 'production') {
    throw new Error('MFA_ENCRYPTION_KEY is required in production');
  }
  return crypto.createHash('sha256').update(material || process.env.JWT_SECRET || 'development-only-key').digest();
};

const encrypt = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (payload) => {
  const [ivHex, tagHex, encryptedHex] = String(payload).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
};

const decryptIfEncrypted = (payload) => {
  if (!String(payload).includes(':')) return payload;
  return decrypt(payload);
};

module.exports = { encrypt, decrypt, decryptIfEncrypted };
