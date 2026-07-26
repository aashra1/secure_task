const { body } = require('express-validator');

const passwordRule = body('password')
  .isLength({ min: 12, max: 128 }).withMessage('Password must be 12-128 characters')
  .matches(/[a-z]/).withMessage('Password needs lowercase')
  .matches(/[A-Z]/).withMessage('Password needs uppercase')
  .matches(/\d/).withMessage('Password needs number')
  .matches(/[^A-Za-z0-9]/).withMessage('Password needs special character');

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  passwordRule,
  body('profile.name').optional().trim().isLength({ min: 1, max: 120 }),
  body('name').optional().trim().isLength({ min: 1, max: 120 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty()
];

const mfaValidation = [
  body('token').isString().trim().isLength({ min: 6, max: 32 })
];

const passwordResetValidation = [
  body('email').isEmail().normalizeEmail()
];

const newPasswordValidation = [
  body('newPassword')
    .isLength({ min: 12, max: 128 })
    .matches(/[a-z]/)
    .matches(/[A-Z]/)
    .matches(/\d/)
    .matches(/[^A-Za-z0-9]/)
];

module.exports = { registerValidation, loginValidation, mfaValidation, passwordResetValidation, newPasswordValidation };
