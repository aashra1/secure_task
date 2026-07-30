const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter, passwordResetLimiter, mfaLimiter, refreshLimiter } = require('../middleware/rateLimiter');
const { captcha } = require('../middleware/captcha');
const { registerValidation, loginValidation, mfaValidation, passwordResetValidation, newPasswordValidation } = require('../validations/authValidation');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

router.get('/captcha-config', (_req, res) => {
  const enabled = Boolean(process.env.CAPTCHA_SECRET_KEY);
  if (enabled && !process.env.CAPTCHA_SITE_KEY) {
    return res.status(503).json({ message: 'CAPTCHA site key is not configured' });
  }
  return res.json({ siteKey: enabled ? process.env.CAPTCHA_SITE_KEY : null });
});
router.get('/google-config', (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const configured =
    clientId &&
    !clientId.startsWith('your_') &&
    clientId.endsWith('.apps.googleusercontent.com');
  return res.json({ clientId: configured ? clientId : null });
});
router.post('/register', registerLimiter, captcha('register'), registerValidation, validate, controller.register);
router.post('/login', loginLimiter, captcha('login'), loginValidation, validate, controller.login);
router.post('/google', loginLimiter, body('credential').isString().notEmpty(), validate, controller.googleLogin);
router.post('/verify-mfa', mfaLimiter, mfaValidation, validate, controller.verifyMfa);
router.post('/mfa/setup', authenticate, controller.setupMfa);
router.post('/mfa/confirm', authenticate, mfaValidation, validate, controller.confirmMfa);
router.post('/mfa/disable', authenticate, controller.disableMfa);
router.post('/refresh-token', refreshLimiter, controller.refreshToken);
router.post('/logout', authenticate, controller.logout);
router.post('/password/change', authenticate, body('currentPassword').isString().notEmpty(), newPasswordValidation, validate, controller.changePassword);
router.post('/password/reset-request', passwordResetLimiter, captcha('forgot_password'), passwordResetValidation, validate, controller.requestPasswordReset);
router.post('/password/reset', passwordResetLimiter, newPasswordValidation, validate, controller.resetPassword);
router.get('/verify-email/:token', controller.verifyEmail);
router.post('/verify-email/resend', authenticate, controller.resendVerification);

module.exports = router;
