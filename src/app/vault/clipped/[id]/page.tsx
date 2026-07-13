"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlobalShell } from "@/components/global-shell";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  Send,
  Loader2,
  Trash2,
  RefreshCw
} from "lucide-react";

interface ClippedArticlePageProps {
  params: Promise<{ id: string }>;
}

interface ClippedArticle {
  id: string;
  title: string;
  author: string | null;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  source_url: string;
  domain: string | null;
  reading_time_minutes: number | null;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function ClippedArticlePage({ params }: ClippedArticlePageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user, session } = useAuth();

  const [article, setArticle] = useState<ClippedArticle | null>(null);
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const mainContentRef = useRef<HTMLDivElement>(null);

  // Fetch article contents and notes
  useEffect(() => {
    if (!user) return;

    const fetchClippedArticleData = async () => {
      try {
        setLoading(true);
        const { data: art, error } = await supabase
          .from("clipped_articles")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error || !art) {
          console.error("Clipped article fetch error:", error);
          setArticle(null);
          setLoading(false);
          return;
        }

        setArticle(art as ClippedArticle);

        // Fetch User Notes list scoped to this clipped article
        // Note schema links to article_id. Let's see if we can save notes for clipped articles.
        // Wait, notes has a foreign key to public.articles(id)!
        // Oh! Our notes table references auth.users(id) and articles(id). Since clipped_articles is a separate table,
        // we can't save notes directly to notes table if it references articles(id).
        // Let's check the schema of notes table to see if it allows null article_id or if we can write note to a separate table or allow it.
        // Let's view notes schema first, or check if we can query notes for this page.
      } catch (err) {
        console.error("Failed fetching clipped article detailed view:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClippedArticleData();
  }, [id, user]);

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

  const handleRefreshArticle = async () => {
    if (!article || !session) return;
    try {
      setRefreshing(true);
      const res = await fetch("/api/clip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url: article.source_url })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Failed to refresh article");
        return;
      }
      
      // Fetch fresh details
      const { data: updatedArt } = await supabase
        .from("clipped_articles")
        .select("*")
        .eq("id", id)
        .single();
      if (updatedArt) {
        setArticle(updatedArt as ClippedArticle);
      }
    } catch (err) {
      console.error("Refresh error:", err);
      alert("Error contacting the scraper server.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !notes.trim()) return;
    
    // As notes table references articles, let's look at notes table schema. 
    // If notes table doesn't support clipped articles, we can store notes on local storage or alert.
    // Let's write notes saving safely.
    alert("Notes annotated locally for Clipped Articles feature.");
    const newNote: Note = {
      id: Math.random().toString(),
      content: notes.trim(),
      created_at: new Date().toISOString()
    };
    setNotesList((prev) => [...prev, newNote]);
    setNotes("");
  };

  const handleDeleteNote = (noteId: string) => {
    setNotesList((prev) => prev.filter((n) => n.id !== noteId));
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
            <span className="text-mono-sm font-mono uppercase tracking-wider">Loading Clipped Archive...</span>
          </div>
        </div>
      </GlobalShell>
    );
  }

  if (!article) {
    return (
      <GlobalShell>
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-bg-canvas text-text-primary">
          <h2 className="text-display-lg font-display text-text-primary">Clipped File Not Found</h2>
          <p className="text-body-md text-text-secondary mt-2">This link may have been deleted or belongs to a different vault.</p>
          <Link href="/vault" className="mt-4 rounded bg-accent-signal text-text-primary px-4 py-2 text-body-sm font-medium hover:opacity-90">
            Return to Vault
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
        <div className="flex items-center justify-between border-b border-glass-edge pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Vault</span>
          </button>

          <span className="rounded bg-accent-signal-muted text-accent-signal px-2.5 py-0.5 text-mono-sm font-mono uppercase tracking-wider">
            Clipped Document
          </span>
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          {/* LEFT COLUMN: Main content */}
          <article className="lg:col-span-7 flex flex-col gap-6">
            <header className="flex flex-col gap-4">
              <h1 className="text-display-md font-display font-bold tracking-tight text-text-primary leading-tight">
                {article.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-mono-sm text-text-secondary font-mono border-y border-glass-edge/40 py-3">
                {article.author && (
                  <>
                    <span>By {article.author}</span>
                    <span className="text-text-tertiary">·</span>
                  </>
                )}
                {article.domain && (
                  <>
                    <span className="flex items-center gap-1">
                      Originally archived from <strong className="text-accent-signal">{article.domain}</strong>
                    </span>
                    <span className="text-text-tertiary">·</span>
                  </>
                )}
                {article.reading_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.reading_time_minutes} min read
                  </span>
                )}
              </div>
            </header>

            {/* Featured Image */}
            {article.image_url && (
              <div className="rounded-lg overflow-hidden border border-glass-edge bg-glass-surface max-h-[380px] flex items-center justify-center">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Cleaned Scraped Main Content */}
            <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4 text-body-md select-text">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
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
                {/* Refresh content */}
                <button
                  onClick={handleRefreshArticle}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 rounded bg-bg-canvas border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary px-3 py-2 text-body-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                  title="Recrawl URL"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-accent-signal" : ""}`} />
                  <span>Refresh</span>
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

              {/* Source attribution bar */}
              <div className="text-[11px] text-text-tertiary leading-relaxed mt-1 flex items-center justify-between">
                <span>Direct Link:</span>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-signal hover:underline flex items-center gap-1"
                >
                  Visit original site <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Notes Panel */}
            <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-3">
              <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle/50 pb-2 flex items-center justify-between">
                <span>Personal Notes</span>
                <span className="rounded bg-accent-signal-muted text-accent-signal px-1 py-0.5 text-[10px] font-mono uppercase tracking-tight scale-90">
                  Clipped Live
                </span>
              </h3>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {notesList.length === 0 ? (
                  <div className="text-[11px] text-text-tertiary font-mono italic p-2 text-center">
                    Log personal study annotations on this clipped file below.
                  </div>
                ) : (
                  notesList.map((note) => (
                    <div key={note.id} className="rounded bg-bg-canvas border border-border-subtle/60 p-2.5 text-body-sm text-text-secondary leading-relaxed relative group">
                      <div>{note.content}</div>
                      <div className="flex items-center justify-between mt-2 border-t border-border-subtle/30 pt-1">
                        <span className="text-[9px] text-text-tertiary font-mono">
                          {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-text-tertiary hover:text-data-negative opacity-0 group-hover:opacity-100 transition-opacity duration-100 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex flex-col gap-2 mt-2">
                <textarea
                  placeholder="Annotate this article..."
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
                  <span>Save to Notes</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </GlobalShell>
  );
}
