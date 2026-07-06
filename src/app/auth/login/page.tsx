"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Shield, Cpu, KeyRound, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/onboarding`,
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Account created! Redirecting to onboarding...");
          setTimeout(() => router.push("/auth/onboarding"), 1500);
        } else {
          setMessage("Registration complete. Please verify your email link to complete sign in.");
        }
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Success! Redirecting...");
          // Check if profile exists, otherwise onboard
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", data.session.user.id)
            .single();

          setTimeout(() => {
            if (profile) {
              router.push("/");
            } else {
              router.push("/auth/onboarding");
            }
          }, 1000);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An error occurred.";
      if (errMsg.toLowerCase().includes("fetch") || errMsg.toLowerCase().includes("failed") || errMsg.toLowerCase().includes("network")) {
        setMessage("Database connection failed. Please click 'Guest Sandbox' below to enter Demo Mode instantly!");
      } else {
        setMessage(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : "An OAuth error occurred.";
      setMessage(errMsg);
    }
  };

  const handleGuestSandbox = () => {
    const mockUser = {
      user: {
        id: "demo-user-id",
        email: "guest@knowledgeos.org",
        user_metadata: { display_name: "Guest Sandbox" },
      },
      profile: {
        id: "demo-user-id",
        display_name: "Guest Sandbox",
        theme: "dark",
        accent_color: "#3D6BFF",
        density: "comfortable"
      }
    };
    localStorage.setItem("knowledgeos_demo_user", JSON.stringify(mockUser));
    setMessage("Success! Launching Guest Sandbox...");
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas text-text-primary px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-border-subtle bg-bg-surface p-8 shadow-elevation animate-[scaleUp_180ms_cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="text-display-lg font-display font-medium tracking-tight text-text-primary">
            Knowledge<span className="text-accent-signal">OS</span>
          </div>
          <span className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider">
            {isSignUp ? "Create Workspace Key" : "Authenticate Workspace"}
          </span>
        </div>

        {/* Info Box */}
        <div className="mb-6 rounded bg-bg-surface-raised border border-border-subtle p-3 flex gap-2.5 items-start text-body-sm text-text-secondary">
          <Shield className="h-4 w-4 text-accent-signal shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary block">Secure Cloud Sync</span>
            Row-Level Security (RLS) policies prevent unauthorized reads of bookmarks, notes, or timelines.
          </div>
        </div>

        {/* Auth form */}
        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-mono-sm text-text-secondary font-mono uppercase">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-text-tertiary" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-border-subtle bg-bg-canvas py-2 pl-10 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-mono-sm text-text-secondary font-mono uppercase">
              Password
            </label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3 h-4 w-4 text-text-tertiary" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-border-subtle bg-bg-canvas py-2 pl-10 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal"
              />
            </div>
          </div>

          {message && (
            <div className="text-mono-sm text-accent-signal font-mono text-center my-1 max-w-full break-words">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-accent-signal text-text-primary py-2.5 text-body-sm font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{isSignUp ? "Sign Up Workspace" : "Sign In to Dashboard"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>

        {/* Action Toggle */}
        <div className="text-center mt-3.5">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage("");
            }}
            className="text-body-sm text-accent-signal hover:underline cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need a secure key? Create Account"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle"></div>
          </div>
          <span className="relative bg-bg-surface px-3 text-mono-sm text-text-tertiary font-mono uppercase">
            Or Sign In With
          </span>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleOAuthSignIn("github")}
            className="rounded border border-border-subtle bg-bg-canvas hover:bg-bg-surface-raised py-2 text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => handleOAuthSignIn("google")}
            className="rounded border border-border-subtle bg-bg-canvas hover:bg-bg-surface-raised py-2 text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Google</span>
          </button>
        </div>

        {/* Skip options */}
        <div className="text-center border-t border-border-subtle/50 pt-4 flex justify-between items-center text-mono-sm font-mono uppercase">
          <Link
            href="/"
            className="text-text-tertiary hover:text-text-primary flex items-center gap-1"
          >
            <span>Cancel</span>
          </Link>
          <button
            onClick={handleGuestSandbox}
            className="text-text-secondary hover:text-accent-signal flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none p-0 font-mono uppercase"
          >
            <span>Guest Sandbox</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
