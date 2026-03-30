import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import type { User } from "../types/user.type";
import { api } from "../api/api";

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
  try {
    const data = await api<{ user: User }>("/auth/me");
    setUser(data.user);
  } catch {
    setUser(null);
  }
};

async function login(email: string, password: string) {
  const data = await api<User>("/auth/login", { method: "POST", body: { email, password } });
  setUser(data); // backend returns user directly, no wrapper
}

async function signup(email: string, password: string, firstName: string, lastName: string) {
  const data = await api<User>("/auth/signup", { method: "POST", body: { email, password, firstName, lastName } });
  setUser(data); // same shape
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