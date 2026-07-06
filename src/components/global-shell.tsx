"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useShell } from "@/components/shell-provider";
import { CommandPalette } from "@/components/command-palette";
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  CloudSun,
  Compass,
  Cpu,
  FileText,
  Folder,
  GitCommit,
  Globe,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

interface GlobalShellProps {
  children: React.ReactNode;
}

export function GlobalShell({ children }: GlobalShellProps) {
  const pathname = usePathname() || "/";
  const { theme, toggleTheme } = useTheme();
  const { setCommandPaletteOpen, isAssistantOpen, setAssistantOpen } =
    useShell();

  const [currentDate, setCurrentDate] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      setCurrentDate(new Date().toLocaleDateString("en-US", options));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
        mobileMenuBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navItems = [
    { label: "Home", href: "/", icon: <Compass className="h-5 w-5" aria-hidden="true" /> },
    { label: "Daily Brief", href: "/brief/morning", icon: <FileText className="h-5 w-5" aria-hidden="true" />, matchPrefix: "/brief" },
    { label: "Live Terminal", href: "/live", icon: <Globe className="h-5 w-5" aria-hidden="true" /> },
    { label: "Knowledge Vault", href: "/vault", icon: <Folder className="h-5 w-5" aria-hidden="true" />, matchPrefix: "/vault" },
    { label: "Study Mode", href: "/study", icon: <BookOpen className="h-5 w-5" aria-hidden="true" />, matchPrefix: "/study" },
    { label: "Interactive Map", href: "/map", icon: <Globe className="h-5 w-5" aria-hidden="true" /> },
    { label: "Visual Timeline", href: "/timeline", icon: <GitCommit className="h-5 w-5" aria-hidden="true" /> },
    { label: "Progress", href: "/progress", icon: <BarChart2 className="h-5 w-5" aria-hidden="true" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="h-5 w-5" aria-hidden="true" /> },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    return pathname === item.href;
  };

  // ── AI assistant state ──────────────────────────────────────
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content: "How can I help you study or analyze today's news updates?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const handleSendMessage = async (text: string, actionType?: string) => {
    const userText = text.trim();
    if (!userText && !actionType) return;

    const userMsg = userText || `Trigger action: ${actionType}`;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    let contextText = "";
    if (typeof document !== "undefined") {
      contextText =
        (document.querySelector("main") as HTMLElement | null)?.innerText || "";
    }

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          action: actionType || "general",
          contextText,
        }),
      });
      if (!res.ok) throw new Error("Assistant response failure");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **OS Warning**: Assistant could not process query. Verify Anthropic API keys.\n\n*Log error: ${errMsg}*`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-canvas text-text-primary selection:bg-accent-signal selection:text-white">
      {/* Skip to main content — first focusable element on page */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* ── 1. Global Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-glass-edge bg-glass-surface/80 backdrop-blur-card px-4 md:px-6">
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial">
          <Link
            href="/"
            className="text-heading-md font-display font-medium tracking-tight text-text-primary shrink-0 select-none hover:opacity-90 focus-visible:rounded"
            aria-label="KnowledgeOS home"
          >
            Knowledge<span className="text-accent-signal">OS</span>
          </Link>

          {/* Search bar (desktop) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2.5 w-60 rounded-md border border-glass-edge bg-glass-surface/50 px-3 py-1.5 text-body-sm text-text-tertiary transition-colors hover:border-glass-edge-hover hover:text-text-secondary cursor-pointer"
            aria-label="Open command palette (⌘K)"
          >
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Search (⌘K)</span>
            <kbd
              className="inline-flex h-4 items-center gap-0.5 rounded border border-border-subtle bg-bg-surface px-1 font-mono text-[9px]"
              aria-hidden="true"
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Date, Weather, Theme, Assistant, Mobile */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:block text-mono-sm text-text-secondary font-mono tracking-tight shrink-0">
            {currentDate}
          </div>

          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-2.5 py-1 text-mono-sm text-text-secondary font-mono"
            aria-label="Weather: Delhi, 32°C"
          >
            <CloudSun className="h-3.5 w-3.5 text-data-neutral-amber" aria-hidden="true" />
            <span aria-hidden="true">Delhi · 32°C</span>
          </div>

          {/* Search icon (mobile) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* AI Assistant toggle */}
          <button
            onClick={() => setAssistantOpen(!isAssistantOpen)}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center gap-1.5 rounded-md border transition-colors cursor-pointer ${
              isAssistantOpen
                ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                : "border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary"
            }`}
            aria-label={isAssistantOpen ? "Close AI Assistant" : "Open AI Assistant"}
            aria-expanded={isAssistantOpen}
            title="AI Assistant"
          >
            <Cpu className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xl:inline text-body-sm font-medium">Assistant</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            ref={mobileMenuBtnRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* ── 2. Mobile Nav Menu (full-screen overlay) ────────────── */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          ref={mobileMenuRef}
          className="md:hidden fixed inset-0 z-40 bg-bg-canvas pt-14 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <nav
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg border p-4 min-h-[56px] transition-colors ${
                  isActive(item)
                    ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                    : "border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary"
                }`}
                aria-current={isActive(item) ? "page" : undefined}
              >
                <div className="flex items-center gap-3 font-medium">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" aria-hidden="true" />
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setAssistantOpen(true);
              }}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface p-4 min-h-[56px] text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              aria-label="Open AI Assistant"
            >
              <div className="flex items-center gap-3 font-medium">
                <Cpu className="h-5 w-5" aria-hidden="true" />
                <span>AI Assistant Panel</span>
              </div>
              <Sparkles className="h-4 w-4 text-accent-signal" aria-hidden="true" />
            </button>
          </nav>
          <div className="border-t border-border-subtle p-4 bg-bg-surface text-center text-mono-sm text-text-tertiary font-mono">
            {currentDate} · {theme.toUpperCase()} MODE
          </div>
        </div>
      )}

      {/* ── 3. Main Workspace ──────────────────────────────────── */}
      <div className="flex-1 flex w-full relative overflow-hidden">
        {/* Left Navigation Rail (Desktop) */}
        <aside
          className="hidden md:flex flex-col w-16 lg:w-60 border-r border-glass-edge bg-glass-surface/20 py-6 shrink-0 backdrop-blur-card"
          aria-label="Sidebar navigation"
        >
          <nav className="flex-1 px-3 flex flex-col gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 rounded-md px-3 py-2.5 min-h-[44px] transition-colors ${
                  isActive(item)
                    ? "bg-accent-signal-muted text-accent-signal font-medium"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
                aria-label={item.label}
                aria-current={isActive(item) ? "page" : undefined}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden lg:inline text-body-sm tracking-tight truncate">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="px-4 py-2 border-t border-border-subtle/40 hidden lg:block text-mono-sm text-text-tertiary font-mono mt-auto">
            v1.0 · Phase 4
          </div>
        </aside>

        {/* Core Page Content */}
        <main
          id="main-content"
          className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0 overflow-x-hidden"
          tabIndex={-1}
        >
          {children}
        </main>

        {/* ── 4. AI Assistant Drawer ─────────────────────────── */}
        {isAssistantOpen && (
          <aside
            className="fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] xl:w-[360px] border-l border-glass-edge bg-glass-surface-raised/90 backdrop-blur-card shadow-glass flex flex-col pt-14 xl:pt-0 xl:static xl:h-[calc(100vh-3.5rem)] shrink-0"
            aria-label="AI Assistant panel"
            role="complementary"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4 shrink-0">
              <div className="flex items-center gap-2">
                <Cpu
                  className="h-5 w-5 text-accent-signal"
                  aria-hidden="true"
                />
                <h2 className="text-body-md font-semibold text-text-primary">
                  Claude AI Assistant
                </h2>
                <span className="rounded bg-accent-signal-muted text-accent-signal px-1.5 py-0.5 text-[10px] font-mono uppercase">
                  Online
                </span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="rounded p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary cursor-pointer transition-colors"
                aria-label="Close AI Assistant"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Chat area */}
            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 max-w-[90%] ${
                    msg.role === "user" ? "self-end" : "self-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 text-body-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === "user"
                        ? "bg-accent-signal text-white font-medium"
                        : "bg-bg-surface-raised border border-border-subtle text-text-secondary"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span
                    className={`text-[9px] text-text-tertiary font-mono uppercase px-1 ${
                      msg.role === "user" ? "self-end" : "self-start"
                    }`}
                    aria-hidden="true"
                  >
                    {msg.role}
                  </span>
                </div>
              ))}

              {loading && (
                <div
                  className="self-start flex items-center gap-2 text-mono-sm text-text-tertiary font-mono"
                  aria-label="Claude is thinking"
                  role="status"
                >
                  <span
                    className="h-2 w-2 rounded-full bg-accent-signal animate-bounce"
                    style={{ animationDelay: "0ms" }}
                    aria-hidden="true"
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-accent-signal animate-bounce"
                    style={{ animationDelay: "150ms" }}
                    aria-hidden="true"
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-accent-signal animate-bounce"
                    style={{ animationDelay: "300ms" }}
                    aria-hidden="true"
                  />
                  <span>Claude is thinking…</span>
                </div>
              )}

              {/* Quick actions */}
              {!loading && (
                <div className="mt-2 border-t border-border-subtle/50 pt-3 shrink-0">
                  <p className="text-mono-sm text-text-tertiary font-mono mb-2 uppercase">
                    Quick Actions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: "Summarize Active View", action: "summarize" },
                      { label: "Compare Ideologies Grid", action: "compare" },
                      { label: "Generate Review Flashcards", action: "generate-flashcards" },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleSendMessage("", chip.action)}
                        className="rounded border border-border-subtle bg-bg-canvas hover:bg-bg-surface-raised hover:border-accent-signal/60 px-3 py-2 min-h-[44px] text-body-sm text-text-secondary hover:text-text-primary transition-all cursor-pointer text-left"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="border-t border-border-subtle p-3 bg-bg-canvas shrink-0"
            >
              <div className="relative flex items-center gap-2">
                <label htmlFor="assistant-input" className="sr-only">
                  Message Claude
                </label>
                <input
                  id="assistant-input"
                  type="text"
                  placeholder={
                    loading ? "Waiting for response…" : "Ask Claude to explain or quiz…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 rounded-md border border-border-subtle bg-bg-surface py-2.5 pl-3 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal disabled:opacity-50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="shrink-0 rounded-md border border-accent-signal/60 bg-accent-signal-muted text-accent-signal px-3 py-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-signal hover:text-white transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* ── 5. Mobile Bottom Tab Bar ───────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-glass-edge bg-glass-surface/90 backdrop-blur-card px-2 flex items-center justify-around select-none"
        aria-label="Bottom navigation"
      >
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-full min-h-[44px] text-center transition-colors ${
              isActive(item) ? "text-accent-signal" : "text-text-secondary"
            }`}
            aria-label={item.label}
            aria-current={isActive(item) ? "page" : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="text-[9px] font-medium tracking-tight truncate max-w-[52px]">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* ── 6. Command Palette ─────────────────────────────────── */}
      <CommandPalette />
    </div>
  );
}
