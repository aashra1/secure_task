const express = require('express');
const { param, validationResult } = require('express-validator');
const controller = require('../controllers/taskController');
const { authenticate, authorize, checkOwnership } = require('../middleware/auth');
const { createTaskValidation, updateTaskValidation } = require('../validations/taskValidation');

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return next();
};

router.use(authenticate);
router.get('/admin/all', authorize('admin'), controller.adminGetAllTasks);
router.get('/', controller.getTasks);
router.post('/', createTaskValidation, validate, controller.createTask);
router.get('/:id', param('id').isMongoId(), validate, checkOwnership('task'), controller.getTaskById);
router.put('/:id', param('id').isMongoId(), updateTaskValidation, validate, checkOwnership('task'), controller.updateTask);
router.delete('/:id', param('id').isMongoId(), validate, checkOwnership('task'), controller.deleteTask);

module.exports = router;
