import { useState } from 'react';
import Icon from './Icons';

const initial = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', tags: '' };

export default function TaskForm({ task, onSubmit, onCancel }) {
  const [form, setForm] = useState(task ? { ...task, tags: (task.tags || []).join(', '), dueDate: task.dueDate?.slice(0, 10) || '' } : initial);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, tags: String(form.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean) });
  };
  return (
    <form className="form" onSubmit={submit}>
      <label>Title<span className="input-wrap"><Icon name="edit" /><input className="with-leading" value={form.title} onChange={(e) => update('title', e.target.value)} required maxLength="160" /></span></label>
      <label>Description<textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows="5" /></label>
      <div className="grid two">
        <label>Status<select value={form.status} onChange={(e) => update('status', e.target.value)}><option value="todo">Todo</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="archived">Archived</option></select></label>
        <label>Priority<select value={form.priority} onChange={(e) => update('priority', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
      </div>
      <label>Due date<span className="input-wrap"><Icon name="calendar" /><input className="with-leading" type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} /></span></label>
      <label>Tags<span className="input-wrap"><Icon name="tag" /><input className="with-leading" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="coursework, urgent" /></span></label>
      <div className="row"><button type="submit"><Icon name="check" size={18} />Save task</button>{onCancel && <button className="secondary" type="button" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}
