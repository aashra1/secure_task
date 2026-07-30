import { useEffect, useRef, useState } from "react";
import api from "../services/api";

let googleScriptPromise;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => {
      googleScriptPromise = undefined;
      reject(new Error("Unable to load Google sign-in"));
    };
    document.head.appendChild(script);
  });
  return googleScriptPromise;
};

export default function GoogleSignIn({ onCredential, onError, text = "signin_with" }) {
  const buttonRef = useRef(null);
  const credentialHandlerRef = useRef(onCredential);
  const errorHandlerRef = useRef(onError);
  const [available, setAvailable] = useState(true);
  credentialHandlerRef.current = onCredential;
  errorHandlerRef.current = onError;

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/auth/google-config").then(({ data }) => data.clientId),
      loadGoogleScript(),
    ])
      .then(([clientId]) => {
        if (!active || !clientId) {
          if (active) setAvailable(false);
          return;
        }
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => credentialHandlerRef.current(credential),
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          width: buttonRef.current.offsetWidth,
        });
      })
      .catch((error) => {
        if (active) {
          setAvailable(false);
          errorHandlerRef.current(error);
        }
      });

    return () => {
      active = false;
    };
  }, [text]);

  if (!available) return null;
  return <div className="google-sign-in" ref={buttonRef} />;
}
