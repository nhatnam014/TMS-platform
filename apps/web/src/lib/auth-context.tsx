"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AuthUser {
  id: string | null;
  username: string | null;
  role: string | null;
}

const AuthContext = createContext<AuthUser>({ id: null, username: null, role: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>({ id: null, username: null, role: null });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUser({ id: data.id, username: data.username, role: data.role });
      })
      .catch(() => {});
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
