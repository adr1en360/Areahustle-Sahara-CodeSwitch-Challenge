"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "./api";

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  userRole: "customer" | "hustler" | null;
  user: any;
  token: string | null;
  login: (data: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  areas: string[];
  setAreas: (areas: string[]) => void;
  updateDemoBalance: (role: string, amount: number) => void;
  addDemoTransaction: (txn: any) => void;
  voiceOpen: boolean;
  setVoiceOpen: (open: boolean) => void;
  addJob: (job: PostedJob) => void;
  triggerPayout: (payout: { gross: number; title: string; customer: string }) => void;
  refreshUser?: () => Promise<void>;
};

export type PostedJob = {
  id: number;
  title: string;
  area: string;
  dist: string;
  budget: number;
  rating: number;
  customer: string;
  cat: string;
  posted: string;
  isNew?: boolean;
};

const defaultUser = {
  id: 1,
  email: "demo@areahustle.ng",
  name: "Demo Hustler",
  role: "hustler",
  wallet_balance: 24500,
  trust_score: 820,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(defaultUser);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const [areas, setAreas] = useState<string[]>(["Lekki Phase 1", "Yaba"]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [jobs, setJobs] = useState<PostedJob[]>([]);

  const syncDemoState = (u: any) => ({ ...defaultUser, ...u });

  const refreshUser = async () => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("areahustle-demo-user");
    if (!saved) {
      setUser(defaultUser);
      return;
    }
    try {
      setUser(JSON.parse(saved));
    } catch {
      setUser(defaultUser);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem("token");
    const storedUser = window.localStorage.getItem("areahustle-demo-user");
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(syncDemoState(JSON.parse(storedUser)));
      } catch {
        setUser(defaultUser);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) window.localStorage.setItem("areahustle-demo-user", JSON.stringify(user));
  }, [user]);

  const login = async (data: any) => {
    const authResult = await api.login(data);
    const role = authResult?.role || data?.role || (String(data?.username ?? "").includes("customer") ? "customer" : "hustler");
    const nextUser = syncDemoState({
      ...defaultUser,
      role,
      id: authResult?.user_id ?? defaultUser.id,
      email: data?.email ?? data?.username ?? defaultUser.email,
      name: data?.name ?? (data?.username ? data.username.split("@")[0] : defaultUser.name),
      wallet_balance: role === "customer" ? 60000 : 24500,
      trust_score: role === "customer" ? 0 : 820,
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", authResult?.access_token || "demo-token");
      window.localStorage.setItem("areahustle-demo-user", JSON.stringify(nextUser));
    }
    setToken(authResult?.access_token || "demo-token");
    setUser(nextUser);
    return nextUser;
  };

  const register = async (data: any) => {
    const authResult = await api.register(data);
    const role = authResult?.role || data?.role || "customer";
    const nextUser = syncDemoState({
      ...defaultUser,
      role,
      id: authResult?.id ?? defaultUser.id,
      email: data?.email ?? defaultUser.email,
      name: data?.name ?? defaultUser.name,
      wallet_balance: role === "customer" ? 60000 : 24500,
      trust_score: role === "customer" ? 0 : 820,
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", authResult?.access_token || "demo-token");
      window.localStorage.setItem("areahustle-demo-user", JSON.stringify(nextUser));
    }
    setToken(authResult?.access_token || "demo-token");
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("areahustle-demo-user");
    }
    setToken(null);
    setUser(null);
    toast.info("Logged out successfully");
  };

  const updateDemoBalance = async (role: string, amount: number) => {
    setUser((current: any) => {
      if (!current) return current;
      const next = {
        ...current,
        wallet_balance: Math.max(0, Number(current.wallet_balance ?? 0) + Number(amount ?? 0)),
      };
      if (typeof window !== "undefined") window.localStorage.setItem("areahustle-demo-user", JSON.stringify(next));
      return next;
    });
  };

  const addDemoTransaction = (txn: any) => {
    refreshUser();
  };

  const addJob = (job: PostedJob) => {
    setJobs((currentJobs) => [job, ...currentJobs]);
  };

  const triggerPayout = ({ gross }: { gross: number; title: string; customer: string }) => {
    updateDemoBalance("hustler", Math.round(gross * 0.8));
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token && !!user,
        isLoading,
        userRole: user?.role || null,
        user,
        token,
        login,
        register,
        logout,
        language,
        setLanguage,
        areas,
        setAreas,
        updateDemoBalance,
        addDemoTransaction,
        voiceOpen,
        setVoiceOpen,
        addJob,
        triggerPayout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
