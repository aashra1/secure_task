import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import useAuth from "../hooks/useAuth";
import Icon from "../components/Icons";
import PasswordField from "../components/PasswordField";
import GoogleSignIn from "../components/GoogleSignIn";
import CaptchaCheckbox from "../components/CaptchaCheckbox";

export default function Login() {
  const { user, login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const captchaError = useCallback((err) => setError(err.message), []);
  const captchaChange = useCallback((token) => setCaptchaToken(token), []);
  if (user) return <Navigate to="/" replace />;
  const submit = async (event) => {
    event.preventDefault();
    if (!captchaToken) {
      setError("Please complete the CAPTCHA before logging in.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data = await login({
        ...form,
        captchaToken,
        captchaVersion: "v2",
      });
      navigate(data.mfaRequired ? "/mfa/verify" : "/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
      setCaptchaToken("");
      setCaptchaAttempt((attempt) => attempt + 1);
    } finally {
      setSubmitting(false);
    }
  };
  const signInWithGoogle = async (credential) => {
    setError("");
    try {
      const data = await googleLogin(credential);
      navigate(data.mfaRequired ? "/mfa/verify" : "/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Google sign-in failed");
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
        <GoogleSignIn
          onCredential={signInWithGoogle}
          onError={(err) => setError(err.message)}
        />
        <div className="auth-divider"><span>or use your email</span></div>
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
          <CaptchaCheckbox
            key={captchaAttempt}
            onChange={captchaChange}
            onError={captchaError}
          />
          {error && <p className="error">{error}</p>}
          <button disabled={submitting || !captchaToken}>
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
