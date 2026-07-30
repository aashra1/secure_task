import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Icon from "../components/Icons";
import PasswordField from "../components/PasswordField";
import { register } from "../services/auth";
import { createCaptchaPayload } from "../services/captcha";
import { passwordScore } from "../utils/helpers";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const score = passwordScore(form.password);
  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm)
      return setMessage("Passwords do not match");
    setMessage("");
    setSubmitting(true);
    try {
      const captcha = await createCaptchaPayload("register");
      await register({
        email: form.email,
        password: form.password,
        profile: { name: form.name },
        ...captcha,
      });
      navigate("/login");
    } catch (err) {
      setMessage(
        err.response?.data?.message || err.message || "Registration failed",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card wide">
        <div className="auth-hero">
          <span className="brand-mark large">
            <Icon name="user" />
          </span>
          <p className="eyebrow">Start securely</p>
          <h1>Create account</h1>
          <p className="muted">
            A quieter place to track work that should not live in a messy inbox.
          </p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Name
            <span className="input-wrap">
              <Icon name="user" />
              <input
                className="with-leading"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </span>
          </label>
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
            autoComplete="new-password"
            label="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <div className="strength">
            <progress max="5" value={score} />
            <span>{score}/5</span>
          </div>
          <p className="muted tiny">
            Use 12-128 chars with uppercase, lowercase, number, and special
            character.
          </p>
          <PasswordField
            autoComplete="new-password"
            label="Confirm password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          {message && <p className="error">{message}</p>}
          <button disabled={submitting}>
            <Icon name="check" size={18} />
            {submitting ? "Verifying…" : "Register"}
          </button>
          <Link className="muted center-link" to="/login">
            Back to login
          </Link>
        </form>
      </section>
    </main>
  );
}
