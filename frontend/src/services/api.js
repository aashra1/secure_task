import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    process.env.REACT_APP_API_URL ||
    "https://localhost:3000/api",
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrfToken",
  xsrfHeaderName: "X-CSRF-Token",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const csrfCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrfToken="));
  if (
    csrfCookie &&
    !["get", "head", "options"].includes(config.method?.toLowerCase())
  ) {
    config.headers["X-CSRF-Token"] = decodeURIComponent(
      csrfCookie.split("=").slice(1).join("="),
    );
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("authSession") === "1" &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        await api.post("/auth/refresh-token");
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("authSession");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
