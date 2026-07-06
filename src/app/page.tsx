"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useScroll, useTransform, motion } from "framer-motion";
import { GlobalShell } from "@/components/global-shell";
import { StatTicker, TickerItem } from "@/components/ui/stat-ticker";
import { TopicPill } from "@/components/ui/topic-pill";
import { InfoCard } from "@/components/ui/info-card";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import {
  Clock,
  ArrowRight,
  BookOpen,
  Loader2,
  Cpu,
  Folder,
  Globe,
  Sparkles,
  Search,
} from "lucide-react";

// ── Types ──
interface DBArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  key_points: string[];
  importance: 1 | 2 | 3;
  reading_time_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  published_at: string;
  category: {
    slug: string;
    name: string;
    icon: string;
  } | null;
  article_tags: {
    tag: {
      label: string;
    } | null;
  }[];
}

interface MappedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  key_points: string[];
  importance: 1 | 2 | 3;
  reading_time_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  published_at: string;
  category: {
    slug: string;
    name: string;
    icon: string;
  };
  tags: string[];
}

interface DBCategory {
  slug: string;
  name: string;
  icon: string;
  count?: number;
}

interface DBTopic {
  slug: string;
  label: string;
  mention_count: number;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [articles, setArticles] = useState<MappedArticle[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<DBTopic[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  // Stats for the Daily Snapshot strip
  const tickerItems: TickerItem[] = [
    { label: "Total Articles", value: articles.length },
    { label: "Countries Engaged", value: 12, changeType: "neutral" },
    {
      label: "High Importance",
      value: articles.filter((a) => a.importance === 3).length,
      changeType: "negative",
    },
    {
      label: "AI Developments",
      value: articles.filter((a) => a.category?.slug === "ai").length,
      changeType: "positive",
      change: "+12%",
    },
    { label: "SPX 500", value: "5,842.10", change: "+0.34%", changeType: "positive" },
    { label: "BTC / USD", value: "$96,430", change: "-1.2%", changeType: "negative" },
    { label: "Gold (oz)", value: "$2,350.40", change: "+0.8%", changeType: "positive" },
    { label: "Space Launches", value: "1 Today", changeType: "amber" },
    { label: "Syllabus Linked", value: "8 Articles", changeType: "positive" },
  ];

  // Check prefers-reduced-motion after mount safely
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = setTimeout(() => {
      setShouldReduceMotion(mediaQuery.matches);
    }, 0);
    const listener = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  // Fetch dashboard data for authenticated home
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setDashboardLoading(true);

        // Fetch Categories
        const { data: cats } = await supabase.from("categories").select("*");

        // Fetch Articles
        const { data: arts } = await supabase.from("articles").select(`
          id, slug, title, summary, key_points, importance, reading_time_minutes, difficulty, published_at,
          category:categories(slug, name, icon),
          article_tags(
            tag:tags(label)
          )
        `);

        // Fetch Trending Topics
        const { data: topics } = await supabase
          .from("trending_topics")
          .select("*")
          .order("mention_count", { ascending: false });

        if (arts) {
          const mapped: MappedArticle[] = (arts as unknown as DBArticle[]).map((art) => ({
            id: art.id,
            slug: art.slug,
            title: art.title,
            summary: art.summary,
            key_points: art.key_points || [],
            importance: art.importance,
            reading_time_minutes: art.reading_time_minutes,
            difficulty: art.difficulty,
            published_at: art.published_at,
            category: art.category || { slug: "general", name: "General", icon: "📁" },
            tags:
              art.article_tags
                ?.map((at) => at.tag?.label)
                .filter((l): l is string => !!l) || [],
          }));
          setArticles(mapped);

          if (cats) {
            const categoriesWithCounts = cats.map((cat) => ({
              slug: cat.slug,
              name: cat.name,
              icon: cat.icon,
              count: mapped.filter((a) => a.category?.slug === cat.slug).length,
            }));
            setCategories(categoriesWithCounts);
          }
        }

        if (topics) {
          setTrendingTopics(topics);
        }
      } catch (err) {
        console.error("Error fetching homepage dashboard data:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter articles based on active topic or show high-importance ones
  const displayedArticles = activeTopic
    ? articles.filter(
        (art) =>
          art.tags.map((t) => t.toLowerCase()).includes(activeTopic.toLowerCase()) ||
          art.slug.includes(activeTopic)
      )
    : articles.filter((art) => art.importance === 3);

  // Remaining articles for lower feeds
  const secondaryArticles = articles.filter(
    (art) => !displayedArticles.map((d) => d.id).includes(art.id)
  );

  // ────────────────────────────────────────────────────────
  // RENDER: Logged-Out Landing Page (Cobalt Visual Language)
  // ────────────────────────────────────────────────────────
  if (!authLoading && !user) {
    return <LandingPage shouldReduceMotion={shouldReduceMotion} />;
  }

  // ────────────────────────────────────────────────────────
  // RENDER: Authenticated Dashboard (with Hero Glow + Stat Card)
  // ────────────────────────────────────────────────────────
  return (
    <GlobalShell>
      {/* 1. Daily Snapshot Strip */}
      <StatTicker items={tickerItems} className="sticky top-14 z-20" />

      {dashboardLoading || authLoading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
            <span className="text-mono-sm font-mono uppercase tracking-wider">
              Syncing Dashboard...
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-8 relative">
          {/* Soft Radial Blue Glow Behind Hero Headline */}
          <div
            className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none filter blur-[100px] opacity-15 bg-accent-signal"
            style={{ zIndex: 0 }}
          />

          {/* Welcome Header */}
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
            <div className="flex flex-col gap-1 max-w-2xl">
              <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
                Personal Intelligence Core
              </span>
              <h1 className="text-display-lg font-display text-text-primary tracking-tight md:text-display-xl">
                Today&apos;s Intelligence Summary
              </h1>
              <p className="text-body-md text-text-secondary">
                A quiet space to understand world affairs, political systems, technology vectors,
                and advance your studies.
              </p>
            </div>

            {/* Subtle floating glass stat card (PRD/User spec) */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface-raised/85 backdrop-blur-md p-4 flex items-center gap-3 shrink-0 shadow-elevation max-w-xs self-start lg:self-center">
              <div className="h-8 w-8 rounded-lg bg-accent-signal-muted flex items-center justify-center text-accent-signal font-mono font-bold text-mono-md">
                12
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-body-sm font-semibold text-text-primary">
                  12-Day Reading Streak
                </span>
                <span className="text-[10px] text-text-tertiary font-mono uppercase">
                  Streak multiplier active
                </span>
              </div>
            </div>
          </div>

          {/* 2. Trending Topics Pill Strip */}
          <section className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider">
                Trending Knowledge Vectors
              </h2>
              {activeTopic && (
                <button
                  onClick={() => setActiveTopic(null)}
                  className="text-mono-sm text-accent-signal hover:underline font-mono cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap -mx-4 px-4 md:-mx-6 md:px-6">
              {trendingTopics.map((topic) => (
                <TopicPill
                  key={topic.slug}
                  label={topic.label}
                  active={activeTopic === topic.slug}
                  sparklineData={[30, 45, 50, 42, 60, 80, topic.mention_count]}
                  onClick={() => setActiveTopic(topic.slug)}
                />
              ))}
            </div>
          </section>

          {/* 3. Hero Feed Grid */}
          <section className="flex flex-col gap-4 relative z-10">
            <h2 className="text-heading-md font-display font-medium text-text-primary">
              {activeTopic ? `Focus: ${activeTopic.replace("-", " ")}` : "Top Priority Signals"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedArticles.map((article) => (
                <InfoCard
                  key={article.id}
                  importance={article.importance}
                  className="flex flex-col justify-between h-full"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-bg-surface-raised px-2 py-0.5 text-mono-sm font-mono text-text-secondary border border-border-subtle">
                        <span className="scale-95">{article.category?.icon || "📁"}</span>
                        <span>{article.category?.name || "General"}</span>
                      </span>
                      <ImportanceDot level={article.importance} />
                    </div>

                    <h3 className="text-heading-sm font-display font-semibold text-text-primary tracking-tight leading-snug group-hover:text-accent-signal">
                      <Link
                        href={`/article/${article.slug}`}
                        className="hover:text-accent-signal transition-colors"
                      >
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-body-sm text-text-secondary line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border-subtle/50 flex items-center justify-between text-mono-sm text-text-tertiary font-mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.reading_time_minutes}m
                      </span>
                      <span className="capitalize">{article.difficulty}</span>
                    </div>
                    <Link
                      href={`/article/${article.slug}`}
                      className="flex items-center gap-1 text-accent-signal hover:underline"
                    >
                      <span>Read</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </InfoCard>
              ))}
            </div>
          </section>

          {/* Two Column Section for remaining feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <h2 className="text-heading-md font-display font-medium text-text-primary">
                All Strategic Updates
              </h2>
              <div className="flex flex-col gap-4">
                {secondaryArticles.map((article) => (
                  <div
                    key={article.id}
                    className="group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface p-4 transition-colors duration-120 hover:border-accent-signal-muted"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-mono-sm text-text-secondary font-mono">
                            {article.category?.icon || "📁"} {article.category?.name || "General"}
                          </span>
                          <ImportanceDot level={article.importance} />
                          <span className="text-mono-sm text-text-tertiary font-mono">
                            · {article.reading_time_minutes}m read
                          </span>
                        </div>
                        <h3 className="text-body-md font-semibold text-text-primary group-hover:text-accent-signal transition-colors">
                          <Link href={`/article/${article.slug}`}>{article.title}</Link>
                        </h3>
                        <p className="text-body-sm text-text-secondary">{article.summary}</p>
                      </div>
                      <Link
                        href={`/article/${article.slug}`}
                        className="hidden sm:flex self-center rounded-md border border-border-subtle bg-bg-surface-raised p-2 text-text-secondary hover:text-accent-signal hover:border-accent-signal shrink-0 transition-all cursor-pointer"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {/* Category Quick-Grid */}
              <section className="flex flex-col gap-4">
                <h2 className="text-heading-md font-display font-medium text-text-primary">
                  Categories
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-surface p-3 transition-colors hover:border-accent-signal-muted hover:bg-bg-surface-raised/40 cursor-pointer"
                    >
                      <span className="text-lg bg-bg-canvas p-1 rounded-sm border border-border-subtle">
                        {cat.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-sm font-medium text-text-primary truncate">
                          {cat.name}
                        </span>
                        <span className="text-mono-sm text-text-tertiary font-mono">
                          {cat.count || 0} files
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Quick Brief selector strip */}
              <section className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-3">
                <h3 className="text-body-md font-semibold text-text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent-signal" />
                  <span>Daily Briefings</span>
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Access your morning, afternoon, and evening summary feeds.
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["morning", "afternoon", "evening"].map((time) => (
                    <Link
                      key={time}
                      href={`/brief/${time}`}
                      className="rounded border border-border-subtle bg-bg-surface-raised hover:border-accent-signal hover:text-accent-signal py-2 text-center text-mono-sm font-mono uppercase text-text-secondary transition-all"
                    >
                      {time}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </GlobalShell>
  );
}

// ────────────────────────────────────────────────────────
// SUBCOMPONENT: PUBLIC LANDING PAGE (Cobalt-inspired marketing)
// ────────────────────────────────────────────────────────
function LandingPage({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // useScroll to drive 3D tilt of the main screenshot
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Scroll transformation mapping for tilt (tilt flattens as it scrolls into full view)
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.93, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [0.5, 1]);

  // Motion variants for fade+rise scroll reveals
  const revealVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-bg-canvas text-text-primary selection:bg-accent-signal selection:text-white overflow-x-hidden"
    >
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-bg-canvas/80 backdrop-blur-md px-6 max-w-7xl mx-auto">
        <Link href="/" className="text-heading-md font-display font-medium tracking-tight">
          Knowledge<span className="text-accent-signal">OS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-md focus-visible:ring-2 focus-visible:ring-accent-signal"
          >
            Log In
          </Link>
          <Link
            href="/auth/login"
            className="text-body-sm font-medium text-white bg-accent-signal hover:bg-accent-signal/90 transition-all px-4 py-2 rounded-lg shadow-lg focus-visible:ring-2 focus-visible:ring-accent-signal"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Soft radial blue glow centered behind the headline */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none filter blur-[120px] opacity-15 bg-accent-signal"
          style={{ zIndex: 0 }}
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-3xl flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent-signal-muted bg-accent-signal-muted/20 px-3.5 py-1 text-mono-sm font-mono text-accent-signal uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive World Map & AI Vault</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-xl font-display font-medium tracking-tight text-text-primary leading-[1.1] max-w-2xl"
          >
            Personal intelligence dashboard for world affairs.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-body-lg text-text-secondary max-w-xl leading-relaxed"
          >
            Integrate news updates, category vaults, syllabus-linked study mode, and geopolitical
            conflict vectors into one unified command center.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-2"
          >
            <Link
              href="/auth/login"
              className="w-full sm:w-auto text-center rounded-lg bg-accent-signal hover:bg-accent-signal/90 text-white font-medium px-6 py-3 shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-accent-signal"
            >
              Get Started for Free
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto text-center rounded-lg border border-border-subtle bg-bg-surface-raised/40 hover:bg-bg-surface-raised text-text-primary font-medium px-6 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-accent-signal"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Floating Glass Notification-Style Cards (Desktop Only) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none select-none">
          {/* Card 1: High Importance News */}
          <motion.div
            animate={{ y: shouldReduceMotion ? 0 : [-8, 8, -8] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
            className="absolute top-16 left-6 rounded-xl border border-border-subtle bg-bg-surface-raised/75 backdrop-blur-md p-3.5 shadow-elevation max-w-xs flex gap-3 text-left"
            style={{ x: "-10%" }}
          >
            <div className="h-6 w-6 rounded-full bg-data-negative/25 flex items-center justify-center text-[10px] shrink-0 text-data-negative font-bold">
              🔴
            </div>
            <div>
              <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider">
                High Importance
              </span>
              <p className="text-body-sm font-semibold text-text-primary leading-snug mt-0.5">
                Middle East ceasefire talks resume in Geneva
              </p>
            </div>
          </motion.div>

          {/* Card 2: Streak info */}
          <motion.div
            animate={{ y: shouldReduceMotion ? 0 : [-8, 8, -8] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
            className="absolute top-28 right-6 rounded-xl border border-border-subtle bg-bg-surface-raised/75 backdrop-blur-md p-3.5 shadow-elevation max-w-xs flex gap-3 text-left"
            style={{ x: "10%" }}
          >
            <div className="h-6 w-6 rounded-full bg-data-positive/25 flex items-center justify-center text-[10px] shrink-0 text-data-positive font-bold">
              📈
            </div>
            <div>
              <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider">
                Streaks active
              </span>
              <p className="text-body-sm font-semibold text-text-primary leading-snug mt-0.5">
                Reading streak: 12 days
              </p>
            </div>
          </motion.div>

          {/* Card 3: Flashcard item */}
          <motion.div
            animate={{ y: shouldReduceMotion ? 0 : [-8, 8, -8] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.6,
            }}
            className="absolute bottom-12 left-12 rounded-xl border border-border-subtle bg-bg-surface-raised/75 backdrop-blur-md p-3.5 shadow-elevation max-w-xs flex gap-3 text-left"
            style={{ x: "-5%" }}
          >
            <div className="h-6 w-6 rounded-full bg-accent-signal-muted flex items-center justify-center text-[10px] shrink-0 text-accent-signal font-bold">
              🧠
            </div>
            <div>
              <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-wider">
                Study reminder
              </span>
              <p className="text-body-sm font-semibold text-text-primary leading-snug mt-0.5">
                Flashcard due: Federalism vs Unitarism
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Dashboard Product Screenshot (Scroll-driven Tilt) */}
      <section className="relative px-6 max-w-6xl mx-auto pb-24 flex justify-center">
        <motion.div
          style={{
            rotateX: shouldReduceMotion ? 0 : rotateX,
            scale,
            opacity,
            transformPerspective: 1200,
          }}
          className="relative w-full rounded-xl overflow-hidden border border-border-subtle bg-bg-surface shadow-2xl"
        >
          {/* Top decorative bar */}
          <div className="h-9 border-b border-border-subtle bg-bg-canvas px-4 flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
            <div className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
            <div className="h-2.5 w-2.5 rounded-full bg-border-subtle" />
            <div className="ml-4 h-4 w-40 rounded bg-bg-surface" />
          </div>
          {/* Main Screenshot Image */}
          <img
            src="/dashboard-screenshot.jpg"
            alt="KnowledgeOS Dashboard Screenshot"
            className="w-full h-auto object-cover"
          />
        </motion.div>
      </section>

      {/* 4. Bento Grid Feature Section */}
      <section id="features" className="py-24 border-t border-border-subtle/40 bg-bg-canvas/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
          {/* Section heading */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="max-w-2xl"
          >
            <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
              Explore the system
            </span>
            <h2 className="text-display-lg font-display font-medium text-text-primary tracking-tight mt-1">
              Everything you need, in one core.
            </h2>
            <p className="text-body-md text-text-secondary mt-2">
              Designed from the ground up to reduce cognitive load while optimizing information flow
              and study recall.
            </p>
          </motion.div>

          {/* Grid Layout (Collapses to single col on mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cell 1: Daily Brief (Hero Cell, 2 cols wide on desktop) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="md:col-span-2 rounded-xl border border-border-subtle bg-bg-surface p-6 flex flex-col justify-between min-h-[380px] group hover:border-accent-signal-muted transition-colors"
            >
              <div className="flex flex-col gap-2 max-w-md">
                <div className="h-10 w-10 rounded-lg bg-accent-signal-muted/50 flex items-center justify-center text-accent-signal border border-accent-signal/20 mb-2">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-heading-sm font-semibold text-text-primary">
                  Structured Daily Briefs
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Morning, Afternoon, and Evening updates structured specifically to keep you
                  well-informed without endless scrolling.
                </p>
              </div>

              {/* illustrative mockup snippet */}
              <div className="mt-6 rounded-lg border border-border-subtle bg-bg-canvas/80 p-4 flex flex-col gap-2.5 max-w-lg self-start w-full font-mono text-[11px] text-text-secondary">
                <div className="flex justify-between items-center text-mono-sm uppercase text-text-tertiary">
                  <span>Morning Brief</span>
                  <span>08:00 AM</span>
                </div>
                <div className="h-px bg-border-subtle" />
                <div className="flex gap-2">
                  <span className="text-data-negative">🔴</span>
                  <span>
                    <strong>UN Security Council</strong> votes on new cybersecurity resolution.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-data-neutral-amber">◆</span>
                  <span>
                    <strong>India-EU</strong> free trade negotiation cycle enters final phase.
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Cell 2: Live Dashboard */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="rounded-xl border border-border-subtle bg-bg-surface p-6 flex flex-col justify-between min-h-[380px] group hover:border-accent-signal-muted transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="h-10 w-10 rounded-lg bg-data-positive/10 flex items-center justify-center text-data-positive border border-data-positive/20 mb-2">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="text-heading-sm font-semibold text-text-primary">
                  Live Global Tickers
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Track stock market indexes, world weather, space launches, and global earthquake
                  networks live.
                </p>
              </div>

              {/* illustrative mockup snippet */}
              <div className="rounded-lg border border-border-subtle bg-bg-canvas/80 p-3 flex flex-col gap-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase">BTC/USD</span>
                  <span className="text-data-positive font-semibold">$96,430 (+2.1%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase">S&P 500</span>
                  <span className="text-data-positive font-semibold">5,842.10 (+0.3%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary uppercase">Weather Del</span>
                  <span className="text-data-neutral-amber">32°C Cloudy</span>
                </div>
              </div>
            </motion.div>

            {/* Cell 3: Study Mode */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="rounded-xl border border-border-subtle bg-bg-surface p-6 flex flex-col justify-between min-h-[380px] group hover:border-accent-signal-muted transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="h-10 w-10 rounded-lg bg-data-neutral-amber/10 flex items-center justify-center text-data-neutral-amber border border-data-neutral-amber/20 mb-2">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-heading-sm font-semibold text-text-primary">
                  Spaced Repetition Study
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Retain critical definitions and comparative ideologies using the SM-2 algorithm
                  flashcard engine.
                </p>
              </div>

              {/* illustrative mockup snippet */}
              <div className="rounded-lg border border-border-subtle bg-bg-canvas/80 p-4 text-center">
                <span className="text-mono-sm text-text-tertiary font-mono uppercase block mb-1">
                  Flashcard #44
                </span>
                <p className="text-body-sm font-semibold text-text-primary leading-tight">
                  What is Realist Theory in IR?
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-accent-signal font-mono uppercase">
                  <span>Reveal Answer</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.div>

            {/* Cell 4: Knowledge Vault (Hero Cell, 2 cols wide on desktop) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={revealVariants}
              className="md:col-span-2 rounded-xl border border-border-subtle bg-bg-surface p-6 flex flex-col justify-between min-h-[380px] group hover:border-accent-signal-muted transition-colors"
            >
              <div className="flex flex-col gap-2 max-w-md">
                <div className="h-10 w-10 rounded-lg bg-text-secondary/10 flex items-center justify-center text-text-secondary border border-border-subtle mb-2">
                  <Folder className="h-5 w-5" />
                </div>
                <h3 className="text-heading-sm font-semibold text-text-primary">
                  Unified Knowledge Vault
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Your secure space to save bookmarks, create rich notes, parse academic PDFs, and
                  record ideas. Securely gated behind Row-Level Security.
                </p>
              </div>

              {/* illustrative mockup snippet */}
              <div className="mt-6 grid grid-cols-2 gap-2 max-w-md w-full self-start">
                <div className="rounded border border-border-subtle bg-bg-canvas/80 p-2.5 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-accent-signal" />
                  <span className="text-mono-sm font-mono truncate">Indian Polity</span>
                </div>
                <div className="rounded border border-border-subtle bg-bg-canvas/80 p-2.5 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-data-positive" />
                  <span className="text-mono-sm font-mono truncate">Ideologies.md</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. "Meet your AI Assistant" Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-border-subtle/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text panel */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="flex flex-col gap-4"
          >
            <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
              Integrated intelligence
            </span>
            <h2 className="text-display-lg font-display font-medium text-text-primary tracking-tight">
              An AI companion built for deep context.
            </h2>
            <p className="text-body-md text-text-secondary leading-relaxed">
              KnowledgeOS integrates Claude AI directly in the sidebar drawer. Summarize research
              files, compare ideologies, or auto-generate flashcards instantly based on what you are
              reading.
            </p>
            <div className="mt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-signal hover:bg-accent-signal/90 text-white font-medium px-5 py-2.5 transition-all"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Floating glass chat bubble mockup (Cobalt "Genius" style) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="rounded-xl border border-border-subtle bg-bg-surface-raised/70 backdrop-blur-md p-6 shadow-elevation max-w-lg w-full flex flex-col gap-4"
          >
            {/* User message */}
            <div className="flex flex-col gap-1 max-w-[85%] self-end">
              <div className="rounded-lg bg-accent-signal text-white p-3 text-body-sm">
                Can you compare the realist and liberal views on international trade cooperation?
              </div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase text-right mr-1">
                User
              </span>
            </div>

            {/* AI message */}
            <div className="flex flex-col gap-1 max-w-[85%] self-start">
              <div className="rounded-lg border border-border-subtle bg-bg-canvas/90 text-text-secondary p-3 text-body-sm leading-relaxed">
                <strong>Realists</strong> view trade cooperation skeptically, emphasizing relative
                gains—cooperation is secondary to national security. <strong>Liberals</strong> view
                cooperation optimistically, focusing on absolute gains where mutual economic
                interdependence decreases the likelihood of war.
              </div>
              <span className="text-[9px] text-text-tertiary font-mono uppercase ml-1">
                AI Assistant
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Command Palette Callout Section */}
      <section className="py-24 border-t border-border-subtle/40 bg-bg-canvas/50">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center gap-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-accent-signal-muted/30 flex items-center justify-center text-accent-signal border border-accent-signal/20">
              <Search className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-display-lg font-display font-medium text-text-primary tracking-tight">
              Everything, one keystroke away.
            </h2>
            <p className="text-body-md text-text-secondary max-w-xl">
              Tap <kbd className="font-mono text-mono-sm bg-bg-surface-raised border border-border-subtle px-1.5 py-0.5 rounded">⌘K</kbd> to access the Command Palette. Instantly search all articles, swap theme presets, or toggle the AI panel.
            </p>
          </motion.div>

          {/* Screenshot of the Command Palette */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="w-full max-w-2xl rounded-xl overflow-hidden border border-border-subtle shadow-elevation"
          >
            <img
              src="/command-palette-screenshot.jpg"
              alt="KnowledgeOS Command Palette Screenshot"
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-border-subtle/30 bg-bg-canvas py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[12px] text-text-tertiary font-mono">
            &copy; 2026 KnowledgeOS. All rights reserved. WCAG 2.1 AA Compliance active.
          </div>
          <div className="flex items-center gap-6 text-body-sm text-text-secondary">
            <Link href="/auth/login" className="hover:text-text-primary transition-colors">
              App Core
            </Link>
            <Link href="/brief/morning" className="hover:text-text-primary transition-colors">
              Briefs
            </Link>
            <Link href="/progress" className="hover:text-text-primary transition-colors">
              Progress
            </Link>
            <Link href="/settings" className="hover:text-text-primary transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
