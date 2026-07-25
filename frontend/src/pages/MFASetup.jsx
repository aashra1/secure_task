import { useState } from 'react';
import Icon from '../components/Icons';
import { confirmMfa, setupMfa } from '../services/auth';

export default function MFASetup() {
  const [setup, setSetup] = useState(null);
  const [token, setToken] = useState('');
  const [codes, setCodes] = useState([]);
  const start = async () => setSetup(await setupMfa());
  const confirm = async (event) => {
    event.preventDefault();
    const data = await confirmMfa(token);
    setCodes(data.backupCodes);
  };
  return (
    <section className="card grid mfa-card">
      <div className="spaced">
        <div><h2><Icon name="qr" />Two-step verification</h2><p className="muted">Use an authenticator app code when signing in, in addition to your password.</p></div>
        <button onClick={start}><Icon name="qr" size={18} />Generate QR</button>
      </div>
      {setup && (
        <div className="mfa-grid">
          <img src={setup.qrCode} alt="MFA QR code" width="220" />
          <form className="form" onSubmit={confirm}>
            <label>6 digit code<span className="input-wrap"><Icon name="key" /><input className="with-leading code-input" value={token} onChange={(e) => setToken(e.target.value)} /></span></label>
            <button><Icon name="check" size={18} />Confirm MFA</button>
          </form>
        </div>
      )}
      {codes.length > 0 && <div className="backup-codes"><h3>Backup codes</h3><pre>{codes.join('\n')}</pre></div>}
    </section>
  );
}
