import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState({ loading: true, authenticated: false, email: null });

  const refresh = useCallback(async () => {
    try {
      const session = await api.getSession();
      setStatus({ loading: false, authenticated: !!session.authenticated, email: session.email || null });
    } catch {
      setStatus({ loading: false, authenticated: false, email: null });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(email, password) {
    await api.login(email, password);
    await refresh();
  }

  async function logout() {
    await api.logout();
    setStatus({ loading: false, authenticated: false, email: null });
  }

  return <AuthContext.Provider value={{ ...status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
