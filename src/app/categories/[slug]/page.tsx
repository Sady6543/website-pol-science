"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ArrowUpDown, Filter, User, Landmark, Building, Loader2 } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

type SortOption = "latest" | "importance" | "saved";

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
  entities: {
    type: "person" | "country" | "organization";
    name: string;
  }[];
}

interface DBCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [category, setCategory] = useState<DBCategory | null>(null);
  const [articles, setArticles] = useState<MappedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch current category details
        const { data: catData, error: catErr } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .single();

        if (catErr || !catData) {
          console.warn("Category slug not found:", slug);
          setCategory({
            id: "",
            slug,
            name: slug.charAt(0).toUpperCase() + slug.slice(1).replace("-", " "),
            icon: "📁",
          });
          setLoading(false);
          return;
        }
        
        setCategory(catData);

        // 2. Fetch all articles in this category (with join details)
        const { data: arts } = await supabase
          .from("articles")
          .select(`
            id, slug, title, summary, key_points, importance, reading_time_minutes, difficulty, published_at,
            category:categories(slug, name, icon),
            article_tags(
              tag:tags(label)
            ),
            article_entities(
              entity_type,
              entity_name
            )
          `)
          .eq("category_id", catData.id);

        if (arts) {
          const typedArts = arts as unknown as {
            id: string;
            slug: string;
            title: string;
            summary: string | null;
            key_points: string[] | null;
            importance: number;
            reading_time_minutes: number;
            difficulty: string;
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
            article_entities: {
              entity_type: string;
              entity_name: string;
            }[];
          }[];

          const mapped: MappedArticle[] = typedArts.map((art) => ({
            id: art.id,
            slug: art.slug,
            title: art.title,
            summary: art.summary || "",
            key_points: art.key_points || [],
            importance: art.importance as 1 | 2 | 3,
            reading_time_minutes: art.reading_time_minutes,
            difficulty: art.difficulty as MappedArticle["difficulty"],
            published_at: art.published_at,
            category: art.category || { slug: catData.slug, name: catData.name, icon: catData.icon },
            tags: art.article_tags?.map((at) => at.tag?.label).filter((l): l is string => !!l) || [],
            entities: art.article_entities?.map((ae) => ({
              type: ae.entity_type as "person" | "country" | "organization",
              name: ae.entity_name,
            })) || [],
          }));
          setArticles(mapped);
        }

      } catch (err) {
        console.error("Error loading category page data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  // Extract all unique tags as sub-topic chips
  const subTopics = Array.from(
    new Set(articles.flatMap((art) => art.tags))
  );

  // Filter and sort articles
  let filteredArticles = [...articles];

  if (selectedSubTopic) {
    filteredArticles = filteredArticles.filter((art) =>
      art.tags.includes(selectedSubTopic)
    );
  }

  if (sortBy === "latest") {
    filteredArticles.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  } else if (sortBy === "importance") {
    filteredArticles.sort((a, b) => b.importance - a.importance);
  } else if (sortBy === "saved") {
    filteredArticles.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Extract key entities active in this category
  const allEntities = articles.flatMap((art) => art.entities);
  // De-duplicate entities by name
  const uniqueEntities = allEntities.filter(
    (entity, index, self) =>
      self.findIndex((e) => e.name === entity.name && e.type === entity.type) === index
  ).slice(0, 8); // cap at 8 entities

  return (
    <GlobalShell>
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
            <span className="text-mono-sm font-mono uppercase tracking-wider">Loading Archive...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 text-mono-sm text-text-secondary hover:text-accent-signal transition-colors font-mono uppercase"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Dashboard</span>
            </Link>
            <span className="text-mono-sm text-text-tertiary">/</span>
            <span className="text-mono-sm text-text-tertiary font-mono uppercase">Categories</span>
            <span className="text-mono-sm text-text-tertiary">/</span>
            <span className="text-mono-sm text-text-secondary font-mono uppercase">{category?.name}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl bg-bg-surface p-1.5 rounded border border-border-subtle shrink-0">
                {category?.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
                  Category Archive
                </span>
                <h1 className="text-display-lg font-display text-text-primary tracking-tight">
                  {category?.name}
                </h1>
              </div>
            </div>
            <p className="text-body-md text-text-secondary mt-1">
              Analyzing trends, research files, and curated articles on {category?.name.toLowerCase()}.
            </p>
          </div>

          {/* Filters and Subtopics strip */}
          <div className="flex flex-col gap-4 border-y border-border-subtle/70 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter tags title */}
              <div className="flex items-center gap-2 text-mono-sm text-text-secondary font-mono uppercase">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter by Sub-Topic:</span>
              </div>

              {/* Sort Dropdown / Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-mono-sm text-text-tertiary font-mono uppercase flex items-center gap-1.5">
                  <ArrowUpDown className="h-3 w-3" />
                  Sort:
                </span>
                {(["latest", "importance", "saved"] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`rounded px-2.5 py-1 text-mono-sm font-mono uppercase transition-colors border cursor-pointer ${
                      sortBy === opt
                        ? "bg-accent-signal-muted text-accent-signal border-accent-signal"
                        : "bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-surface-raised"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtopic chips scrollable */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubTopic(null)}
                className={`rounded-full px-3 py-1 text-body-sm font-medium transition-colors border cursor-pointer ${
                  selectedSubTopic === null
                    ? "bg-text-primary text-bg-canvas border-text-primary"
                    : "bg-bg-surface text-text-secondary border-border-subtle hover:bg-bg-surface-raised"
                }`}
              >
                All Topics
              </button>
              {subTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedSubTopic(topic)}
                  className={`rounded-full px-3 py-1 text-body-sm font-medium transition-colors border cursor-pointer ${
                    selectedSubTopic === topic
                      ? "bg-accent-signal text-text-primary border-accent-signal"
                      : "bg-bg-surface text-text-secondary border-border-subtle hover:bg-bg-surface-raised"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Main content split (Articles List / Key Entities Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Feed List (Left 2 columns) */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {filteredArticles.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-subtle p-12 text-center text-body-md text-text-secondary">
                  No articles found in this selection.
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface p-5 transition-colors duration-120 hover:border-accent-signal-muted"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImportanceDot level={article.importance} />
                          <span className="text-mono-sm text-text-tertiary font-mono">
                            {new Date(article.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="text-mono-sm text-text-secondary font-mono">
                          {article.reading_time_minutes}m read
                        </span>
                      </div>

                      <h2 className="text-heading-sm font-display font-semibold text-text-primary group-hover:text-accent-signal transition-colors leading-snug">
                        <Link href={`/article/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h2>

                      <p className="text-body-sm text-text-secondary line-clamp-3">
                        {article.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-bg-surface-raised border border-border-subtle px-1.5 py-0.5 text-mono-sm text-text-tertiary font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Key Entities Sidebar (Right Column) */}
            <div className="flex flex-col gap-6">
              <section className="rounded-lg border border-border-subtle bg-bg-surface p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle/50 pb-2">
                  <Landmark className="h-4 w-4" />
                  <span>Key Entities Active</span>
                </div>
                
                {uniqueEntities.length === 0 ? (
                  <p className="text-body-sm text-text-tertiary">No entities tracked in this week&apos;s cycle.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {uniqueEntities.map((entity, i) => {
                      let Icon = User;
                      if (entity.type === "country") Icon = Landmark;
                      if (entity.type === "organization") Icon = Building;

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded bg-bg-canvas border border-border-subtle/40 px-3 py-2"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-bg-surface-raised border border-border-subtle text-text-secondary shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-body-sm font-semibold text-text-primary truncate">
                              {entity.name}
                            </span>
                            <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-tight">
                              {entity.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </GlobalShell>
  );
}
