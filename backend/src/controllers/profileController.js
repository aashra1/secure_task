const Task = require('../models/Task');
const User = require('../models/User');
const authService = require('../services/authService');
const taskService = require('../services/taskService');
const AuditLog = require('../models/AuditLog');

const allowedProfileFields = ['name', 'bio', 'avatarUrl'];
const pick = (source, fields) => Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));

const getProfile = async (req, res) => res.json({ user: req.user });

const updateProfile = async (req, res, next) => {
  try {
    req.user.profile = { ...req.user.profile.toObject?.() || req.user.profile, ...pick(req.body.profile || req.body, allowedProfileFields) };
    await req.user.save();
    await authService.logAudit(req, 'PROFILE_UPDATED');
    res.json({ user: req.user });
  } catch (error) { next(error); }
};

const changePassword = (req, res, next) => require('./authController').changePassword(req, res, next);

const uploadAvatar = async (req, res, next) => {
  try {
    req.user.profile.avatarUrl = req.body.avatarUrl;
    await req.user.save();
    res.json({ user: req.user });
  } catch (error) { next(error); }
};

const deleteAccount = async (req, res, next) => {
  try {
    req.user.isActive = false;
    req.user.sessions = [];
    await req.user.save();
    await authService.logAudit(req, 'ACCOUNT_DEACTIVATED');
    res.clearCookie('accessToken', authService.cookieOptions());
    res.clearCookie('refreshToken', authService.cookieOptions());
    res.status(204).send();
  } catch (error) { next(error); }
};

const exportData = async (req, res, next) => {
  try {
    const tasks = await taskService.getTasksByUser(req.user._id);
    res.json({ exportedAt: new Date(), user: req.user, tasks });
  } catch (error) { next(error); }
};

const importData = async (req, res, next) => {
  try {
    const tasks = Array.isArray(req.body.tasks) ? req.body.tasks.slice(0, 100) : [];
    const created = await Task.insertMany(tasks.map((task) => ({
      ...pick(task, taskService.allowedTaskFields),
      user: req.user._id
    })));
    res.status(201).json({ imported: created.length });
  } catch (error) { next(error); }
};

const adminGetUsers = async (_req, res, next) => {
  try { res.json(await User.find().sort('-createdAt').limit(500)); } catch (error) { next(error); }
};

const adminUpdateUser = async (req, res, next) => {
  try {
    const allowed = ['role', 'isActive', 'isEmailVerified'];
    const user = await User.findByIdAndUpdate(req.params.id, pick(req.body, allowed), { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await authService.logAudit(req, 'ADMIN_ACTION', 'success', { targetUser: req.params.id, action: 'update_user' });
    return res.json(user);
  } catch (error) { return next(error); }
};

const adminDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false, sessions: [] }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await authService.logAudit(req, 'ADMIN_ACTION', 'success', { targetUser: req.params.id, action: 'delete_user' });
    return res.status(204).send();
  } catch (error) { return next(error); }
};

const adminSecurityAction = async (req, res, next) => {
  try {
    const update = req.body.action === 'reset_mfa' ? { 'mfa.enabled': false, 'mfa.secret': undefined, 'mfa.pendingSecret': undefined, 'mfa.backupCodes': [] } : { failedLoginAttempts: 0, lockUntil: undefined, lastFailedLoginAt: undefined };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await authService.logAudit(req, 'ADMIN_ACTION', 'success', { targetUser: req.params.id, action: req.body.action });
    return res.json({ message: 'Security action applied' });
  } catch (error) { return next(error); }
};

const adminAuditLogs = async (_req, res, next) => { try { return res.json(await AuditLog.find().sort('-createdAt').limit(500)); } catch (error) { return next(error); } };

module.exports = {
  getProfile, updateProfile, changePassword, uploadAvatar, deleteAccount,
  exportData, importData, adminGetUsers, adminUpdateUser, adminDeleteUser, adminSecurityAction, adminAuditLogs
};
