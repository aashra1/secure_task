const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, mfaValidation, passwordResetValidation, newPasswordValidation } = require('../validations/authValidation');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

router.post('/register', authLimiter, registerValidation, validate, controller.register);
router.post('/login', authLimiter, loginValidation, validate, controller.login);
router.post('/verify-mfa', authLimiter, body('userId').isMongoId(), mfaValidation, validate, controller.verifyMfa);
router.post('/mfa/setup', authenticate, controller.setupMfa);
router.post('/mfa/confirm', authenticate, mfaValidation, validate, controller.confirmMfa);
router.post('/mfa/disable', authenticate, controller.disableMfa);
router.post('/refresh-token', authLimiter, controller.refreshToken);
router.post('/logout', authenticate, controller.logout);
router.post('/password/change', authenticate, body('currentPassword').isString().notEmpty(), newPasswordValidation, validate, controller.changePassword);
router.post('/password/reset-request', authLimiter, passwordResetValidation, validate, controller.requestPasswordReset);
router.post('/password/reset', authLimiter, body('token').isString().isLength({ min: 32 }), newPasswordValidation, validate, controller.resetPassword);
router.get('/verify-email/:token', controller.verifyEmail);
router.post('/verify-email/resend', authenticate, controller.resendVerification);

module.exports = router;
