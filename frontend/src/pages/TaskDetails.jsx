import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icons";
import TaskForm from "../components/TaskForm";
import { deleteTask, getTask, updateTask } from "../services/tasks";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    getTask(id).then(setTask);
  }, [id]);
  if (!task)
    return (
      <main className="container">
        <div className="card center">
          <span className="spinner" />
          Loading...
        </div>
      </main>
    );
  const save = async (payload) => {
    setTask(await updateTask(id, payload));
    setEditing(false);
  };
  const remove = async () => {
    await deleteTask(id);
    navigate("/tasks");
  };
  return (
    <main className="container grid">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Task details</p>
          <h1>{task.title}</h1>
        </div>
        <div className="row">
          <button className="secondary" onClick={() => setEditing(!editing)}>
            <Icon name="edit" size={18} />
            Edit
          </button>
          <button className="danger" onClick={remove}>
            <Icon name="trash" size={18} />
            Delete
          </button>
        </div>
      </section>
      {editing ? (
        <section className="card form-card">
          <TaskForm
            task={task}
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        </section>
      ) : (
        <section className="detail-panel">
          <p className="description">
            {task.description || "No description added yet."}
          </p>
          <div className="row">
            <span className={`badge ${task.status}`}>{task.status}</span>
            <span className={`badge ${task.priority}`}>{task.priority}</span>
          </div>
          <div className="meta-grid">
            <span>
              <Icon name="tag" size={16} />
              {(task.tags || []).join(", ") || "No tags"}
            </span>
            <span>
              <Icon name="calendar" size={16} />
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "No due date"}
            </span>
          </div>
        </section>
      )}
    </main>
  );
}
