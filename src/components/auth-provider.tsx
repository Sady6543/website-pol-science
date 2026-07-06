"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string;
  theme: string;
  accent_color: string;
  density: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.warn("Could not fetch profile, user might be new or not seeded yet:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Initial fetch session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        } else {
          // Check local storage for mock demo user fallback
          const mockUserStr = localStorage.getItem("knowledgeos_demo_user");
          if (mockUserStr) {
            const parsed = JSON.parse(mockUserStr);
            setUser(parsed.user);
            setProfile(parsed.profile);
          }
        }
      } catch (err) {
        console.error("Error checking initial auth session:", err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession) {
        setSession(newSession);
        const currentUser = newSession.user;
        setUser(currentUser);
        await fetchProfile(currentUser.id);
      } else {
        // Only clear if there's no active mock user in localStorage
        const mockUserStr = localStorage.getItem("knowledgeos_demo_user");
        if (mockUserStr) {
          const parsed = JSON.parse(mockUserStr);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Route Gating Logic (run client side)
  useEffect(() => {
    if (loading) return;

    const privateRoutes = ["/vault", "/study"];
    const isPrivate = privateRoutes.some((route) => pathname.startsWith(route));

    if (isPrivate && !user) {
      console.log(`Route ${pathname} is gated. Redirecting to /auth/login`);
      router.push("/auth/login");
    }
  }, [user, pathname, loading, router]);

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout skipped:", e);
    }
    localStorage.removeItem("knowledgeos_demo_user");
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
