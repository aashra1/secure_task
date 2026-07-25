import { useEffect, useState } from "react";
import Icon from "../components/Icons";
import { adminGetUsers, adminUpdateUser } from "../services/profile";
import { adminGetAllTasks } from "../services/tasks";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const load = async () => {
    setUsers(await adminGetUsers());
    setTasks(await adminGetAllTasks());
  };
  useEffect(() => {
    load();
  }, []);
  const role = async (user, nextRole) => {
    await adminUpdateUser(user._id, { role: nextRole });
    load();
  };
  return (
    <main className="container grid">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Control room</p>
          <h1>Admin</h1>
          <p className="muted">
            Review users and adjust roles from one secure surface.
          </p>
        </div>
      </section>
      <section className="grid three">
        <div className="stat-card">
          <Icon name="users" />
          <strong>{users.length}</strong>
          <p>Users</p>
        </div>
        <div className="stat-card">
          <Icon name="list" />
          <strong>{tasks.length}</strong>
          <p>Tasks</p>
        </div>
        <div className="stat-card done">
          <Icon name="check" />
          <strong>{users.filter((u) => u.isActive).length}</strong>
          <p>Active users</p>
        </div>
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Users</h2>
            <p className="muted">
              Change roles without leaving the admin panel.
            </p>
          </div>
        </div>
        <div className="admin-list">
          {users.map((user) => (
            <div className="admin-row" key={user._id}>
              <div>
                <strong>{user.profile?.name || user.email}</strong>
                <p className="muted">{user.email}</p>
              </div>
              <select
                value={user.role}
                onChange={(e) => role(user, e.target.value)}
              >
                <option value="user">user</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
