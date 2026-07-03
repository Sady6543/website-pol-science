"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useShell } from "@/components/shell-provider";
import { CommandPalette } from "@/components/command-palette";
import {
  Compass,
  FileText,
  Folder,
  Globe,
  GitCommit,
  Cpu,
  Search,
  Sun,
  Moon,
  CloudSun,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  BookOpen
} from "lucide-react";

interface GlobalShellProps {
  children: React.ReactNode;
}

export function GlobalShell({ children }: GlobalShellProps) {
  const pathname = usePathname() || "/";
  const { theme, toggleTheme } = useTheme();
  const { setCommandPaletteOpen, isAssistantOpen, setAssistantOpen } = useShell();

  // Dynamic date state to avoid hydration mismatch
  const [currentDate, setCurrentDate] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { label: "Home", href: "/", icon: <Compass className="h-5 w-5" /> },
    { label: "Daily Brief", href: "/brief/morning", icon: <FileText className="h-5 w-5" />, matchPrefix: "/brief" },
    { label: "Live Terminal", href: "/live", icon: <Globe className="h-5 w-5" /> },
    { label: "Knowledge Vault", href: "/vault", icon: <Folder className="h-5 w-5" />, matchPrefix: "/vault" },
    { label: "Study Mode", href: "/study", icon: <BookOpen className="h-5 w-5" />, matchPrefix: "/study" },
    { label: "Interactive Map", href: "/map", icon: <Globe className="h-5 w-5" /> },
    { label: "Visual Timeline", href: "/timeline", icon: <GitCommit className="h-5 w-5" /> },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix);
    }
    return pathname === item.href;
  };

  // --- AI ASSISTANT STATES ---
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "How can I help you study or analyze today's news updates?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (text: string, actionType?: string) => {
    const userText = text.trim();
    if (!userText && !actionType) return;

    const userMsg = userText || `Trigger action: ${actionType}`;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    // Grab visible main page content as context for Claude
    let contextText = "";
    if (typeof document !== "undefined") {
      contextText = document.querySelector("main")?.innerText || "";
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
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
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
    <div className="min-h-screen flex flex-col bg-bg-canvas text-text-primary selection:bg-accent-signal selection:text-text-primary">
      {/* 1. Global Header */}
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-bg-canvas px-4 md:px-6">
        {/* Left: Logo & Search Bar */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial">
          {/* Logo wordmark in Display font */}
          <Link href="/" className="text-heading-md font-display font-medium tracking-tight text-text-primary shrink-0 select-none hover:opacity-90">
            Knowledge<span className="text-accent-signal">OS</span>
          </Link>
 
          {/* Search trigger bar (desktop) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2.5 w-60 rounded-md border border-border-subtle bg-bg-surface px-3 py-1.5 text-body-sm text-text-tertiary transition-colors hover:border-accent-signal-muted/65 hover:text-text-secondary cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search (⌘K)</span>
            <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-border-subtle bg-bg-surface px-1 font-mono text-[9px]">
              ⌘K
            </kbd>
          </button>
        </div>
 
        {/* Right: Date, Weather, Theme, Assistant Toggle, Mobile menu */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Date display (desktop) */}
          <div className="hidden lg:block text-mono-sm text-text-secondary font-mono tracking-tight shrink-0">
            {currentDate}
          </div>
 
          {/* Weather chip (desktop/tablet) */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-2.5 py-1 text-mono-sm text-text-secondary font-mono">
            <CloudSun className="h-3.5 w-3.5 text-data-neutral-amber" />
            <span>Delhi · 32°C</span>
          </div>
 
          {/* Search icon (mobile header) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden p-1.5 rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer"
            aria-label="Open Search Palette"
          >
            <Search className="h-4 w-4" />
          </button>
 
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            title="Toggle color theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
 
          {/* AI Assistant docked toggle */}
          <button
            onClick={() => setAssistantOpen(!isAssistantOpen)}
            className={`p-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1.5 ${
              isAssistantOpen
                ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                : "border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary"
            }`}
            title="Toggle AI Assistant"
          >
            <Cpu className="h-4 w-4" />
            <span className="hidden xl:inline text-body-sm font-medium">Assistant</span>
          </button>
 
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md border border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>
 
      {/* 2. Mobile Nav Menu (expanded from header, overlay on tablet/mobile) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-bg-canvas pt-14 flex flex-col animate-[fadeIn_150ms_ease-in-out]">
          <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg border p-3.5 transition-colors ${
                  isActive(item)
                    ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                    : "border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary"
                }`}
              >
                <div className="flex items-center gap-3 font-medium">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setAssistantOpen(true);
              }}
              className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-surface p-3.5 text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <div className="flex items-center gap-3 font-medium">
                <Cpu className="h-5 w-5" />
                <span>AI Assistant Panel</span>
              </div>
              <Sparkles className="h-4 w-4 text-accent-signal" />
            </button>
          </nav>
          <div className="border-t border-border-subtle p-4 bg-bg-surface text-center text-mono-sm text-text-tertiary font-mono">
            {currentDate} · {theme.toUpperCase()} MODE
          </div>
        </div>
      )}
 
      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex w-full relative">
        {/* Left Navigation Rail (Desktop) */}
        <aside className="hidden md:flex flex-col w-16 lg:w-60 border-r border-border-subtle bg-bg-canvas py-6 shrink-0 transition-all duration-150">
          <nav className="flex-1 px-3 flex flex-col gap-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 rounded-md px-3 py-2.5 transition-colors ${
                  isActive(item)
                    ? "bg-accent-signal-muted text-accent-signal font-medium"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                }`}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden lg:inline text-body-sm tracking-tight truncate">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
 
          {/* Quick Info (Desktop lower rail) */}
          <div className="px-6 py-2 border-t border-border-subtle/40 hidden lg:block text-mono-sm text-text-tertiary font-mono mt-auto">
            v1.0 (Phase 1)
          </div>
        </aside>
 
        {/* Core Page Content area */}
        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
          {children}
        </main>
 
        {/* 4. Docked Right-Side AI Assistant panel */}
        {isAssistantOpen && (
          <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] border-l border-border-subtle bg-bg-surface shadow-elevation flex flex-col animate-[slideInRight_220ms_ease-out] motion-reduce:transition-none pt-14 xl:pt-0 xl:static xl:h-[calc(100vh-3.5rem)] shrink-0">
            {/* Assistant Header */}
            <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4 shrink-0">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-accent-signal animate-pulse" />
                <h3 className="text-body-md font-semibold text-text-primary">Claude AI Assistant</h3>
                <span className="rounded bg-accent-signal-muted text-accent-signal px-1 py-0.5 text-mono-sm scale-90 font-mono">
                  Online
                </span>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="rounded p-1 text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
 
            {/* Assistant Body / Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              
              {/* Chat Message Logs */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 max-w-[90%] ${
                    msg.role === "user" ? "self-end align-end" : "self-start align-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 text-body-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-accent-signal text-text-primary font-medium"
                        : "bg-bg-surface-raised border border-border-subtle text-text-secondary prose prose-invert"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className={`text-[9px] text-text-tertiary font-mono uppercase px-1 mt-0.5 ${
                    msg.role === "user" ? "self-end" : "self-start"
                  }`}>
                    {msg.role}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="self-start flex items-center gap-2 text-mono-sm text-text-tertiary font-mono">
                  <span className="h-2 w-2 rounded-full bg-accent-signal animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-accent-signal animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-accent-signal animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span>Claude is thinking...</span>
                </div>
              )}
 
              {/* Suggestion Chips */}
              {!loading && (
                <div className="mt-4 border-t border-border-subtle/50 pt-4 shrink-0">
                  <div className="text-mono-sm text-text-tertiary font-mono mb-2 uppercase">Quick Actions</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Summarize Active View", action: "summarize" },
                      { label: "Compare Ideologies Grid", action: "compare" },
                      { label: "Generate Review Flashcards", action: "generate-flashcards" },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleSendMessage("", chip.action)}
                        className="rounded border border-border-subtle bg-bg-canvas hover:bg-bg-surface-raised hover:border-accent-signal px-2.5 py-1 text-mono-sm font-mono uppercase text-text-secondary hover:text-text-primary transition-all cursor-pointer text-left"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
 
            {/* Assistant Input area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="border-t border-border-subtle p-4 bg-bg-canvas shrink-0"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={loading ? "Waiting for response..." : "Ask Claude to explain or quiz..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-md border border-border-subtle bg-bg-surface py-2 pl-3 pr-10 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 text-accent-signal hover:opacity-100 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* 5. Mobile Bottom Tab Bar (fixed at bottom, hidden on desktop/tablet) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-border-subtle bg-bg-canvas px-4 flex items-center justify-around select-none">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1.5 w-14 h-full text-center transition-colors ${
              isActive(item) ? "text-accent-signal" : "text-text-secondary"
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="text-[10px] font-medium tracking-tight truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* 6. Command Palette modal overlay */}
      <CommandPalette />
    </div>
  );
}
