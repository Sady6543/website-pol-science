"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlobalShell } from "@/components/global-shell";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  ArrowLeft,
  Bookmark,
  Share2,
  ExternalLink,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  BookmarkCheck
} from "lucide-react";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

interface MappedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  key_points: string[];
  body: string;
  importance: 1 | 2 | 3;
  reading_time_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  published_at: string;
  source_name: string;
  source_url: string;
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

interface Note {
  id: string;
  content: string;
  highlight_ref?: { quoted_text: string };
  created_at: string;
}

interface RelatedArticleItem {
  id: string;
  slug: string;
  title: string;
  importance: 1 | 2 | 3;
  category: {
    name: string;
  } | null;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { user } = useAuth();

  const [article, setArticle] = useState<MappedArticle | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [notes, setNotes] = useState("");
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticleItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  // Selection state for highlight-to-save
  const [selectionText, setSelectionText] = useState("");
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);

  // Fetch article contents and related details
  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        setLoading(true);
        const { data: art, error } = await supabase
          .from("articles")
          .select(`
            id, slug, title, summary, key_points, body, importance, reading_time_minutes, difficulty, published_at, source_name, source_url,
            category:categories(slug, name, icon),
            article_tags(tag:tags(label)),
            article_entities(entity_type, entity_name)
          `)
          .eq("slug", slug)
          .single();

        if (error || !art) {
          console.error("Article fetch error:", error);
          setArticle(null);
          setLoading(false);
          return;
        }

        const typedArt = art as unknown as {
          id: string;
          slug: string;
          title: string;
          summary: string | null;
          key_points: string[] | null;
          body: string | null;
          importance: number;
          reading_time_minutes: number;
          difficulty: string;
          published_at: string;
          source_name: string | null;
          source_url: string | null;
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
        };

        const mapped: MappedArticle = {
          id: typedArt.id,
          slug: typedArt.slug,
          title: typedArt.title,
          summary: typedArt.summary || "",
          key_points: typedArt.key_points || [],
          body: typedArt.body || "",
          importance: typedArt.importance as 1 | 2 | 3,
          reading_time_minutes: typedArt.reading_time_minutes,
          difficulty: typedArt.difficulty as MappedArticle["difficulty"],
          published_at: typedArt.published_at,
          source_name: typedArt.source_name || "Direct Link",
          source_url: typedArt.source_url || "#",
          category: typedArt.category || { slug: "general", name: "General", icon: "📁" },
          tags: typedArt.article_tags?.map((at) => at.tag?.label).filter((l): l is string => !!l) || [],
          entities: typedArt.article_entities?.map((ae) => ({
            type: ae.entity_type as "person" | "country" | "organization",
            name: ae.entity_name,
          })) || [],
        };

        setArticle(mapped);

        // Fetch User Bookmark State
        if (user) {
          const { data: bmark } = await supabase
            .from("bookmarks")
            .select("id")
            .eq("user_id", user.id)
            .eq("article_id", typedArt.id)
            .maybeSingle();
          setIsBookmarked(!!bmark);

          // Fetch User Notes list
          const { data: uNotes } = await supabase
            .from("notes")
            .select("id, content, highlight_ref, created_at")
            .eq("user_id", user.id)
            .eq("article_id", typedArt.id)
            .order("created_at", { ascending: true });
          
          setNotesList(uNotes || []);
        }

        // Fetch Related Articles
        const { data: rels } = await supabase
          .from("related_articles")
          .select(`
            related_article:articles(
              id, slug, title, importance,
              category:categories(name)
            )
          `)
          .eq("article_id", typedArt.id);

        if (rels) {
          const typedRels = rels as unknown as {
            related_article: {
              id: string;
              slug: string;
              title: string;
              importance: number;
              category: {
                name: string;
              } | null;
            } | null;
          }[];
          const mappedRels = typedRels
            .map((r) => r.related_article)
            .filter((x): x is NonNullable<typeof x> => !!x)
            .map((ra) => ({
              id: ra.id,
              slug: ra.slug,
              title: ra.title,
              importance: ra.importance as 1 | 2 | 3,
              category: ra.category,
            }));
          setRelatedArticles(mappedRels);
        }

      } catch (err) {
        console.error("Failed fetching article detailed view:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [slug, user]);

  // Scroll progress listener
  useEffect(() => {
    const handleScroll = () => {
      if (!mainContentRef.current) return;
      const element = mainContentRef.current;
      const totalHeight = element.clientHeight - window.innerHeight;
      const windowScrollTop = window.scrollY || document.documentElement.scrollTop;
      if (totalHeight > 0) {
        const progress = (windowScrollTop / totalHeight) * 100;
        setScrollProgress(Math.min(Math.max(progress, 0), 100));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Selection listener for highlight-to-save
  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 5) {
      setTooltipPos(null);
      setSelectionText("");
      return;
    }

    // Verify selection is inside article content node
    let node: Node | null = selection.anchorNode;
    let isInsideArticle = false;
    while (node) {
      if (node instanceof HTMLElement && node.getAttribute("data-article-body") === "true") {
        isInsideArticle = true;
        break;
      }
      node = node.parentNode;
    }

    if (!isInsideArticle) {
      setTooltipPos(null);
      setSelectionText("");
      return;
    }

    // Retrieve selection position bounding client
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 38,
      });
      setSelectionText(selectedText);
    } catch {
      setTooltipPos(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, [article]);

  const handleSaveHighlight = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!article || !selectionText) return;

    try {
      const { data: newNote, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          article_id: article.id,
          content: `Highlight: "${selectionText}"`,
          highlight_ref: { quoted_text: selectionText },
        })
        .select()
        .single();

      if (error) throw error;
      setNotesList((prev) => [...prev, newNote]);
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
      setTooltipPos(null);
      setSelectionText("");
    } catch (err) {
      console.error("Save highlight note error:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!article || !notes.trim()) return;

    try {
      const { data: newNote, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          article_id: article.id,
          content: notes.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      setNotesList((prev) => [...prev, newNote]);
      setNotes("");
    } catch (err) {
      console.error("Failed inserting note:", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
      setNotesList((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Note deletion error:", err);
    }
  };

  const toggleBookmark = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!article) return;

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", article.id);
        
        if (error) throw error;
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            article_id: article.id,
          });

        if (error) throw error;
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error("Bookmark toggle error:", err);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <GlobalShell>
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
            <span className="text-mono-sm font-mono uppercase tracking-wider">Syncing Article...</span>
          </div>
        </div>
      </GlobalShell>
    );
  }

  if (!article) {
    return (
      <GlobalShell>
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-bg-canvas text-text-primary">
          <h2 className="text-display-lg font-display text-text-primary">Article Not Found</h2>
          <p className="text-body-md text-text-secondary mt-2">The requested file could not be retrieved from the catalog.</p>
          <Link href="/" className="mt-4 rounded bg-accent-signal text-text-primary px-4 py-2 text-body-sm font-medium hover:opacity-90">
            Return to Dashboard
          </Link>
        </div>
      </GlobalShell>
    );
  }

  return (
    <GlobalShell>
      {/* Scroll progress bar */}
      <div
        className="fixed top-14 left-0 h-1 bg-accent-signal z-40 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      <div ref={mainContentRef} className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 relative">
        
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
          <Link
            href={`/categories/${article.category.slug}`}
            className="text-mono-sm text-text-secondary hover:text-accent-signal transition-colors font-mono uppercase"
          >
            {article.category.name}
          </Link>
          <span className="text-mono-sm text-text-tertiary">/</span>
          <span className="text-mono-sm text-text-tertiary font-mono truncate max-w-xs uppercase">
            {article.title}
          </span>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          
          {/* LEFT COLUMN: Reading Area */}
          <article className="lg:col-span-7 flex flex-col gap-6 select-text">
            
            {/* Title & Metadata */}
            <div className="flex flex-col gap-4 border-b border-border-subtle pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-bg-surface-raised border border-border-subtle px-2 py-0.5 text-mono-sm font-mono text-text-secondary">
                    {article.category.icon} {article.category.name}
                  </span>
                  <ImportanceDot level={article.importance} />
                </div>
                <div className="flex items-center gap-3 text-mono-sm text-text-secondary font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.reading_time_minutes} min read
                  </span>
                  <span className="capitalize border border-border-subtle/50 px-1.5 py-0.5 rounded text-[10px] bg-bg-surface-raised font-mono">
                    {article.difficulty}
                  </span>
                </div>
              </div>

              <h1 className="text-display-lg font-display text-text-primary tracking-tight font-semibold leading-tight md:text-display-xl">
                {article.title}
              </h1>

              <div className="flex items-center justify-between text-mono-sm text-text-tertiary font-mono">
                <span>Published · {new Date(article.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</span>
                <span className="text-text-secondary font-semibold hover:underline">
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    {article.source_name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </div>
            </div>

            {/* Structured Summary */}
            <div className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface/50 p-5">
              <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-accent-signal" />
              <div className="pl-2">
                <h3 className="text-mono-sm text-accent-signal font-mono uppercase tracking-wider mb-2">
                  Executive Briefing
                </h3>
                <p className="text-body-md text-text-primary font-medium leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="rounded-lg border border-border-subtle bg-bg-surface p-5">
              <h3 className="text-mono-sm text-text-secondary font-mono uppercase tracking-wider mb-3">
                Key Analytical Takeaways
              </h3>
              <ul className="flex flex-col gap-3 list-none">
                {article.key_points.map((point, index) => (
                  <li key={index} className="text-body-sm text-text-secondary flex gap-2.5 items-start">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-accent-signal-muted text-accent-signal text-[10px] font-mono mt-0.5">
                      {index + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Article text content body - selection listener tracks content within this element */}
            <div
              data-article-body="true"
              className="prose prose-invert max-w-none text-body-md text-text-secondary leading-relaxed space-y-6 selection:bg-accent-signal/30"
            >
              {article.body.split("\n\n").map((para, i) => {
                if (para.startsWith("###")) {
                  return (
                    <h3 key={i} className="text-heading-sm font-display font-semibold text-text-primary mt-6 mb-2">
                      {para.replace("###", "").trim()}
                    </h3>
                  );
                }
                if (para.startsWith("1.") || para.startsWith("-")) {
                  return (
                    <div key={i} className="pl-4 border-l border-border-subtle text-body-sm italic my-3 text-text-secondary">
                      {para}
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-body-md text-text-secondary">
                    {para}
                  </p>
                );
              })}
            </div>

            {/* Tags and Entities block */}
            <div className="border-t border-border-subtle pt-6 flex flex-col gap-4">
              {/* Entities Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-mono-sm text-text-tertiary font-mono uppercase mr-2">Entities:</span>
                {article.entities.map((ent, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-bg-surface border border-border-subtle px-3 py-1 text-body-sm font-medium text-text-secondary"
                  >
                    {ent.name} <span className="text-[10px] text-text-tertiary font-mono lowercase">({ent.type})</span>
                  </span>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-mono-sm text-text-tertiary font-mono uppercase mr-2">Tags:</span>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-mono-sm text-accent-signal font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </article>

          {/* RIGHT COLUMN: Sticky Sidebars */}
          <aside className="lg:col-span-3 flex flex-col gap-6 lg:sticky lg:top-20 z-10">
            
            {/* Control Panel */}
            <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle/50 pb-2">
                File Commands
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Bookmark trigger */}
                <button
                  onClick={toggleBookmark}
                  className={`flex items-center justify-center gap-2 rounded px-3 py-2 text-body-sm font-medium transition-all cursor-pointer border ${
                    isBookmarked
                      ? "bg-accent-signal-muted text-accent-signal border-accent-signal"
                      : "bg-bg-canvas border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary"
                  }`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                </button>

                {/* Share Link */}
                <button
                  onClick={copyShareLink}
                  className="flex items-center justify-center gap-2 rounded bg-bg-canvas border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary px-3 py-2 text-body-sm font-medium transition-colors cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{copySuccess ? "Copied!" : "Share Link"}</span>
                </button>
              </div>
            </div>

            {/* Knowledge Vault Notes panel */}
            <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle/50 pb-2 flex items-center justify-between">
                <span>Personal Notes</span>
                <span className="rounded bg-accent-signal-muted text-accent-signal px-1 py-0.5 text-[10px] font-mono uppercase tracking-tight scale-90">
                  Vault Live
                </span>
              </h3>

              {!user && (
                <div className="rounded border border-dashed border-border-subtle p-3 text-center text-body-sm text-text-secondary">
                  <Link href="/auth/login" className="text-accent-signal hover:underline">Sign In</Link> to log private notes.
                </div>
              )}

              {user && (
                <>
                  {/* Notes List */}
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {notesList.length === 0 ? (
                      <div className="text-[11px] text-text-tertiary font-mono italic p-2 text-center">
                        Highlight text or write below to log a vault note.
                      </div>
                    ) : (
                      notesList.map((note) => (
                        <div key={note.id} className="rounded bg-bg-canvas border border-border-subtle/60 p-2.5 text-body-sm text-text-secondary leading-relaxed relative group">
                          {note.highlight_ref && (
                            <div className="text-[10px] text-accent-signal font-semibold border-l-2 border-accent-signal pl-1.5 mb-1 italic truncate">
                              &ldquo;{note.highlight_ref.quoted_text}&rdquo;
                            </div>
                          )}
                          <div>
                            {note.highlight_ref ? note.content.replace(/^Highlight: ".*?"$/, "") || "Highlighted Quote" : note.content}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2 border-t border-border-subtle/30 pt-1">
                            <span className="text-[9px] text-text-tertiary font-mono">
                              {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-text-tertiary hover:text-data-negative opacity-0 group-hover:opacity-100 transition-opacity duration-100 cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Note input field */}
                  <form onSubmit={handleAddNote} className="flex flex-col gap-2 mt-2">
                    <textarea
                      placeholder="Annotate this article or draft a concept summary..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-20 rounded border border-border-subtle bg-bg-canvas p-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!notes.trim()}
                      className="rounded bg-accent-signal text-text-primary px-3 py-1.5 text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Save to Vault</span>
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Related Articles panel */}
            <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle/50 pb-2">
                Related Analyses
              </h3>
              
              {relatedArticles.length === 0 ? (
                <p className="text-body-sm text-text-tertiary">No immediate relative links found in standard indexing.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/article/${rel.slug}`}
                      className="group flex flex-col gap-1.5 p-2 rounded hover:bg-bg-surface-raised transition-colors border border-transparent hover:border-border-subtle"
                    >
                      <div className="flex items-center gap-2">
                        <ImportanceDot level={rel.importance} showLabel={false} />
                        <span className="text-[10px] text-text-tertiary font-mono uppercase">
                          {rel.category?.name || "General"}
                        </span>
                      </div>
                      <span className="text-body-sm font-semibold text-text-primary group-hover:text-accent-signal transition-colors leading-snug line-clamp-2">
                        {rel.title}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Highlight-to-Save Tooltip */}
      {tooltipPos && selectionText && (
        <button
          onClick={handleSaveHighlight}
          className="fixed z-50 bg-accent-signal text-text-primary px-3 py-1.5 rounded-full text-body-sm font-semibold flex items-center gap-1.5 shadow-elevation border border-accent-signal cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"
          style={{
            top: `${tooltipPos.y}px`,
            left: `${tooltipPos.x}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Save Highlight</span>
        </button>
      )}
    </GlobalShell>
  );
}
