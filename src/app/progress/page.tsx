"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GlobalShell } from "@/components/global-shell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { SkeletonCard, SkeletonHeatmap } from "@/components/ui/skeleton";
import {
  Flame,
  BookOpen,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface ActivityDay {
  date: string;
  count: number;
}

interface WeekdayStats {
  day: string;
  articles: number;
  minutes: number;
}

interface CategoryStat {
  name: string;
  icon: string;
  count: number;
  percentage: number;
}

// ── Heatmap ────────────────────────────────────────────────────
function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
  const today = new Date();
  const cells: { date: string; count: number }[] = [];

  // Build 52-week grid (364 days)
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = days.find((x) => x.date === dateStr);
    cells.push({ date: dateStr, count: found?.count ?? 0 });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-bg-surface-raised";
    if (count <= 2) return "bg-accent-signal/30";
    if (count <= 5) return "bg-accent-signal/60";
    return "bg-accent-signal";
  };

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="flex flex-col gap-2 overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, di) => (
              <div
                key={di}
                className={`heatmap-cell ${getColor(cell.count)} border border-border-subtle/20`}
                title={`${cell.date}: ${cell.count} article${cell.count !== 1 ? "s" : ""} read`}
                role="img"
                aria-label={`${cell.date}: ${cell.count} articles read`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Month labels */}
      <div className="flex gap-0 min-w-max text-[10px] text-text-tertiary font-mono pl-1">
        {weeks
          .filter((_, i) => i % 4 === 0)
          .map((week, i) => {
            const month = new Date(week[0]?.date || "").getMonth();
            return (
              <div key={i} style={{ width: "52px" }}>
                {months[month]}
              </div>
            );
          })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-text-tertiary font-mono">
        <span>Less</span>
        {["bg-bg-surface-raised","bg-accent-signal/30","bg-accent-signal/60","bg-accent-signal"].map((c,i) => (
          <div key={i} className={`h-3 w-3 rounded-sm border border-border-subtle/20 ${c}`} aria-hidden="true" />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Weekly Bar Chart ──────────────────────────────────────────
function WeeklyChart({ stats }: { stats: WeekdayStats[] }) {
  const max = Math.max(...stats.map((s) => s.articles), 1);

  return (
    <div className="flex items-end gap-2 h-32" role="img" aria-label="Weekly reading bar chart">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-[10px] text-text-tertiary font-mono">
            {s.articles > 0 ? s.articles : ""}
          </span>
          <div className="w-full rounded-t bg-bg-surface-raised flex flex-col justify-end" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t bg-accent-signal transition-all duration-300"
              style={{ height: `${(s.articles / max) * 80}px`, minHeight: s.articles > 0 ? "4px" : "0" }}
              role="presentation"
            />
          </div>
          <span className="text-[10px] text-text-tertiary font-mono uppercase">{s.day}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────
function CategoryDonut({ categories }: { categories: CategoryStat[] }) {
  const colors = [
    "stroke-accent-signal",
    "stroke-data-positive",
    "stroke-data-neutral-amber",
    "stroke-data-negative",
    "stroke-text-tertiary",
  ];

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  // Pre-compute cumulative arc offsets outside render (no mutation during map)
  const dashes = categories.map((cat) => (cat.percentage / 100) * circumference);
  const offsets = dashes.reduce<number[]>((acc, dash, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + dashes[i - 1]);
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" aria-hidden="true">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="12" className="stroke-bg-surface-raised" />
          {categories.map((cat, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="12"
              className={colors[i % colors.length]}
              strokeDasharray={`${dashes[i]} ${circumference - dashes[i]}`}
              strokeDashoffset={-offsets[i]}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-mono-sm font-mono text-text-secondary">{categories.length}cat</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-2 text-body-sm">
            <div
              className={`h-2 w-2 rounded-full shrink-0`}
              style={{ background: ["#3D6BFF","#3FC98A","#E0A93E","#F1584C","#5D6068"][i % 5] }}
              aria-hidden="true"
            />
            <span className="text-text-secondary truncate">{cat.icon} {cat.name}</span>
            <span className="ml-auto font-mono text-text-tertiary text-[11px] shrink-0">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProgressPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([]);
  const [weekdayStats, setWeekdayStats] = useState<WeekdayStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const fetchProgressData = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Fetch streak
        const { data: streakData } = await supabase
          .from("streaks")
          .select("current_streak, longest_streak, last_activity_date")
          .eq("user_id", user.id)
          .maybeSingle();

        if (streakData) setStreak(streakData);

        // Fetch reading activity (last 52 weeks)
        const since = new Date();
        since.setDate(since.getDate() - 364);
        const { data: activityData } = await supabase
          .from("reading_activity")
          .select("read_at, article_id")
          .eq("user_id", user.id)
          .gte("read_at", since.toISOString());

        if (activityData) {
          // Aggregate by date
          const byDate: Record<string, number> = {};
          const byWeekday: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 };
          let totalMins = 0;

          activityData.forEach((row) => {
            const d = new Date(row.read_at);
            const dateStr = d.toISOString().split("T")[0];
            byDate[dateStr] = (byDate[dateStr] || 0) + 1;
            byWeekday[d.getDay()] = (byWeekday[d.getDay()] || 0) + 1;
            totalMins += 8; // approx 8 min per article
          });

          setActivityDays(Object.entries(byDate).map(([date, count]) => ({ date, count })));
          setTotalArticles(activityData.length);
          setTotalMinutes(totalMins);

          const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          setWeekdayStats(dayNames.map((day, i) => ({
            day,
            articles: byWeekday[i],
            minutes: byWeekday[i] * 8,
          })));
        }

        // Fetch category distribution
        const { data: articleData } = await supabase
          .from("reading_activity")
          .select("article:articles(category:categories(name, icon))")
          .eq("user_id", user.id)
          .limit(200);

        if (articleData) {
          const catCounts: Record<string, { name: string; icon: string; count: number }> = {};
          articleData.forEach((row) => {
            const cat = (row.article as unknown as { category?: { name: string; icon: string } } | null)?.category;
            if (cat?.name) {
              if (!catCounts[cat.name]) catCounts[cat.name] = { name: cat.name, icon: cat.icon, count: 0 };
              catCounts[cat.name].count++;
            }
          });
          const total = Object.values(catCounts).reduce((s, c) => s + c.count, 0) || 1;
          setCategoryStats(
            Object.values(catCounts)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((c) => ({ ...c, percentage: Math.round((c.count / total) * 100) }))
          );
        }

        // Pomodoro sessions
        const { count: pomCount } = await supabase
          .from("pomodoro_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        setPomodoroCount(pomCount || 0);

      } else {
        // Demo data for logged-out visitors
        setStreak({ current_streak: 7, longest_streak: 21, last_activity_date: new Date().toISOString() });
        setTotalArticles(84);
        setTotalMinutes(672);
        setPomodoroCount(31);
        setWeekdayStats([
          { day: "Sun", articles: 3, minutes: 24 },
          { day: "Mon", articles: 8, minutes: 64 },
          { day: "Tue", articles: 12, minutes: 96 },
          { day: "Wed", articles: 10, minutes: 80 },
          { day: "Thu", articles: 7, minutes: 56 },
          { day: "Fri", articles: 9, minutes: 72 },
          { day: "Sat", articles: 5, minutes: 40 },
        ]);
        setCategoryStats([
          { name: "International Relations", icon: "🌐", count: 28, percentage: 33 },
          { name: "Indian Polity", icon: "🏛️", count: 20, percentage: 24 },
          { name: "Economy", icon: "📊", count: 15, percentage: 18 },
          { name: "Current Affairs", icon: "📰", count: 12, percentage: 14 },
          { name: "History", icon: "📜", count: 9, percentage: 11 },
        ]);
        // Demo heatmap — random sparse activity
        const demoActivity: ActivityDay[] = [];
        for (let i = 0; i < 180; i++) {
          if (Math.random() > 0.55) {
            const d = new Date();
            d.setDate(d.getDate() - Math.floor(Math.random() * 364));
            demoActivity.push({
              date: d.toISOString().split("T")[0],
              count: Math.floor(Math.random() * 8) + 1,
            });
          }
        }
        setActivityDays(demoActivity);
      }
    } catch (err) {
      console.error("Progress fetch error:", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(fetchProgressData, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const statCards = [
    {
      icon: <Flame className="h-5 w-5 text-data-negative" aria-hidden="true" />,
      label: "Current Streak",
      value: `${streak.current_streak}d`,
      sub: `Longest: ${streak.longest_streak}d`,
      color: "text-data-negative",
    },
    {
      icon: <BookOpen className="h-5 w-5 text-accent-signal" aria-hidden="true" />,
      label: "Articles Read",
      value: totalArticles.toString(),
      sub: "All time",
      color: "text-accent-signal",
    },
    {
      icon: <Clock className="h-5 w-5 text-data-neutral-amber" aria-hidden="true" />,
      label: "Reading Time",
      value: `${Math.round(totalMinutes / 60)}h`,
      sub: `${totalMinutes} minutes`,
      color: "text-data-neutral-amber",
    },
    {
      icon: <Zap className="h-5 w-5 text-data-positive" aria-hidden="true" />,
      label: "Pomodoros",
      value: pomodoroCount.toString(),
      sub: `${pomodoroCount * 25} mins focused`,
      color: "text-data-positive",
    },
  ];

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-display-lg font-display text-text-primary">
              Progress
            </h1>
            <p className="text-body-md text-text-secondary mt-1">
              Track streaks, reading activity, and study time across your knowledge base.
            </p>
          </div>
          <div className="flex items-center gap-2 text-mono-sm text-text-tertiary font-mono border border-border-subtle rounded-md px-3 py-1.5 bg-bg-surface shrink-0">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Last 52 weeks</span>
          </div>
        </div>

        {!user && (
          <div
            className="rounded-lg border border-data-neutral-amber/40 bg-data-neutral-amber/5 px-4 py-3 text-body-sm text-data-neutral-amber"
            role="note"
          >
            <strong>Demo mode</strong> — Sign in to track your real progress and sync streaks across devices.
          </div>
        )}

        {/* Stat Cards */}
        <section aria-label="Summary statistics">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border-subtle bg-bg-surface p-5 flex flex-col gap-3"
                  aria-label={`${card.label}: ${card.value}`}
                >
                  <div className="flex items-center justify-between">
                    {card.icon}
                    <TrendingUp className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className={`text-display-lg font-display font-bold ${card.color}`}>
                      {card.value}
                    </div>
                    <div className="text-mono-sm text-text-tertiary font-mono mt-0.5">
                      {card.label}
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      {card.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Streak Flame Visual */}
        {!loading && (
          <section
            className="rounded-xl border border-border-subtle bg-bg-surface p-6"
            aria-label="Reading streak"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-data-negative/10 border border-data-negative/20">
                  <Flame className="h-5 w-5 text-data-negative" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-heading-sm text-text-primary">Reading Streak</h2>
                  <p className="text-body-sm text-text-secondary">Keep reading daily to maintain your streak</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-display-lg font-display font-bold text-data-negative">
                    {streak.current_streak}
                  </div>
                  <div className="text-mono-sm text-text-tertiary font-mono">Current</div>
                </div>
                <div className="w-px bg-border-subtle" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-display-lg font-display font-bold text-text-secondary">
                    {streak.longest_streak}
                  </div>
                  <div className="text-mono-sm text-text-tertiary font-mono">Longest</div>
                </div>
              </div>
            </div>

            {/* Day dots — last 30 days */}
            <div className="flex gap-1.5 flex-wrap" aria-label="Last 30 days streak indicator">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = d.toISOString().split("T")[0];
                const active = activityDays.some((a) => a.date === dateStr);
                return (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full border ${
                      active
                        ? "bg-data-negative border-data-negative/50"
                        : "bg-bg-surface-raised border-border-subtle"
                    }`}
                    title={`${dateStr}: ${active ? "Read" : "Not read"}`}
                    aria-label={`${dateStr}: ${active ? "Read" : "Not read"}`}
                    role="img"
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Knowledge Heatmap */}
        <ErrorBoundary context="Knowledge Heatmap">
          <section
            className="rounded-xl border border-border-subtle bg-bg-surface p-6"
            aria-label="Knowledge heatmap — annual reading activity"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-signal/10 border border-accent-signal/20">
                <Target className="h-5 w-5 text-accent-signal" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-heading-sm text-text-primary">Knowledge Heatmap</h2>
                <p className="text-body-sm text-text-secondary">
                  {totalArticles} articles read across the past year
                </p>
              </div>
            </div>
            {loading ? (
              <SkeletonHeatmap />
            ) : (
              <ActivityHeatmap days={activityDays} />
            )}
          </section>
        </ErrorBoundary>

        {/* Weekly review + Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Bar Chart */}
          <ErrorBoundary context="Weekly Review">
            <section
              className="rounded-xl border border-border-subtle bg-bg-surface p-6"
              aria-label="Weekly reading review"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-data-positive/10 border border-data-positive/20">
                  <TrendingUp className="h-5 w-5 text-data-positive" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-heading-sm text-text-primary">Weekly Review</h2>
                  <p className="text-body-sm text-text-secondary">Articles read by day of week</p>
                </div>
              </div>
              {loading ? (
                <SkeletonCard />
              ) : (
                <WeeklyChart stats={weekdayStats} />
              )}
            </section>
          </ErrorBoundary>

          {/* Category Distribution */}
          <ErrorBoundary context="Category Distribution">
            <section
              className="rounded-xl border border-border-subtle bg-bg-surface p-6"
              aria-label="Reading distribution by category"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-data-neutral-amber/10 border border-data-neutral-amber/20">
                  <Trophy className="h-5 w-5 text-data-neutral-amber" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-heading-sm text-text-primary">Top Categories</h2>
                  <p className="text-body-sm text-text-secondary">Distribution of your reading focus</p>
                </div>
              </div>
              {loading ? (
                <SkeletonCard />
              ) : categoryStats.length === 0 ? (
                <p className="text-body-sm text-text-tertiary">
                  Start reading articles to see your category distribution here.
                </p>
              ) : (
                <CategoryDonut categories={categoryStats} />
              )}
            </section>
          </ErrorBoundary>
        </div>
      </div>
    </GlobalShell>
  );
}
