import { useEffect, useRef } from "react";
import { getCaptchaSiteKey, loadRecaptcha } from "../services/captcha";

export default function CaptchaCheckbox({ onChange, onError }) {
  const container = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let active = true;

    Promise.all([getCaptchaSiteKey(), loadRecaptcha()])
      .then(([siteKey, recaptcha]) => {
        if (!active || !siteKey || !container.current) return;
        widgetId.current = recaptcha.render(container.current, {
          sitekey: siteKey,
          callback: (token) => onChange(token),
          "expired-callback": () => onChange(""),
          "error-callback": () => {
            onChange("");
            onError(new Error("CAPTCHA could not be loaded. Please try again."));
          },
        });
      })
      .catch(onError);

    return () => {
      active = false;
      onChange("");
      if (widgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetId.current);
      }
    };
  }, [onChange, onError]);

  return (
    <div className="captcha-field">
      <span>Human verification</span>
      <div ref={container} />
    </div>
  );
}
