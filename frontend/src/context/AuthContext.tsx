import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import axios from "axios";
import type { User } from "../types/user.type";
import { api } from "../api/api";

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    }
  };

  async function signup(email: string, password: string, name?: string) {
  const data = await api<User>("/auth/signup", { method: "POST", body: { email, password, name } });
  setUser(data);
}

async function login(email: string, password: string) {
  const data = await api<User>("/auth/login", { method: "POST", body: { email, password } });
  setUser(data);
}

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, refreshUser }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}