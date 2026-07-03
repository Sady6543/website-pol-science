"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShell } from "@/components/shell-provider";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/lib/supabase";
import { Search, FileText, Folder, Compass, X, Moon, Sun, Cpu } from "lucide-react";

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "pages" | "categories" | "articles" | "actions";
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setAssistantOpen } = useShell();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; icon: string | null }[]>([]);
  const [articles, setArticles] = useState<{
    id: string;
    slug: string;
    title: string;
    reading_time_minutes: number;
    category: { name: string } | null;
  }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Load palette data from live database on mount
  useEffect(() => {
    const loadPaletteData = async () => {
      try {
        const { data: cats } = await supabase.from("categories").select("*");
        const { data: arts } = await supabase.from("articles").select(`
          id, slug, title, reading_time_minutes,
          category:categories(name)
        `);
        if (cats) {
          setCategories(cats as unknown as { id: string; name: string; slug: string; icon: string | null }[]);
        }
        if (arts) {
          setArticles(arts as unknown as {
            id: string;
            slug: string;
            title: string;
            reading_time_minutes: number;
            category: { name: string } | null;
          }[]);
        }
      } catch (err) {
        console.error("Failed loading Command Palette DB indexes:", err);
      }
    };
    loadPaletteData();
  }, []);

  // Reset query and selection index when palette opens
  useEffect(() => {
    if (isCommandPaletteOpen) {
      const timer = setTimeout(() => {
        setQuery("");
        setSelectedIndex(0);
      }, 0);
      
      // Wait for animation frame to focus
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      // Lock scroll on body
      document.body.style.overflow = "hidden";
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
    }
  }, [isCommandPaletteOpen]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setCommandPaletteOpen(false);
      }
    };
    if (isCommandPaletteOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // List of static pages and actions
  const staticItems: PaletteItem[] = [
    {
      id: "p-home",
      title: "Dashboard Home",
      subtitle: "Daily Snapshot & Hero Feed",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-brief-morning",
      title: "Daily Brief: Morning",
      subtitle: "Morning briefing & headlines",
      category: "pages",
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        router.push("/brief/morning");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-brief-afternoon",
      title: "Daily Brief: Afternoon",
      subtitle: "Mid-day updates & events",
      category: "pages",
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        router.push("/brief/afternoon");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-brief-evening",
      title: "Daily Brief: Evening",
      subtitle: "Evening summary & quotes",
      category: "pages",
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        router.push("/brief/evening");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-live",
      title: "Live Terminal Dashboard (Phase 2)",
      subtitle: "World clocks, stock market indices, live tickers",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/live");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-vault",
      title: "Knowledge Vault (Phase 2)",
      subtitle: "Bookmarks, notes, saved PDFs, ideas",
      category: "pages",
      icon: <Folder className="h-4 w-4" />,
      action: () => {
        router.push("/vault");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-study",
      title: "Study Mode: Political Science (Phase 3)",
      subtitle: "Flashcards, mind maps, syllabus, PYQs",
      category: "pages",
      icon: <Folder className="h-4 w-4" />,
      action: () => {
        router.push("/study");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-map",
      title: "Interactive World Map (Phase 2)",
      subtitle: "Geopolitical conflict tracker & election details",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/map");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-timeline",
      title: "Visual Timeline (Phase 2)",
      subtitle: "Global event nodes & chronologies",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/timeline");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-login",
      title: "Authentication Login",
      subtitle: "Access personal cloud database",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/auth/login");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-progress",
      title: "Progress & Streaks",
      subtitle: "Heatmap, weekly review, reading activity",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/progress");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "p-settings",
      title: "Settings",
      subtitle: "Appearance, account, export, data",
      category: "pages",
      icon: <Compass className="h-4 w-4" />,
      action: () => {
        router.push("/settings");
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "a-theme",
      title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      subtitle: "Toggles app color token sets",
      category: "actions",
      icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      action: () => {
        toggleTheme();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "a-assistant",
      title: "Toggle AI Assistant Panel",
      subtitle: "Summarize pages, quiz on notes, compare ideologies",
      category: "actions",
      icon: <Cpu className="h-4 w-4" />,
      action: () => {
        setAssistantOpen(true);
        setCommandPaletteOpen(false);
      },
    },
  ];

  // Map category models to items
  const categoryItems: PaletteItem[] = categories.map((cat) => ({
    id: `c-${cat.slug}`,
    title: `${cat.icon || "📁"} ${cat.name}`,
    subtitle: `Browse all articles under ${cat.name}`,
    category: "categories",
    icon: <Folder className="h-4 w-4 text-text-tertiary" />,
    action: () => {
      router.push(`/categories/${cat.slug}`);
      setCommandPaletteOpen(false);
    },
  }));

  // Map articles to items
  const articleItems: PaletteItem[] = articles.map((art) => ({
    id: `a-${art.slug}`,
    title: art.title,
    subtitle: `Article · ${art.category?.name || "General"} · ${art.reading_time_minutes} min read`,
    category: "articles",
    icon: <FileText className="h-4 w-4 text-text-secondary" />,
    action: () => {
      router.push(`/article/${art.slug}`);
      setCommandPaletteOpen(false);
    },
  }));

  // Filtered items based on query
  const allItems = [...staticItems, ...categoryItems, ...articleItems];
  const filteredItems = query
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase())
      )
    : staticItems.slice(0, 5).concat(categoryItems.slice(0, 3)); // show brief default list on empty query

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, filteredItems, selectedIndex, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-[fadeIn_150ms_ease-in-out] motion-reduce:transition-none"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
    >
      <div
        ref={paletteRef}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border-subtle glass-panel shadow-elevation animate-[scaleUp_180ms_cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
      >
      {/* Input area */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5" role="search">
          <Search className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            role="combobox"
            aria-expanded={filteredItems.length > 0}
            aria-controls="command-palette-results"
            aria-activedescendant={filteredItems[selectedIndex] ? `palette-item-${filteredItems[selectedIndex].id}` : undefined}
            aria-autocomplete="list"
            aria-label="Search commands and pages"
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <kbd
              className="inline-flex h-5 items-center gap-0.5 rounded border border-border-subtle bg-bg-surface px-1.5 font-mono text-[10px] text-text-secondary"
              aria-hidden="true"
            >
              <span className="text-xs">⌘</span>K
            </kbd>
            <button
              onClick={() => setCommandPaletteOpen(false)}
              className="rounded p-1 hover:bg-bg-surface-raised cursor-pointer text-text-secondary"
              aria-label="Close command palette"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Results area */}
        <div
          id="command-palette-results"
          role="listbox"
          aria-label="Command palette results"
          className="max-h-[340px] overflow-y-auto py-2"
        >
          {/* Announce result count to screen readers */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {filteredItems.length === 0
              ? "No results found"
              : `${filteredItems.length} result${filteredItems.length !== 1 ? "s" : ""} available`}
          </div>
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-body-sm text-text-secondary">
              No results for &ldquo;<span className="font-medium text-text-primary">{query}</span>&rdquo;
            </div>
          ) : (
            <div>
              {["pages", "actions", "categories", "articles"].map((cat) => {
                const itemsInCat = filteredItems.filter((i) => i.category === cat);
                if (itemsInCat.length === 0) return null;
                return (
                  <div key={cat} className="mb-2 last:mb-0">
                    <div
                      className="px-4 py-1 text-mono-sm text-text-tertiary uppercase font-mono tracking-wider"
                      role="presentation"
                    >
                      {cat}
                    </div>
                    {itemsInCat.map((item) => {
                      const absoluteIndex = filteredItems.indexOf(item);
                      const isSelected = absoluteIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          id={`palette-item-${item.id}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={item.action}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-75 ${
                            isSelected
                              ? "bg-accent-signal-muted/50 border-l-[3px] border-accent-signal pl-[13px]"
                              : "border-l-[3px] border-transparent hover:bg-bg-surface-raised/40"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-sm border shrink-0 ${
                              isSelected
                                ? "border-accent-signal bg-accent-signal text-white"
                                : "border-border-subtle bg-bg-surface text-text-secondary"
                            }`}
                            aria-hidden="true"
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-body-sm font-medium text-text-primary truncate">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-[11px] text-text-secondary truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-mono-sm text-accent-signal font-mono" aria-hidden="true">
                              Enter
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
