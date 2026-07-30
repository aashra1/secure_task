import api from "./api";

export const register = (payload) =>
  api.post("/auth/register", payload).then((r) => r.data);
export const login = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);
export const googleLogin = (credential) =>
  api.post("/auth/google", { credential }).then((r) => r.data);
export const verifyMfa = (payload) =>
  api.post("/auth/verify-mfa", payload).then((r) => r.data);
export const setupMfa = () => api.post("/auth/mfa/setup").then((r) => r.data);
export const confirmMfa = (token) =>
  api.post("/auth/mfa/confirm", { token }).then((r) => r.data);
export const disableMfa = () =>
  api.post("/auth/mfa/disable").then((r) => r.data);
export const logout = () =>
  api.post("/auth/logout").then((r) => {
    localStorage.removeItem("authSession");
    return r.data;
  });
export const refreshToken = () =>
  api.post("/auth/refresh-token").then((r) => r.data);
export const changePassword = (payload) =>
  api.post("/auth/password/change", payload).then((r) => r.data);
