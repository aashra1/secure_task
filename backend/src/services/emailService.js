const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } : undefined
});

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || (process.env.NODE_ENV !== 'production' && /example\.com$/i.test(process.env.EMAIL_HOST || ''))) {
    logger.info({ message: 'Email skipped in development', to, subject });
    return { skipped: true };
  }
  return transporter().sendMail({ from: process.env.EMAIL_USER, to, subject, html, text });
};

const sendVerificationEmail = (user, token) => {
  const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your SecureTask email',
    text: `Verify your email: ${link}`,
    html: `<p>Hello ${user.profile.name},</p><p>Verify your SecureTask email:</p><p><a href="${link}">Verify email</a></p>`
  });
};

const sendResetPasswordEmail = (user, token) => {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your SecureTask password',
    text: `Reset your password: ${link}`,
    html: `<p>Use this secure link to reset your password. It expires soon.</p><p><a href="${link}">Reset password</a></p>`
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendResetPasswordEmail };
