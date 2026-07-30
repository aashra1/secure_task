import api from "./api";

let siteKeyPromise;
let scriptPromise;

export const getCaptchaSiteKey = () => {
  if (!siteKeyPromise) {
    siteKeyPromise = api
      .get("/auth/captcha-config")
      .then(({ data }) => data.siteKey || null)
      .catch((error) => {
        siteKeyPromise = undefined;
        throw error;
      });
  }
  return siteKeyPromise;
};

export const loadRecaptcha = () => {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => {
      scriptPromise = undefined;
      reject(
        new Error("Unable to load CAPTCHA. Check your connection and try again."),
      );
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};
