"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { StatTicker, TickerItem } from "@/components/ui/stat-ticker";
import { TopicPill } from "@/components/ui/topic-pill";
import { InfoCard } from "@/components/ui/info-card";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { supabase } from "@/lib/supabase";
import { Clock, ArrowRight, BookOpen, Loader2 } from "lucide-react";

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
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [articles, setArticles] = useState<MappedArticle[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<DBTopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats for the Daily Snapshot strip
  const tickerItems: TickerItem[] = [
    { label: "Total Articles", value: articles.length },
    { label: "Countries Engaged", value: 12, changeType: "neutral" },
    { label: "High Importance", value: articles.filter(a => a.importance === 3).length, changeType: "negative" },
    { label: "AI Developments", value: articles.filter(a => a.category?.slug === "ai").length, changeType: "positive", change: "+12%" },
    { label: "SPX 500", value: "5,842.10", change: "+0.34%", changeType: "positive" },
    { label: "BTC / USD", value: "$96,430", change: "-1.2%", changeType: "negative" },
    { label: "Gold (oz)", value: "$2,350.40", change: "+0.8%", changeType: "positive" },
    { label: "Space Launches", value: "1 Today", changeType: "amber" },
    { label: "Syllabus Linked", value: "8 Articles", changeType: "positive" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Categories & Counts
        const { data: cats } = await supabase
          .from("categories")
          .select("*");
        
        // 2. Fetch Articles with joins
        const { data: arts } = await supabase
          .from("articles")
          .select(`
            id, slug, title, summary, key_points, importance, reading_time_minutes, difficulty, published_at,
            category:categories(slug, name, icon),
            article_tags(
              tag:tags(label)
            )
          `);

        // 3. Fetch Trending Topics
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
            tags: art.article_tags?.map((at) => at.tag?.label).filter((l): l is string => !!l) || [],
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
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter articles based on active topic or show high-importance ones
  const displayedArticles = activeTopic
    ? articles.filter((art) => art.tags.map((t) => t.toLowerCase()).includes(activeTopic.toLowerCase()) || art.slug.includes(activeTopic))
    : articles.filter((art) => art.importance === 3);

  // Remaining articles for lower feeds
  const secondaryArticles = articles.filter(
    (art) => !displayedArticles.map((d) => d.id).includes(art.id)
  );

  return (
    <GlobalShell>
      {/* 1. Daily Snapshot Strip */}
      <StatTicker items={tickerItems} className="sticky top-14 z-20" />

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
            <span className="text-mono-sm font-mono uppercase tracking-wider">Syncing Dashboard...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-8">
          
          {/* Welcome Header */}
          <div className="flex flex-col gap-1">
            <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
              Personal Intelligence Core
            </span>
            <h1 className="text-display-lg font-display text-text-primary tracking-tight md:text-display-xl">
              Today&apos;s Intelligence Summary
            </h1>
            <p className="text-body-md text-text-secondary max-w-2xl">
              A quiet space to understand world affairs, political systems, technology vectors, and advance your studies.
            </p>
          </div>

          {/* 2. Trending Topics Pill Strip */}
          <section className="flex flex-col gap-3">
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
                  sparklineData={[30, 45, 50, 42, 60, 80, topic.mention_count]} // mock sparkline shape
                  onClick={() => setActiveTopic(topic.slug)}
                />
              ))}
            </div>
          </section>

          {/* 3. Hero Feed Grid (3 columns on desktop, 1 on mobile) */}
          <section className="flex flex-col gap-4">
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
                    {/* Category & Metas */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-sm bg-bg-surface-raised px-2 py-0.5 text-mono-sm font-mono text-text-secondary border border-border-subtle">
                        <span className="scale-95">{article.category?.icon || "📁"}</span>
                        <span>{article.category?.name || "General"}</span>
                      </span>
                      <ImportanceDot level={article.importance} />
                    </div>

                    {/* Title */}
                    <h3 className="text-heading-sm font-display font-semibold text-text-primary tracking-tight leading-snug group-hover:text-accent-signal">
                      <Link href={`/article/${article.slug}`} className="hover:text-accent-signal transition-colors">
                        {article.title}
                      </Link>
                    </h3>

                    {/* Summary */}
                    <p className="text-body-sm text-text-secondary line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  {/* Footer links */}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1 & 2: Secondary Feeds */}
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
                          <Link href={`/article/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h3>
                        <p className="text-body-sm text-text-secondary">
                          {article.summary}
                        </p>
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

            {/* Column 3: Category grid & Bookmarks Rail */}
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
                  Access your structured morning, afternoon, and evening summary feeds.
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
