import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResponse, AuthUser } from "../services/auth";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (resp: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = "magicdraw_auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // load from storage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string; isAdmin?: boolean };
        setUser(parsed.user);
        setToken(parsed.token);
        setIsAdmin(!!parsed.isAdmin);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = (resp: AuthResponse) => {
    setUser(resp.user);
    setToken(resp.token);
    setIsAdmin(resp.isAdmin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resp));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, token, isAdmin, login, logout }), [user, token, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
