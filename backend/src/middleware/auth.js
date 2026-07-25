const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: payload.sub, isActive: true });
    if (!user || !user.sessions.some((session) => session.jti === payload.jti && session.expiresAt > new Date())) {
      return res.status(401).json({ message: 'Session expired' });
    }
    req.user = user;
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
  return next();
};

const checkOwnership = (resource = 'task') => async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: 'Resource not found' });
  if (resource === 'task') {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Resource not found' });
    req.task = task;
  }
  return next();
};

const requireMfa = (req, res, next) => {
  if (req.user.mfa?.enabled && !req.auth?.mfa) return res.status(403).json({ message: 'MFA required' });
  return next();
};

module.exports = { authenticate, authorize, checkOwnership, requireMfa };
