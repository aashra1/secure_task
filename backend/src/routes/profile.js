const express = require('express');
const { body, param, validationResult } = require('express-validator');
const controller = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

router.use(authenticate);
router.get('/me', controller.getProfile);
router.put('/me', body('name').optional().isLength({ min: 1, max: 120 }), body('bio').optional().isLength({ max: 500 }), validate, controller.updateProfile);
router.post('/me/avatar', body('avatarUrl').isURL({ require_protocol: true }), validate, controller.uploadAvatar);
router.delete('/me', controller.deleteAccount);
router.get('/me/export', controller.exportData);
router.post('/me/import', controller.importData);
router.get('/admin/users', authorize('admin'), controller.adminGetUsers);
router.put('/admin/users/:id', authorize('admin'), param('id').isMongoId(), body('role').optional().isIn(['user', 'moderator', 'admin']), validate, controller.adminUpdateUser);
router.delete('/admin/users/:id', authorize('admin'), param('id').isMongoId(), validate, controller.adminDeleteUser);
router.post('/admin/users/:id/security', authorize('admin'), param('id').isMongoId(), body('action').isIn(['reset_mfa', 'unlock']), validate, controller.adminSecurityAction);
router.get('/admin/audit-logs', authorize('admin'), controller.adminAuditLogs);

module.exports = router;
