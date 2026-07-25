const Task = require('../models/Task');
const taskService = require('../services/taskService');

const createTask = async (req, res, next) => {
  try { res.status(201).json(await taskService.createTask(req)); } catch (error) { next(error); }
};
const getTasks = async (req, res, next) => {
  try { res.json(await taskService.getTasks(req)); } catch (error) { next(error); }
};
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json(task);
  } catch (error) { return next(error); }
};
const updateTask = async (req, res, next) => {
  try { res.json(await taskService.updateTask(req)); } catch (error) { next(error); }
};
const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req);
    res.status(204).send();
  } catch (error) { next(error); }
};
const adminGetAllTasks = async (req, res, next) => {
  try { res.json(await Task.find().populate('user', 'email profile.name role').sort('-createdAt').limit(500)); } catch (error) { next(error); }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, adminGetAllTasks };
