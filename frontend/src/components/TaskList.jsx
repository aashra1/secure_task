import TaskItem from './TaskItem';
import Icon from './Icons';

export default function TaskList({ tasks, onStatus }) {
  if (!tasks?.length) return <div className="empty-state"><Icon name="list" size={28} /><strong>No tasks yet.</strong><p className="muted">Create one when you are ready to organize the next thing.</p></div>;
  return <div className="task-list">{tasks.map((task) => <TaskItem key={task._id} task={task} onStatus={onStatus} />)}</div>;
}
