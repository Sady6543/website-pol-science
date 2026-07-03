"use client";

import React, { useState } from "react";
import { GlobalShell } from "@/components/global-shell";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/lib/supabase";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  Sun,
  Moon,
  Monitor,
  User,
  Palette,
  Download,
  Database,
  LogOut,
  Check,
  Loader2,
  AlertTriangle,
  ChevronRight,
  BookOpen,
} from "lucide-react";

// ─── Section wrapper ──────────────────────────────────────────
function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden" aria-label={title}>
      <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-signal/10 border border-accent-signal/20 shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-heading-sm text-text-primary">{title}</h2>
          <p className="text-body-sm text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-border-subtle/50 last:border-0">
      <div className="min-w-0">
        <label
          htmlFor={htmlFor}
          className="text-body-sm font-medium text-text-primary"
        >
          {label}
        </label>
        {description && (
          <p className="text-[12px] text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-body-sm font-medium shadow-elevation ${
        type === "success"
          ? "border-data-positive/40 bg-data-positive/10 text-data-positive"
          : "border-data-negative/40 bg-data-negative/10 text-data-negative"
      }`}
    >
      {type === "success" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      )}
      {message}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────
export default function SettingsPage() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Derive display name and density from profile — no effect needed
  const profileDisplayName = profile?.display_name || "";
  const profileDensity = (profile?.density as "comfortable" | "compact") || "comfortable";
  const [displayName, setDisplayName] = useState(profileDisplayName);
  const [density, setDensity] = useState<"comfortable" | "compact">(profileDensity);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);




  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Save profile ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, density, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      showToast("Profile saved successfully.", "success");
    } catch (err) {
      showToast(
        `Save failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Export Markdown ────────────────────────────────────────
  const handleExportMarkdown = async () => {
    if (!user) {
      showToast("Sign in to export your Knowledge Vault.", "error");
      return;
    }
    setExporting(true);
    try {
      const { data: articles } = await supabase
        .from("articles")
        .select("title, summary, key_points, published_at, category:categories(name)")
        .order("published_at", { ascending: false })
        .limit(200);

      const { data: notes } = await supabase
        .from("notes")
        .select("title, content, created_at")
        .eq("user_id", user.id)
        .limit(100);

      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("front, back, ease_factor")
        .eq("user_id", user.id)
        .limit(200);

      let md = `# KnowledgeOS Export\n*Generated: ${new Date().toLocaleString()}*\n\n`;

      md += `## Articles (${articles?.length || 0})\n\n`;
      articles?.forEach((a) => {
        const cat = (a.category as unknown as { name: string } | null)?.name || "General";
        md += `### ${a.title}\n**Category**: ${cat}  \n**Date**: ${a.published_at}\n\n${a.summary}\n\n`;
        if (a.key_points?.length) {
          md += `**Key Points**:\n${a.key_points.map((p: string) => `- ${p}`).join("\n")}\n\n`;
        }
        md += "---\n\n";
      });

      md += `## Notes (${notes?.length || 0})\n\n`;
      notes?.forEach((n) => {
        md += `### ${n.title || "Untitled"}\n*${n.created_at}*\n\n${n.content || ""}\n\n---\n\n`;
      });

      md += `## Flashcards (${flashcards?.length || 0})\n\n`;
      flashcards?.forEach((f) => {
        md += `**Q**: ${f.front}\n**A**: ${f.back}\n\n`;
      });

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knowledgeos-export-${new Date().toISOString().split("T")[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Export downloaded successfully.", "success");
    } catch (err) {
      showToast(
        `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  // ── Export Flashcards CSV ─────────────────────────────────
  const handleExportCSV = async () => {
    if (!user) {
      showToast("Sign in to export flashcards.", "error");
      return;
    }
    setExporting(true);
    try {
      const { data } = await supabase
        .from("flashcards")
        .select("front, back, ease_factor, interval_days, repetitions")
        .eq("user_id", user.id);

      const rows = ["Front,Back,Ease Factor,Interval (days),Repetitions"];
      data?.forEach((f) => {
        rows.push(
          `"${f.front.replace(/"/g, '""')}","${f.back.replace(/"/g, '""')}",${f.ease_factor},${f.interval_days},${f.repetitions}`
        );
      });

      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flashcards-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Flashcards CSV exported.", "success");
    } catch (err) {
      showToast(
        `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setExporting(false);
    }
  };

  // ── Clear cache ────────────────────────────────────────────
  const handleClearCache = async () => {
    try {
      localStorage.removeItem("knowledgeos-theme");
      showToast("Local cache cleared. Refresh to apply defaults.", "success");
    } catch {
      showToast("Could not clear cache.", "error");
    }
  };

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-display-lg font-display text-text-primary">Settings</h1>
          <p className="text-body-md text-text-secondary mt-1">
            Manage your appearance, account, and data preferences.
          </p>
        </div>

        {/* Appearance */}
        <ErrorBoundary context="Appearance settings">
          <SettingsSection
            title="Appearance"
            description="Customize how KnowledgeOS looks and feels."
            icon={<Palette className="h-4.5 w-4.5 text-accent-signal" aria-hidden="true" />}
          >
            <SettingRow
              label="Color Theme"
              description="Choose between dark, light, or your system preference."
              htmlFor="theme-select"
            >
              <div className="flex gap-2" role="group" aria-label="Theme selection">
                {[
                  { value: "dark", icon: <Moon className="h-4 w-4" aria-hidden="true" />, label: "Dark" },
                  { value: "light", icon: <Sun className="h-4 w-4" aria-hidden="true" />, label: "Light" },
                  { value: "system", icon: <Monitor className="h-4 w-4" aria-hidden="true" />, label: "System" },
                ].map((opt) => {
                  const isActive = opt.value === "system"
                    ? (typeof window !== "undefined" && !localStorage.getItem("knowledgeos-theme"))
                    : theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (opt.value === "system") {
                          localStorage.removeItem("knowledgeos-theme");
                          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                          setTheme(prefersDark ? "dark" : "light");
                        } else {
                          setTheme(opt.value as "dark" | "light");
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-body-sm font-medium transition-colors cursor-pointer min-h-[44px] ${
                        isActive
                          ? "border-accent-signal bg-accent-signal-muted text-accent-signal"
                          : "border-border-subtle bg-bg-canvas text-text-secondary hover:text-text-primary"
                      }`}
                      aria-pressed={isActive}
                      aria-label={`${opt.label} theme${isActive ? " (active)" : ""}`}
                    >
                      {opt.icon}
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </SettingRow>

            <SettingRow
              label="Interface Density"
              description="Compact fits more on screen; comfortable is easier to read."
              htmlFor="density-select"
            >
              <select
                id="density-select"
                value={density}
                onChange={(e) => setDensity(e.target.value as "comfortable" | "compact")}
                className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-accent-signal transition-colors cursor-pointer min-h-[44px]"
                aria-label="Interface density"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </SettingRow>
          </SettingsSection>
        </ErrorBoundary>

        {/* Account */}
        <ErrorBoundary context="Account settings">
          <SettingsSection
            title="Account"
            description="Manage your profile and authentication."
            icon={<User className="h-4.5 w-4.5 text-accent-signal" aria-hidden="true" />}
          >
            {!user ? (
              <div className="flex flex-col gap-3">
                <p className="text-body-sm text-text-secondary">
                  Sign in to access account settings and sync your data across devices.
                </p>
                <a
                  href="/auth/login"
                  className="flex items-center gap-2 rounded-md border border-accent-signal/60 bg-accent-signal-muted text-accent-signal px-4 py-2.5 text-body-sm font-medium hover:bg-accent-signal hover:text-white transition-colors w-fit min-h-[44px]"
                >
                  Sign in
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            ) : (
              <>
                <SettingRow label="Email" htmlFor="email-field">
                  <input
                    id="email-field"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="rounded-md border border-border-subtle bg-bg-surface-raised px-3 py-2 text-body-sm text-text-tertiary min-w-[200px] opacity-60"
                    aria-label="Account email address (read-only)"
                  />
                </SettingRow>

                <SettingRow label="Display Name" htmlFor="display-name-input">
                  <input
                    id="display-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal transition-colors min-w-[200px] min-h-[44px]"
                    aria-label="Display name"
                  />
                </SettingRow>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-md border border-accent-signal bg-accent-signal-muted text-accent-signal px-4 py-2.5 text-body-sm font-medium hover:bg-accent-signal hover:text-white transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
                    aria-label="Save profile changes"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>

                  <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-canvas text-text-secondary px-4 py-2.5 text-body-sm font-medium hover:border-data-negative/60 hover:text-data-negative transition-colors cursor-pointer min-h-[44px]"
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>

                {/* Danger zone */}
                <div className="rounded-lg border border-data-negative/30 bg-data-negative/5 p-4 mt-2">
                  <h3 className="text-body-sm font-semibold text-data-negative mb-2">Danger Zone</h3>
                  <p className="text-[12px] text-text-tertiary mb-3">
                    Permanently deletes your account and all associated data. This cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-md border border-data-negative/50 text-data-negative px-3 py-2 text-body-sm font-medium hover:bg-data-negative hover:text-white transition-colors cursor-pointer min-h-[44px]"
                      aria-label="Delete account (requires confirmation)"
                    >
                      Delete account
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2 items-center">
                      <p className="text-body-sm text-data-negative font-medium">Are you sure?</p>
                      <button
                        onClick={async () => {
                          await supabase.auth.admin?.deleteUser?.(user.id).catch(() => logout());
                          await logout();
                        }}
                        className="rounded-md bg-data-negative text-white px-3 py-2 text-body-sm font-medium cursor-pointer min-h-[44px]"
                        aria-label="Confirm account deletion"
                      >
                        Yes, delete permanently
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-md border border-border-subtle px-3 py-2 text-body-sm text-text-secondary cursor-pointer min-h-[44px]"
                        aria-label="Cancel account deletion"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </SettingsSection>
        </ErrorBoundary>

        {/* Export */}
        <ErrorBoundary context="Export settings">
          <SettingsSection
            title="Export"
            description="Download your knowledge base in portable formats."
            icon={<Download className="h-4.5 w-4.5 text-accent-signal" aria-hidden="true" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportMarkdown}
                disabled={exporting}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-canvas hover:border-accent-signal/50 hover:bg-accent-signal-muted/20 p-4 text-left transition-colors cursor-pointer disabled:opacity-50 min-h-[80px]"
                aria-label="Export Knowledge Vault as Markdown file"
              >
                <BookOpen className="h-6 w-6 text-accent-signal shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-body-sm font-semibold text-text-primary">
                    Export as Markdown
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">
                    Articles, notes, and flashcards in .md format
                  </div>
                </div>
                {exporting && <Loader2 className="h-4 w-4 animate-spin text-accent-signal ml-auto" aria-hidden="true" />}
              </button>

              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-canvas hover:border-data-positive/50 hover:bg-data-positive/5 p-4 text-left transition-colors cursor-pointer disabled:opacity-50 min-h-[80px]"
                aria-label="Export flashcards as CSV file"
              >
                <Download className="h-6 w-6 text-data-positive shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-body-sm font-semibold text-text-primary">
                    Export Flashcards CSV
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">
                    Compatible with Anki and other SRS tools
                  </div>
                </div>
              </button>
            </div>
          </SettingsSection>
        </ErrorBoundary>

        {/* Data */}
        <ErrorBoundary context="Data settings">
          <SettingsSection
            title="Data & Storage"
            description="Manage local cache and live data preferences."
            icon={<Database className="h-4.5 w-4.5 text-accent-signal" aria-hidden="true" />}
          >
            <SettingRow
              label="Clear Local Cache"
              description="Removes stored theme, session hints, and temporary UI state."
            >
              <button
                onClick={handleClearCache}
                className="rounded-md border border-border-subtle bg-bg-canvas text-text-secondary px-4 py-2.5 text-body-sm font-medium hover:border-data-negative/40 hover:text-data-negative transition-colors cursor-pointer min-h-[44px]"
                aria-label="Clear local browser cache"
              >
                Clear cache
              </button>
            </SettingRow>

            <SettingRow
              label="Live Data Ingestion"
              description="Trigger a manual cache refresh from all external data sources."
            >
              <a
                href="/api/ingest"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-data-neutral-amber/50 bg-data-neutral-amber/10 text-data-neutral-amber px-4 py-2.5 text-body-sm font-medium hover:bg-data-neutral-amber hover:text-white transition-colors min-h-[44px]"
                aria-label="Trigger live data refresh (opens in new tab)"
              >
                Refresh now
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </SettingRow>
          </SettingsSection>
        </ErrorBoundary>

        {/* Version info */}
        <p className="text-[11px] text-text-tertiary text-center font-mono pb-4">
          KnowledgeOS v1.0 · Phase 4 · Built with Next.js 16 + Supabase
        </p>
      </div>

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </GlobalShell>
  );
}
