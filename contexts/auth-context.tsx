"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginWithEmail } from "@/lib/api";
import {
  ALL_TEAM_MEMBERS,
  isLeaderRole,
  type TeamMemberName,
  type UserProfile,
} from "@/types";

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  allNames: readonly TeamMemberName[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isNameAvailable: (name: TeamMemberName) => boolean;
  isLeader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from server-side HTTP-only cookie
  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUserProfile(data.user as UserProfile);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const profile = await loginWithEmail(email, password);
    setUserProfile(profile);
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUserProfile(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      userProfile,
      loading,
      allNames: ALL_TEAM_MEMBERS,
      login,
      logout,
      isNameAvailable: () => true,
      isLeader: userProfile ? isLeaderRole(userProfile.role) : false,
    }),
    [loading, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
