import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResponse } from "../services/auth";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  age?: number;
  gender?: string;
  profilePictureUrl?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (resp: AuthResponse) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = "magicdraw_auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // load from storage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = (resp: AuthResponse) => {
    setUser(resp.user);
    setToken(resp.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resp));
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
    if (token) {
      const stored = { token, user: updatedUser };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, token, login, updateUser, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
