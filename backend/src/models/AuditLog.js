const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: [
      'REGISTER', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'MFA_SETUP',
      'MFA_CONFIRMED', 'MFA_DISABLED', 'PASSWORD_CHANGED', 'PASSWORD_RESET',
      'MFA_VERIFICATION_FAILED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_LOGIN',
      'EMAIL_VERIFIED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED',
      'PROFILE_UPDATED', 'ACCOUNT_DEACTIVATED', 'ADMIN_ACTION'
    ],
    required: true
  },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
