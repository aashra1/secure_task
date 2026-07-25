const { body } = require('express-validator');

const createTaskValidation = [
  body('title').trim().isLength({ min: 1, max: 160 }),
  body('description').optional().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().trim().isLength({ min: 1, max: 32 })
];

const updateTaskValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 160 }),
  body('description').optional().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  body('tags').optional().isArray({ max: 20 }),
  body('tags.*').optional().trim().isLength({ min: 1, max: 32 })
];

module.exports = { createTaskValidation, updateTaskValidation };
