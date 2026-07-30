import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import Icon from "../components/Icons";
import PasswordField from "../components/PasswordField";
import { createCaptchaPayload } from "../services/captcha";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const captcha = await createCaptchaPayload("login");
      const data = await login({ ...form, ...captcha });
      navigate(data.mfaRequired ? "/mfa/verify" : "/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-hero">
          <span className="brand-mark large">
            <Icon name="shield" />
          </span>
          <p className="eyebrow">Encrypted task workspace</p>
          <h1>SecureTask</h1>
          <p className="muted">
            Sign in to protect deadlines, priorities, and project notes behind
            your account.
          </p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <span className="input-wrap">
              <Icon name="mail" />
              <input
                className="with-leading"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </span>
          </label>
          <PasswordField
            autoComplete="current-password"
            label="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="error">{error}</p>}
          <button disabled={submitting}>
            <Icon name="lock" size={18} />
            {submitting ? "Verifying…" : "Login"}
          </button>
          <Link className="muted center-link" to="/register">
            Create an account
          </Link>
        </form>
      </section>
    </main>
  );
}
