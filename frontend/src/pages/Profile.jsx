import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icons";
import PasswordField from "../components/PasswordField";
import MFASetup from "./MFASetup";
import useAuth from "../hooks/useAuth";
import { changePassword, disableMfa } from "../services/auth";
import { exportData, updateProfile } from "../services/profile";

export default function Profile() {
  const { user, refresh, clearSession } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: user.profile?.name || "",
    bio: user.profile?.bio || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await updateProfile(profile);
      await refresh();
      setMessage("Profile updated");
    } catch (err) {
      const validationMessage = err.response?.data?.errors?.[0]?.msg;
      setError(validationMessage || err.response?.data?.message || "Could not save profile");
    }
  };
  const change = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await changePassword(passwords);
      setMessage(data.message || "Password changed. Please sign in again.");
      setPasswords({ currentPassword: "", newPassword: "" });
      clearSession();
      navigate("/login");
    } catch (err) {
      const validationMessage = err.response?.data?.errors?.[0]?.msg;
      setError(validationMessage || err.response?.data?.message || "Could not change password");
    }
  };
  const download = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    window.location.href = URL.createObjectURL(blob);
  };
  return (
    <main className="container grid">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Account center</p>
          <h1>Profile</h1>
          <p className="muted">
            Manage identity, credentials, two-step verification, and your data export.
          </p>
        </div>
        <button className="secondary" onClick={download}>
          <Icon name="download" size={18} />
          Export data
        </button>
      </section>
      {message && <p className="success">{message}</p>}
      {error && <p className="error notice">{error}</p>}
      <section className="grid two">
        <form className="card form" onSubmit={save}>
          <h2>
            <Icon name="user" />
            Details
          </h2>
          <label>
            Name
            <span className="input-wrap">
              <Icon name="user" />
              <input
                className="with-leading"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </span>
          </label>
          <label>
            Bio
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </label>
          <button>
            <Icon name="check" size={18} />
            Save profile
          </button>
        </form>
        <form className="card form" onSubmit={change}>
          <h2>
            <Icon name="lock" />
            Password
          </h2>
          <PasswordField
            autoComplete="current-password"
            label="Current password"
            value={passwords.currentPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, currentPassword: e.target.value })
            }
          />
          <PasswordField
            autoComplete="new-password"
            label="New password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
          />
          <button>
            <Icon name="key" size={18} />
            Change password
          </button>
        </form>
      </section>
      <MFASetup />
      {user.mfa?.enabled && (
        <button className="secondary danger-soft" onClick={disableMfa}>
          <Icon name="lock" size={18} />
          Disable MFA
        </button>
      )}
    </main>
  );
}
