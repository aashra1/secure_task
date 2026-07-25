import { Link } from "react-router-dom";
import Icon from "../components/Icons";
import TaskList from "../components/TaskList";
import useTasks from "../hooks/useTasks";
import { taskCounts } from "../utils/helpers";

export default function Dashboard() {
  const { data, loading } = useTasks({ limit: 5 });
  const counts = taskCounts(data.items);
  return (
    <main className="container grid">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Today at a glance</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Your secure task overview, tuned for quick scanning.
          </p>
        </div>
        <Link to="/tasks">
          <button>
            <Icon name="list" size={18} />
            Manage tasks
          </button>
        </Link>
      </section>
      <section className="grid three">
        <div className="stat-card todo">
          <Icon name="flag" />
          <strong>{counts.todo || 0}</strong>
          <p>Todo</p>
        </div>
        <div className="stat-card progress">
          <Icon name="spark" />
          <strong>{counts.in_progress || 0}</strong>
          <p>In progress</p>
        </div>
        <div className="stat-card done">
          <Icon name="check" />
          <strong>{counts.done || 0}</strong>
          <p>Done</p>
        </div>
      </section>
      <section className="section-head">
        <div>
          <h2>Recent tasks</h2>
          <p className="muted">The latest five items in your workspace.</p>
        </div>
      </section>
      {loading ? (
        <div className="card center">
          <span className="spinner" />
          Loading...
        </div>
      ) : (
        <TaskList tasks={data.items} />
      )}
    </main>
  );
}
