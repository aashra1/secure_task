import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../services/auth";
import api from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const response = await api.get("/profile/me");
      setUser(response.data.user || response.data);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    if (data.mfaRequired || data.requiresMfa) {
      setMfaChallenge(data.userId);
      return data;
    }
    setUser(data.user);
    return data;
  };

  const verifyMfa = async (token) => {
    const data = await authApi.verifyMfa({ userId: mfaChallenge, token });
    setUser(data.user);
    setMfaChallenge(null);
    return data;
  };

  const logout = async () => {
    await authApi.logout().catch(() => null);
    setUser(null);
    setMfaChallenge(null);
  };

  const clearSession = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setMfaChallenge(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      mfaChallenge,
      login,
      verifyMfa,
      logout,
      clearSession,
      refresh: loadUser,
      isAuthenticated: !!user,
    }),
    [user, loading, mfaChallenge, loadUser],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}
