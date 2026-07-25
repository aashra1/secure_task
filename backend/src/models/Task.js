const mongoose = require('mongoose');
const xss = require('xss');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 160 },
  completed: { type: Boolean, default: false }
}, { _id: true });

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 5000 },
  status: { type: String, enum: ['todo', 'in_progress', 'done', 'archived'], default: 'todo', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  dueDate: Date,
  tags: [{ type: String, trim: true, maxlength: 32 }],
  subtasks: [subtaskSchema],
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  completedAt: Date
}, { timestamps: true });

taskSchema.virtual('isOverdue').get(function isOverdue() {
  return Boolean(this.dueDate && this.status !== 'done' && this.dueDate < new Date());
});

taskSchema.pre('validate', function sanitize(next) {
  if (this.title) this.title = xss(this.title);
  if (this.description) this.description = xss(this.description);
  if (this.tags) this.tags = this.tags.map((tag) => xss(tag));
  next();
});

taskSchema.pre('save', function setCompletedAt(next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'done' ? new Date() : undefined;
  }
  next();
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
