import { useState } from "react";
import Icon from "../components/Icons";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import useTasks from "../hooks/useTasks";
import { createTask, updateTask } from "../services/tasks";

export default function Tasks() {
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [creating, setCreating] = useState(false);
  const { data, loading, error, reload } = useTasks(filters);
  const save = async (payload) => {
    await createTask(payload);
    setCreating(false);
    reload();
  };
  const toggle = async (task) => {
    await updateTask(task._id, {
      status: task.status === "done" ? "todo" : "done",
    });
    reload();
  };
  return (
    <main className="container grid">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Tasks</h1>
          <p className="muted">
            Filter, prioritize, and close the loop on secure work.
          </p>
        </div>
        <button onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          New task
        </button>
      </section>
      <section className="filter-bar">
        <Icon name="filter" />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </section>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <div className="card center">
          <span className="spinner" />
          Loading...
        </div>
      ) : (
        <TaskList tasks={data.items} onStatus={toggle} />
      )}
      {creating && (
        <div className="modal-backdrop">
          <section className="modal">
            <div className="spaced">
              <h2>New task</h2>
              <button
                className="icon-button"
                type="button"
                onClick={() => setCreating(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <TaskForm onSubmit={save} onCancel={() => setCreating(false)} />
          </section>
        </div>
      )}
    </main>
  );
}
