import { useState } from 'react';
import Icon from './Icons';

export default function PasswordField({ label, value, onChange, required = false, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="input-wrap">
        <Icon name="lock" />
        <input
          autoComplete={autoComplete}
          className="with-leading with-trailing"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="icon-button input-action"
          title={visible ? 'Hide password' : 'Show password'}
          type="button"
          onClick={() => setVisible((current) => !current)}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </span>
    </label>
  );
}
