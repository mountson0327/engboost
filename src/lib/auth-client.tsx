"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export type Role = "admin" | "user";
export type Me = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type AuthValue = {
  user: Me | null;
  effectiveRole: Role;
  viewMode: "admin" | "user" | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setViewMode: (mode: "admin" | "user") => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<Role>("user");
  const [viewMode, setViewModeState] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      setUser(d.user ?? null);
      setEffectiveRole(d.effectiveRole ?? "user");
      setViewModeState(d.viewMode ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setViewMode = useCallback(
    async (mode: "admin" | "user") => {
      await fetch("/api/auth/view-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      await refresh();
      router.refresh();
    },
    [refresh, router],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, effectiveRole, viewMode, loading, refresh, setViewMode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      effectiveRole: "user",
      viewMode: null,
      loading: false,
      refresh: async () => {},
      setViewMode: async () => {},
      logout: async () => {},
    };
  }
  return ctx;
}
