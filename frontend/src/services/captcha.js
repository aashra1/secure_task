import api from "./api";

let siteKeyPromise;
let scriptPromise;

const waitForRecaptcha = (resolve, reject, attempts = 50) => {
  if (typeof window.grecaptcha?.render === "function") {
    resolve(window.grecaptcha);
    return;
  }

  if (attempts === 0) {
    scriptPromise = undefined;
    reject(new Error("CAPTCHA loaded incorrectly. Please refresh and try again."));
    return;
  }

  setTimeout(() => waitForRecaptcha(resolve, reject, attempts - 1), 100);
};

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
  if (typeof window.grecaptcha?.render === "function") {
    return Promise.resolve(window.grecaptcha);
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src*="google.com/recaptcha/api.js"]',
    );
    if (existingScript) {
      waitForRecaptcha(resolve, reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => waitForRecaptcha(resolve, reject);
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
