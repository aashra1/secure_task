import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    process.env.REACT_APP_API_URL ||
    "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await api.post(
          "/auth/refresh-token",
          refreshToken ? { refreshToken } : {},
        );
        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
          if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
