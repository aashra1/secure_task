import api from "./api";

let siteKeyPromise;
let scriptPromise;

const getSiteKey = () => {
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

const loadRecaptcha = (siteKey) => {
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new Error("Unable to load CAPTCHA. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

export const createCaptchaPayload = async (action) => {
  const siteKey = await getSiteKey();
  if (!siteKey) return {};

  const recaptcha = await loadRecaptcha(siteKey);
  if (!recaptcha) throw new Error("CAPTCHA did not initialize. Please try again.");

  const captchaToken = await new Promise((resolve, reject) => {
    recaptcha.ready(() => {
      recaptcha.execute(siteKey, { action }).then(resolve).catch(reject);
    });
  });

  if (!captchaToken) throw new Error("CAPTCHA verification could not be started.");
  return { captchaToken, captchaVersion: "v3" };
};
