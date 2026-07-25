import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Icon from "../components/Icons";
import useAuth from "../hooks/useAuth";

export default function MFAVerification() {
  const { mfaChallenge, verifyMfa } = useAuth();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  if (!mfaChallenge) return <Navigate to="/login" replace />;
  const submit = async (event) => {
    event.preventDefault();
    try {
      await verifyMfa(token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid token");
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-hero">
          <span className="brand-mark large">
            <Icon name="key" />
          </span>
          <p className="eyebrow">Second factor</p>
          <h1>MFA verification</h1>
          <p className="muted">
            Enter the code from your authenticator app or one of your backup
            codes.
          </p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Authenticator or backup code
            <span className="input-wrap">
              <Icon name="key" />
              <input
                className="with-leading code-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </span>
          </label>
          {error && <p className="error">{error}</p>}
          <button>
            <Icon name="check" size={18} />
            Verify
          </button>
        </form>
      </section>
    </main>
  );
}
