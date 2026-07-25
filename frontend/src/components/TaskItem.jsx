import { Link } from 'react-router-dom';
import Icon from './Icons';
import { formatDate } from '../utils/helpers';

export default function TaskItem({ task, onStatus }) {
  return (
    <article className="task-item">
      <div className="spaced">
        <Link className="task-title" to={`/tasks/${task._id}`}><span><Icon name={task.status === 'done' ? 'check' : 'flag'} size={16} /></span><strong>{task.title}</strong></Link>
        <div className="row"><span className={`badge ${task.status}`}>{task.status}</span><span className={`badge ${task.priority}`}>{task.priority}</span></div>
      </div>
      {task.description && <p className="muted">{task.description.slice(0, 180)}</p>}
      <div className="spaced">
        <span className={task.isOverdue ? 'error meta' : 'muted meta'}><Icon name="calendar" size={16} />{formatDate(task.dueDate)}</span>
        {onStatus && <button className="secondary small" onClick={() => onStatus(task)}><Icon name="check" size={16} />Toggle done</button>}
      </div>
    </article>
  );
}
