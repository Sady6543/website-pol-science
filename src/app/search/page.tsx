"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { GlobalShell } from "@/components/global-shell";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { Search, FileText, Lightbulb, Library, Loader2, ArrowRight } from "lucide-react";

type SearchFilter = "all" | "articles" | "notes" | "ideas";

interface SearchArticleResult {
  id: string;
  slug: string;
  title: string;
  summary: string;
  importance: 1 | 2 | 3;
  category: {
    name: string;
    icon: string;
  } | null;
}

interface SearchNoteResult {
  id: string;
  content: string;
  article: {
    title: string;
    slug: string;
  } | null;
}

interface SearchIdeaResult {
  id: string;
  content: string;
  created_at: string;
}

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const { user } = useAuth();

  const [query, setQuery] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");
  const [loading, setLoading] = useState(false);

  // Search Results states
  const [articles, setArticles] = useState<SearchArticleResult[]>([]);
  const [notes, setNotes] = useState<SearchNoteResult[]>([]);
  const [ideas, setIdeas] = useState<SearchIdeaResult[]>([]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  useEffect(() => {
    const executeSearch = async () => {
      if (!queryParam.trim()) {
        setArticles([]);
        setNotes([]);
        setIdeas([]);
        return;
      }

      try {
        setLoading(true);
        const formattedQuery = queryParam.trim();

        // 1. Search Articles using computed GIN textsearch column
        // Fallback to ilike if textSearch returns error or has special chars
        let articlesData: SearchArticleResult[] = [];
        try {
          const { data, error } = await supabase
            .from("articles")
            .select(`
              id, slug, title, summary, importance,
              category:categories(name, icon)
            `)
            .textSearch("textsearchable_index_col", formattedQuery, {
              type: "websearch",
              config: "english"
            });
          
          if (error) throw error;
          articlesData = (data as unknown as SearchArticleResult[]) || [];
        } catch (err) {
          console.warn("FTS search fallback to ilike query mapping:", err);
          const { data } = await supabase
            .from("articles")
            .select(`
              id, slug, title, summary, importance,
              category:categories(name, icon)
            `)
            .or(`title.ilike.%${formattedQuery}%,summary.ilike.%${formattedQuery}%,body.ilike.%${formattedQuery}%`);
          articlesData = (data as unknown as SearchArticleResult[]) || [];
        }
        setArticles(articlesData);

        // 2. Search Notes (User-scoped only)
        if (user) {
          const { data: notesData } = await supabase
            .from("notes")
            .select(`
              id, content,
              article:articles(title, slug)
            `)
            .eq("user_id", user.id)
            .ilike("content", `%${formattedQuery}%`);

          const typedNotes = (notesData as unknown as {
            id: string;
            content: string;
            article: { title: string; slug: string } | { title: string; slug: string }[] | null;
          }[]) || [];

          const mappedNotes: SearchNoteResult[] = typedNotes.map((n) => ({
            id: n.id,
            content: n.content,
            article: Array.isArray(n.article) ? n.article[0] || null : n.article || null,
          }));

          setNotes(mappedNotes);

          // 3. Search Ideas (User-scoped only)
          const { data: ideasData } = await supabase
            .from("ideas")
            .select("id, content, created_at")
            .eq("user_id", user.id)
            .ilike("content", `%${formattedQuery}%`);
          setIdeas((ideasData as SearchIdeaResult[]) || []);
        }

      } catch (err) {
        console.error("Search execution failure:", err);
      } finally {
        setLoading(false);
      }
    };

    executeSearch();
  }, [queryParam, user]);

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search articles, notes, quotes, or conceptual ideas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-bg-surface py-3.5 pl-12 pr-4 text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal shadow-elevation"
        />
      </form>

      {/* Tab Filter Links */}
      <div className="flex items-center gap-1.5 border-b border-border-subtle pb-3">
        {(["all", "articles", "notes", "ideas"] as SearchFilter[]).map((filter) => {
          const count =
            filter === "articles" ? articles.length :
            filter === "notes" ? notes.length :
            filter === "ideas" ? ideas.length :
            articles.length + notes.length + ideas.length;

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded px-3 py-1.5 text-mono-sm font-mono uppercase transition-colors border cursor-pointer ${
                activeFilter === filter
                  ? "bg-accent-signal-muted text-accent-signal border-accent-signal"
                  : "bg-transparent border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {filter} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
        </div>
      ) : (
        /* Results Container */
        <div className="flex flex-col gap-6">
          {articles.length === 0 && notes.length === 0 && ideas.length === 0 && queryParam && (
            <div className="rounded-lg border border-dashed border-border-subtle p-12 text-center text-body-md text-text-secondary">
              No matching files or notes found for &ldquo;{queryParam}&rdquo;.
            </div>
          )}

          {/* Article Results */}
          {(activeFilter === "all" || activeFilter === "articles") && articles.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Library className="h-4 w-4 text-accent-signal" />
                <span>Articles & Archives</span>
              </h3>
              <div className="flex flex-col gap-3">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="group relative rounded-lg border border-border-subtle bg-bg-surface p-4 hover:border-accent-signal-muted transition-colors flex justify-between items-center gap-4"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-text-tertiary uppercase">
                        <span>{art.category?.icon} {art.category?.name}</span>
                        <ImportanceDot level={art.importance} showLabel={false} />
                      </div>
                      <h4 className="text-body-md font-semibold text-text-primary group-hover:text-accent-signal transition-colors truncate">
                        <Link href={`/article/${art.slug}`}>
                          {art.title}
                        </Link>
                      </h4>
                      <p className="text-body-sm text-text-secondary line-clamp-2">
                        {art.summary}
                      </p>
                    </div>
                    <Link
                      href={`/article/${art.slug}`}
                      className="rounded border border-border-subtle bg-bg-surface-raised p-1.5 text-text-secondary hover:text-accent-signal hover:border-accent-signal transition-colors shrink-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note Results */}
          {(activeFilter === "all" || activeFilter === "notes") && notes.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-accent-signal" />
                <span>Personal Annotations</span>
              </h3>
              <div className="flex flex-col gap-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-2 hover:border-accent-signal-muted transition-colors"
                  >
                    <div className="text-[10px] text-text-tertiary font-mono">
                      Logged under:{" "}
                      {note.article ? (
                        <Link href={`/article/${note.article.slug}`} className="text-accent-signal hover:underline">
                          {note.article.title}
                        </Link>
                      ) : (
                        <span>General Note</span>
                      )}
                    </div>
                    <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idea Results */}
          {(activeFilter === "all" || activeFilter === "ideas") && ideas.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-accent-signal" />
                <span>Conceptual Ideas</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col justify-between gap-3 hover:border-accent-signal-muted transition-colors"
                  >
                    <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {idea.content}
                    </p>
                    <span className="text-[9px] text-text-tertiary font-mono">
                      Logged: {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <GlobalShell>
      <Suspense fallback={
        <div className="flex-1 flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
        </div>
      }>
        <SearchResultsContent />
      </Suspense>
    </GlobalShell>
  );
}
