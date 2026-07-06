"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Folder,
  Bookmark,
  FileText,
  Quote,
  Lightbulb,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  ExternalLink,
  Save,
  X,
  FileTextIcon
} from "lucide-react";

type VaultTab = "bookmarks" | "notes" | "quotes" | "ideas" | "pdfs";

interface DBBookmark {
  id: string;
  created_at: string;
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    category: {
      name: string;
      icon: string;
    } | null;
  } | null;
}

interface DBNote {
  id: string;
  content: string;
  created_at: string;
  highlight_ref?: { quoted_text: string };
  article: {
    title: string;
    slug: string;
  } | null;
}

interface DBQuote {
  id: string;
  text: string;
  author: string;
  created_at: string;
  article: {
    title: string;
    slug: string;
  } | null;
}

interface DBIdea {
  id: string;
  content: string;
  created_at: string;
}

export default function VaultPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<VaultTab>("bookmarks");
  
  // Data lists
  const [bookmarks, setBookmarks] = useState<DBBookmark[]>([]);
  const [notes, setNotes] = useState<DBNote[]>([]);
  const [quotes, setQuotes] = useState<DBQuote[]>([]);
  const [ideas, setIdeas] = useState<DBIdea[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const [newIdeaText, setNewIdeaText] = useState("");
  const [newQuoteText, setNewQuoteText] = useState("");
  const [newQuoteAuthor, setNewQuoteAuthor] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchVaultData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Bookmarks
        const { data: bmarks } = await supabase
          .from("bookmarks")
          .select(`
            id, created_at,
            article:articles(
              id, title, slug, summary,
              category:categories(name, icon)
            )
          `);
        if (bmarks) setBookmarks(bmarks as unknown as DBBookmark[]);

        // 2. Fetch Notes
        const { data: nts } = await supabase
          .from("notes")
          .select(`
            id, content, created_at, highlight_ref,
            article:articles(title, slug)
          `);
        if (nts) setNotes(nts as unknown as DBNote[]);

        // 3. Fetch Quotes
        const { data: qts } = await supabase
          .from("quotes")
          .select(`
            id, text, author, created_at,
            article:articles(title, slug)
          `);
        if (qts) setQuotes(qts as unknown as DBQuote[]);

        // 4. Fetch Ideas
        const { data: ids } = await supabase
          .from("ideas")
          .select("*")
          .order("created_at", { ascending: false });
        if (ids) setIdeas(ids);

      } catch (err) {
        console.error("Vault data sync failure:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [user]);

  // Handlers
  const handleDeleteBookmark = async (id: string) => {
    try {
      await supabase.from("bookmarks").delete().eq("id", id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed deleting bookmark:", err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await supabase.from("notes").delete().eq("id", id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed deleting note:", err);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      await supabase.from("quotes").delete().eq("id", id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error("Failed deleting quote:", err);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await supabase.from("ideas").delete().eq("id", id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed deleting idea:", err);
    }
  };

  const handleStartEdit = (id: string, text: string, author?: string) => {
    setEditingId(id);
    setEditText(text);
    if (author) setEditAuthor(author);
  };

  const handleSaveEdit = async (table: "notes" | "quotes" | "ideas") => {
    if (!editingId) return;
    try {
      const payload: Record<string, string> = {};
      if (table === "notes" || table === "ideas") {
        payload.content = editText;
      } else if (table === "quotes") {
        payload.text = editText;
        payload.author = editAuthor;
      }

      await supabase.from(table).update(payload).eq("id", editingId);

      if (table === "notes") {
        setNotes((prev) => prev.map((n) => (n.id === editingId ? { ...n, content: editText } : n)));
      } else if (table === "quotes") {
        setQuotes((prev) => prev.map((q) => (q.id === editingId ? { ...q, text: editText, author: editAuthor } : q)));
      } else if (table === "ideas") {
        setIdeas((prev) => prev.map((i) => (i.id === editingId ? { ...i, content: editText } : i)));
      }

      setEditingId(null);
      setEditText("");
      setEditAuthor("");
    } catch (err) {
      console.error("Failed updating vault item:", err);
    }
  };

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaText.trim() || !user) return;
    try {
      const { data: created, error } = await supabase
        .from("ideas")
        .insert([{ content: newIdeaText, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      if (created) {
        setIdeas((prev) => [created, ...prev]);
        setNewIdeaText("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Failed adding idea:", err);
    }
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim() || !user) return;
    try {
      const { data: newQuote, error } = await supabase
        .from("quotes")
        .insert([{
          text: newQuoteText,
          author: newQuoteAuthor || "Unknown",
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      if (newQuote) {
        setQuotes((prev) => [newQuote, ...prev]);
        setNewQuoteText("");
        setNewQuoteAuthor("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Failed adding quote:", err);
    }
  };

  const sidebarItems = [
    { id: "bookmarks", label: "Bookmarks", icon: <Bookmark className="h-4.5 w-4.5" />, count: bookmarks.length },
    { id: "notes", label: "Personal Notes", icon: <FileText className="h-4.5 w-4.5" />, count: notes.length },
    { id: "quotes", label: "Logged Quotes", icon: <Quote className="h-4.5 w-4.5" />, count: quotes.length },
    { id: "ideas", label: "Conceptual Ideas", icon: <Lightbulb className="h-4.5 w-4.5" />, count: ideas.length },
    { id: "pdfs", label: "PDFs & Papers", icon: <FileTextIcon className="h-4.5 w-4.5" />, count: 0 },
  ];

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 relative">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] bg-glow-secondary/10 -z-10 pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-glass-edge pb-6">
          <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
            Knowledge Vault
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-display-lg font-display text-text-primary tracking-tight">
              Personal Intelligence Library
            </h1>
            
            {/* Add standalone resource trigger */}
            {(activeTab === "ideas" || activeTab === "quotes") && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-lg bg-accent-signal text-text-primary px-3.5 py-1.5 text-body-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-elevation"
              >
                {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span>{showAddForm ? "Cancel" : `Add stand-alone ${activeTab.slice(0, -1)}`}</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
              <span className="text-mono-sm font-mono uppercase tracking-wider">Syncing Vault...</span>
            </div>
          </div>
        ) : (
          /* Structured Vault split */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            
            {/* 1. Left Sidebar Navigation */}
            <GlassCard className="md:col-span-1 p-3 flex flex-col gap-1.5">
              <div className="text-mono-sm text-text-tertiary font-mono uppercase px-3 py-1.5 border-b border-glass-edge/40 mb-1">
                Library Indices
              </div>
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as VaultTab);
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className={`flex items-center justify-between rounded px-3 py-2.5 text-body-sm transition-colors cursor-pointer select-none ${
                    activeTab === item.id
                      ? "bg-glass-surface-raised border border-glass-edge text-accent-signal font-semibold"
                      : "text-text-secondary hover:bg-glass-surface-raised hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <span className="text-mono-sm font-mono text-text-tertiary">
                    {item.count}
                  </span>
                </button>
              ))}
            </GlassCard>

            {/* 2. Main content display container */}
            <div className="md:col-span-3 flex flex-col gap-6">
              
              {/* Standalone Input Form */}
              {showAddForm && activeTab === "ideas" && (
                <GlassCard glow="primary" className="p-4">
                  <form onSubmit={handleAddIdea} className="flex flex-col gap-3">
                    <h3 className="text-body-sm font-semibold text-text-primary">Draft Standalone Idea</h3>
                    <textarea
                      placeholder="Capture a concept, thesis draft, or flash idea..."
                      value={newIdeaText}
                      onChange={(e) => setNewIdeaText(e.target.value)}
                      required
                      className="w-full h-24 rounded border border-glass-edge bg-glass-surface/50 p-2.5 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal resize-none"
                    />
                    <button
                      type="submit"
                      className="rounded bg-accent-signal text-text-primary px-3 py-1.5 text-body-sm font-semibold hover:opacity-90 self-end flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Save to Ideas</span>
                    </button>
                  </form>
                </GlassCard>
              )}

              {showAddForm && activeTab === "quotes" && (
                <GlassCard glow="primary" className="p-4">
                  <form onSubmit={handleAddQuote} className="flex flex-col gap-3">
                    <h3 className="text-body-sm font-semibold text-text-primary">Log Standalone Quote</h3>
                    <textarea
                      placeholder="&ldquo;Double quote text...&rdquo;"
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      required
                      className="w-full h-20 rounded border border-glass-edge bg-glass-surface/50 p-2.5 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal resize-none"
                    />
                    <input
                      type="text"
                      placeholder="Author (e.g., Hans Morgenthau)"
                      value={newQuoteAuthor}
                      onChange={(e) => setNewQuoteAuthor(e.target.value)}
                      className="w-full rounded border border-glass-edge bg-glass-surface/50 py-1.5 px-2.5 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal"
                    />
                    <button
                      type="submit"
                      className="rounded bg-accent-signal text-text-primary px-3 py-1.5 text-body-sm font-semibold hover:opacity-90 self-end flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Save to Quotes</span>
                    </button>
                  </form>
                </GlassCard>
              )}

              {/* PDF placeholder info */}
              {activeTab === "pdfs" && (
                <GlassCard className="p-12 text-center flex flex-col gap-3 items-center justify-center border-dashed">
                  <Folder className="h-10 w-10 text-text-tertiary" />
                  <h3 className="text-heading-sm font-display font-medium text-text-primary">PDF Storage & Paper Uploads</h3>
                  <span className="rounded bg-accent-signal-muted text-accent-signal px-2 py-0.5 text-mono-sm font-mono uppercase tracking-wider">
                    Phase 2 Roadmap Item
                  </span>
                  <p className="text-body-sm text-text-secondary max-w-sm">
                    In the next release, this panel will host drag-and-drop uploads for research PDFs, automatically generating citation models and connecting them to your Study syllabus.
                  </p>
                </GlassCard>
              )}

              {/* BOOKMARKS LIST */}
              {activeTab === "bookmarks" && (
                <div className="flex flex-col gap-4">
                  {bookmarks.length === 0 ? (
                    <GlassCard className="p-12 text-center text-body-sm text-text-secondary border-dashed">
                      No bookmarks saved yet. Go read an article to bookmark it!
                    </GlassCard>
                  ) : (
                    bookmarks.map((bookmark) => (
                      <GlassCard
                        key={bookmark.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 text-mono-sm text-text-tertiary font-mono">
                            <span>{bookmark.article?.category?.icon} {bookmark.article?.category?.name}</span>
                            <span>· Saved {new Date(bookmark.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-body-md font-semibold text-text-primary hover:text-accent-signal transition-colors">
                            <Link href={`/article/${bookmark.article?.slug || ""}`}>
                              {bookmark.article?.title}
                            </Link>
                          </h3>
                          <p className="text-body-sm text-text-secondary line-clamp-2">
                            {bookmark.article?.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:self-center shrink-0">
                          <Link
                            href={`/article/${bookmark.article?.slug || ""}`}
                            className="rounded p-1.5 border border-glass-edge hover:text-accent-signal hover:border-accent-signal transition-colors"
                            title="Open Article"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="rounded p-1.5 border border-glass-edge text-text-secondary hover:text-data-negative hover:border-data-negative transition-colors cursor-pointer"
                            title="Remove Bookmark"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              )}

              {/* PERSONAL NOTES LIST */}
              {activeTab === "notes" && (
                <div className="flex flex-col gap-4">
                  {notes.length === 0 ? (
                    <GlassCard className="p-12 text-center text-body-sm text-text-secondary border-dashed">
                      No personal notes annotated in the vault.
                    </GlassCard>
                  ) : (
                    notes.map((note) => {
                      const isEditing = editingId === note.id;
                      return (
                        <GlassCard
                          key={note.id}
                          className="p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between border-b border-glass-edge/40 pb-2">
                            <div className="flex flex-col">
                              {note.article && (
                                <Link
                                  href={`/article/${note.article.slug}`}
                                  className="text-mono-sm text-accent-signal font-mono hover:underline truncate max-w-xs"
                                >
                                  {note.article.title}
                                </Link>
                              )}
                              <span className="text-[10px] text-text-tertiary font-mono">
                                Note logged on {new Date(note.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleStartEdit(note.id, note.content)}
                                className="text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                                title="Edit note"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-text-secondary hover:text-data-negative p-1 cursor-pointer"
                                title="Delete note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {note.highlight_ref && (
                            <div className="rounded bg-glass-surface-raised/40 border-l-2 border-accent-signal p-2 text-body-sm text-text-secondary italic">
                              &ldquo;{note.highlight_ref.quoted_text}&rdquo;
                            </div>
                          )}

                          {isEditing ? (
                            <div className="flex flex-col gap-2 mt-1">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-20 rounded border border-glass-edge bg-glass-surface/50 p-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-signal resize-none"
                              />
                              <div className="flex items-center gap-2 self-end">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded border border-glass-edge px-2.5 py-1 text-mono-sm font-mono uppercase text-text-secondary cursor-pointer hover:text-text-primary"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit("notes")}
                                  className="rounded bg-accent-signal text-text-primary px-2.5 py-1 text-mono-sm font-mono uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-body-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                              {note.content}
                            </p>
                          )}
                        </GlassCard>
                      );
                    })
                  )}
                </div>
              )}

              {/* LOGGED QUOTES LIST */}
              {activeTab === "quotes" && (
                <div className="flex flex-col gap-4">
                  {quotes.length === 0 ? (
                    <GlassCard className="p-12 text-center text-body-sm text-text-secondary border-dashed">
                      No logged quotes found. Draft a stand-alone quote above.
                    </GlassCard>
                  ) : (
                    quotes.map((quote) => {
                      const isEditing = editingId === quote.id;
                      return (
                        <GlassCard
                          key={quote.id}
                          className="p-5 flex flex-col gap-3 relative"
                        >
                          <div className="absolute top-4 right-4 flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(quote.id, quote.text, quote.author)}
                              className="text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                              title="Edit quote"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="text-text-secondary hover:text-data-negative p-1 cursor-pointer"
                              title="Delete quote"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {isEditing ? (
                            <div className="flex flex-col gap-3 pr-8">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-20 rounded border border-glass-edge bg-glass-surface/50 p-2 text-body-sm text-text-primary focus:outline-none focus:border-accent-signal resize-none"
                              />
                              <input
                                type="text"
                                value={editAuthor}
                                onChange={(e) => setEditAuthor(e.target.value)}
                                className="w-full rounded border border-glass-edge bg-glass-surface/50 py-1 px-2.5 text-body-sm text-text-primary focus:outline-none"
                              />
                              <div className="flex items-center gap-2 self-end mt-1">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded border border-glass-edge px-2.5 py-1 text-mono-sm font-mono uppercase text-text-secondary cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit("quotes")}
                                  className="rounded bg-accent-signal text-text-primary px-2.5 py-1 text-mono-sm font-mono uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="pr-12">
                              <p className="text-body-md text-text-primary font-medium italic leading-relaxed">
                                &ldquo;{quote.text}&rdquo;
                              </p>
                              <div className="flex flex-col mt-3">
                                <span className="text-body-sm font-semibold text-text-primary">
                                  — {quote.author}
                                </span>
                                {quote.article && (
                                  <Link
                                    href={`/article/${quote.article.slug}`}
                                    className="text-mono-sm text-text-tertiary font-mono hover:underline mt-0.5"
                                  >
                                    Source: {quote.article.title}
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}
                        </GlassCard>
                      );
                    })
                  )}
                </div>
              )}

              {/* CONCEPTUAL IDEAS LIST */}
              {activeTab === "ideas" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ideas.length === 0 ? (
                    <GlassCard className="sm:col-span-2 p-12 text-center text-body-sm text-text-secondary border-dashed">
                      No conceptual ideas logged yet. Draft a standalone idea above.
                    </GlassCard>
                  ) : (
                    ideas.map((idea) => {
                      const isEditing = editingId === idea.id;
                      return (
                        <GlassCard
                          key={idea.id}
                          className="p-4 flex flex-col justify-between gap-4"
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-24 rounded border border-glass-edge bg-glass-surface/50 p-2 text-body-sm text-text-primary focus:outline-none resize-none"
                              />
                              <div className="flex items-center gap-2 self-end">
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded border border-glass-edge px-2 py-0.5 text-mono-sm font-mono uppercase text-text-secondary cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit("ideas")}
                                  className="rounded bg-accent-signal text-text-primary px-2 py-0.5 text-mono-sm font-mono uppercase flex items-center gap-1 cursor-pointer"
                                >
                                  <Save className="h-3 w-3" />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {idea.content}
                              </p>
                              <div className="flex items-center justify-between border-t border-glass-edge/40 pt-2 text-[10px] text-text-tertiary font-mono">
                                <span>Logged {new Date(idea.created_at).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleStartEdit(idea.id, idea.content)}
                                    className="hover:text-text-primary p-0.5 cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteIdea(idea.id)}
                                    className="hover:text-data-negative p-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </GlassCard>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </GlobalShell>
  );
}
