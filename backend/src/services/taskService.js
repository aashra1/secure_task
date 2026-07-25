const Task = require('../models/Task');
const { logAudit } = require('./authService');

const allowedTaskFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags', 'subtasks', 'attachments'];
const pick = (source, fields) => Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));

const createTask = async (req) => {
  const task = await Task.create({ ...pick(req.body, allowedTaskFields), user: req.user._id });
  await logAudit(req, 'TASK_CREATED', 'success', { taskId: task._id });
  return task;
};

const getTasks = async (req) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const filter = { user: req.user._id };
  ['status', 'priority'].forEach((field) => {
    if (req.query[field]) filter[field] = req.query[field];
  });
  if (req.query.tag) filter.tags = req.query.tag;
  const sort = ['dueDate', '-dueDate', 'createdAt', '-createdAt', 'priority', '-priority'].includes(req.query.sort) ? req.query.sort : '-createdAt';
  const [items, total] = await Promise.all([
    Task.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter)
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
};

const getTaskById = async (req) => req.task || Task.findOne({ _id: req.params.id, user: req.user._id });

const updateTask = async (req) => {
  const task = req.task || await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
  Object.assign(task, pick(req.body, allowedTaskFields));
  await task.save();
  await logAudit(req, 'TASK_UPDATED', 'success', { taskId: task._id });
  return task;
};

const deleteTask = async (req) => {
  const task = req.task || await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
  await task.deleteOne();
  await logAudit(req, 'TASK_DELETED', 'success', { taskId: task._id });
};

const getTasksByUser = async (userId) => Task.find({ user: userId }).sort('-createdAt');

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getTasksByUser, allowedTaskFields };
