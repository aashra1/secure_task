import { Link, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import Icon from "../components/Icons";
import PasswordField from "../components/PasswordField";
import GoogleSignIn from "../components/GoogleSignIn";
import { register } from "../services/auth";
import CaptchaCheckbox from "../components/CaptchaCheckbox";
import { passwordScore } from "../utils/helpers";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const captchaError = useCallback((err) => setMessage(err.message), []);
  const captchaChange = useCallback((token) => setCaptchaToken(token), []);
  const score = passwordScore(form.password);
  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm)
      return setMessage("Passwords do not match");
    if (!captchaToken)
      return setMessage("Please complete the CAPTCHA before registering.");
    setMessage("");
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        profile: { name: form.name },
        captchaToken,
        captchaVersion: "v2",
      });
      navigate("/login");
    } catch (err) {
      const validationError = err.response?.data?.errors?.[0]?.msg;
      setMessage(
        validationError ||
          err.response?.data?.message ||
          err.message ||
          "Registration failed",
      );
      setCaptchaToken("");
      setCaptchaAttempt((attempt) => attempt + 1);
    } finally {
      setSubmitting(false);
    }
  };
  const signUpWithGoogle = async (credential) => {
    setMessage("");
    try {
      const data = await googleLogin(credential);
      navigate(data.mfaRequired ? "/mfa/verify" : "/");
    } catch (err) {
      setMessage(
        err.response?.data?.message || err.message || "Google sign-up failed",
      );
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
        <GoogleSignIn
          text="signup_with"
          onCredential={signUpWithGoogle}
          onError={(err) => setMessage(err.message)}
        />
        <div className="auth-divider"><span>or register with email</span></div>
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
          <CaptchaCheckbox
            key={captchaAttempt}
            onChange={captchaChange}
            onError={captchaError}
          />
          {message && <p className="error">{message}</p>}
          <button disabled={submitting || !captchaToken}>
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
