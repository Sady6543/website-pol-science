"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/mock-data";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { ChevronRight, Settings, BookOpen, Compass, Check } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, refreshProfile } = useAuth();

  // Selection states
  const [selectedCats, setSelectedCats] = useState<string[]>(["politics", "international-affairs", "ai"]);
  const [focusArea, setFocusArea] = useState<string>("polscience");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [loading, setLoading] = useState(false);

  const toggleCategory = (slug: string) => {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    // Save choices to local storage for sandbox/guest mode
    localStorage.setItem("onboarding-completed", "true");
    localStorage.setItem("user-categories", JSON.stringify(selectedCats));
    localStorage.setItem("user-focus", focusArea);
    localStorage.setItem("user-density", density);

    try {
      if (user) {
        // Write layout preferences to Supabase profiles
        const { error } = await supabase
          .from("profiles")
          .update({
            theme,
            density,
          })
          .eq("id", user.id);

        if (error) {
          console.warn("Could not save onboarding layout properties:", error.message);
        } else {
          await refreshProfile();
        }
      }
    } catch (err) {
      console.error("Failed writing profile onboarding choices:", err);
    } finally {
      setLoading(false);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-canvas text-text-primary px-4 py-12">
      <div className="w-full max-w-2xl rounded-xl border border-border-subtle bg-bg-surface p-8 md:p-10 shadow-elevation">
        
        {/* Progress Header */}
        <div className="flex flex-col gap-2 mb-8 border-b border-border-subtle pb-6">
          <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
            Workspace Configuration
          </span>
          <h1 className="text-display-lg font-display tracking-tight text-text-primary">
            Configure KnowledgeOS
          </h1>
          <p className="text-body-md text-text-secondary">
            Align the information dashboard with your research vectors and visual preferences.
          </p>
        </div>

        {/* Form Sections */}
        <div className="flex flex-col gap-8">
          
          {/* Section 1: Topics */}
          <section className="flex flex-col gap-3">
            <h3 className="text-body-md font-semibold text-text-primary flex items-center gap-2">
              <Compass className="h-4 w-4 text-accent-signal" />
              <span>Select Interest Streams</span>
            </h3>
            <p className="text-body-sm text-text-secondary">
              These topics will seed your morning summaries and categorizations.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCats.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    onClick={() => toggleCategory(cat.slug)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors text-left ${
                      isSelected
                        ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                        : "border-border-subtle bg-bg-canvas text-text-secondary hover:border-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span className="text-body-sm font-medium">
                      {cat.icon} {cat.name}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-accent-signal shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Study Focus */}
          <section className="flex flex-col gap-3">
            <h3 className="text-body-md font-semibold text-text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent-signal" />
              <span>Study Mode Core Focus</span>
            </h3>
            <p className="text-body-sm text-text-secondary">
              Binds syllabus articles and flashcards to specific academic paths.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
              {[
                { id: "polscience", title: "Political Science", desc: "IR theory, thinkers, statecraft" },
                { id: "aitech", title: "AI & Tech Systems", desc: "LLMs, chip policy, web architecture" },
                { id: "macro", title: "Macroeconomics", desc: "Monetary policy, trade structures" },
              ].map((area) => (
                <button
                  key={area.id}
                  onClick={() => setFocusArea(area.id)}
                  className={`flex flex-col p-4 rounded-lg border cursor-pointer text-left transition-colors ${
                    focusArea === area.id
                      ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                      : "border-border-subtle bg-bg-canvas text-text-secondary hover:border-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span className="text-body-sm font-semibold">{area.title}</span>
                  <span className="text-[11px] text-text-tertiary mt-1 leading-snug">
                    {area.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Interface Settings */}
          <section className="flex flex-col gap-3">
            <h3 className="text-body-md font-semibold text-text-primary flex items-center gap-2">
              <Settings className="h-4 w-4 text-accent-signal" />
              <span>Interface & Theme Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1.5">
              {/* Theme Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-mono-sm text-text-secondary font-mono uppercase">
                  Default Canvas Theme
                </label>
                <div className="grid grid-cols-2 border border-border-subtle bg-bg-canvas rounded p-1 gap-1">
                  <button
                    onClick={() => { if (theme === "light") toggleTheme(); }}
                    className={`py-1.5 text-mono-sm font-mono uppercase rounded text-center cursor-pointer transition-colors ${
                      theme === "dark" ? "bg-bg-surface-raised border border-border-subtle text-accent-signal" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Dark (Default)
                  </button>
                  <button
                    onClick={() => { if (theme === "dark") toggleTheme(); }}
                    className={`py-1.5 text-mono-sm font-mono uppercase rounded text-center cursor-pointer transition-colors ${
                      theme === "light" ? "bg-bg-surface-raised border border-border-subtle text-accent-signal" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>

              {/* Density Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-mono-sm text-text-secondary font-mono uppercase">
                  Layout Density
                </label>
                <div className="grid grid-cols-2 border border-border-subtle bg-bg-canvas rounded p-1 gap-1">
                  <button
                    onClick={() => setDensity("comfortable")}
                    className={`py-1.5 text-mono-sm font-mono uppercase rounded text-center cursor-pointer transition-colors ${
                      density === "comfortable" ? "bg-bg-surface-raised border border-border-subtle text-accent-signal" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    onClick={() => setDensity("compact")}
                    className={`py-1.5 text-mono-sm font-mono uppercase rounded text-center cursor-pointer transition-colors ${
                      density === "compact" ? "bg-bg-surface-raised border border-border-subtle text-accent-signal" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Compact (Terminal)
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 pt-6 border-t border-border-subtle flex items-center justify-between">
          <span className="text-mono-sm text-text-tertiary font-mono">
            Setup Step 2 of 2
          </span>
          <button
            onClick={handleComplete}
            disabled={loading}
            className="rounded bg-accent-signal text-text-primary px-5 py-2.5 text-body-sm font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {loading ? "Launching OS..." : "Initialize Workspace"}
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
