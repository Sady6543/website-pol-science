"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Runs synchronously to pick up system/stored preference before first paint
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("knowledgeos-theme") as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

// Pure DOM helper — no state involved
function applyThemeClass(t: Theme) {
  if (t === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise synchronously from storage/system to avoid any flash
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const initialised = useRef(false);

  // Apply DOM class once after mount
  useEffect(() => {
    if (!initialised.current) {
      applyThemeClass(theme);
      initialised.current = true;
    }

    // React to OS-level changes when no user preference is stored
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("knowledgeos-theme")) {
        const next: Theme = e.matches ? "light" : "dark";
        setThemeState(next);
        applyThemeClass(next);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("knowledgeos-theme", t);
    applyThemeClass(t);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
