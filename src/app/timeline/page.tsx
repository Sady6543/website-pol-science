"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { supabase } from "@/lib/supabase";
import { Calendar, ChevronDown, ChevronUp, Loader2, ArrowRight } from "lucide-react";

interface DBTimelineEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  topic_slug: string;
  article_id: string | null;
  article?: {
    title: string;
    slug: string;
  } | null;
}

type ZoomLevel = "century" | "decade" | "year";

export default function TimelinePage() {
  const [events, setEvents] = useState<DBTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState<ZoomLevel>("year");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Self-healing database seeder
  const seedTimelineEvents = async () => {
    try {
      const { data: articles } = await supabase.from("articles").select("id, slug");
      
      const findId = (slug: string) => articles?.find((a) => a.slug === slug)?.id || null;

      const seedEvents = [
        {
          title: "Neuroscience Spaced Repetition Study",
          description: "A landmark study published in Neuron tracks dendritic spine changes, mapping direct protein synthesis during spaced Leitner intervals.",
          event_date: "2026-06-25",
          topic_slug: "learning",
          article_id: findId("spaced-repetition-cognitive-science")
        },
        {
          title: "Next.js 16 Edge Stream Releases",
          description: "Vercel rolls out hydration-concurrency streaming edge upgrades, reducing remote node first-input delays by 35%.",
          event_date: "2026-06-29",
          topic_slug: "technology",
          article_id: findId("nextjs-app-router-performance-2026")
        },
        {
          title: "Inertial Fusion Exceeds 5MJ Threshold",
          description: "Delivering a 2.5x gain over laser pulse outputs, NIF achieves scientific breakeven using diamond capsule targets.",
          event_date: "2026-07-01",
          topic_slug: "science",
          article_id: findId("fusion-energy-breakthrough-ignition")
        },
        {
          title: "India Cabinet Clears $5B ISM Budget Upgrade",
          description: "Fiscal compound semiconductor support scales, introducing 50% project subsidies for silicon carbide fabs.",
          event_date: "2026-07-03",
          topic_slug: "india",
          article_id: findId("india-semiconductor-mission-2026")
        },
        {
          title: "OpenAI Leaks Reasoning 'Frontier-V'",
          description: "Leaked files detail 256 sparse MoE routing branches and reasoning compute loops bypassing traditional hardware ceilings.",
          event_date: "2026-07-03",
          topic_slug: "ai",
          article_id: findId("openai-scaling-frontiers-gpt5")
        }
      ];

      await supabase.from("timeline_events").upsert(
        seedEvents.map((ev, i) => ({
          id: `t1451f28-024e-4f11-9a7f-e274cfb7c90${i + 1}`,
          ...ev
        }))
      );
    } catch (err) {
      console.warn("Could not auto-seed timeline events:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("timeline_events")
        .select(`
          id, title, description, event_date, topic_slug, article_id,
          article:articles(title, slug)
        `)
        .order("event_date", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Run seed and fetch again
        await seedTimelineEvents();
        const { data: refetched } = await supabase
          .from("timeline_events")
          .select(`
            id, title, description, event_date, topic_slug, article_id,
            article:articles(title, slug)
          `)
          .order("event_date", { ascending: false });
        setEvents((refetched as unknown as DBTimelineEvent[]) || []);
      } else {
        setEvents(data as unknown as DBTimelineEvent[]);
      }
    } catch (err) {
      console.error("Timeline query error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  // Group events based on selected ZoomLevel
  const getGroupKey = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();

    if (zoom === "century") {
      const cent = Math.floor(year / 100) + 1;
      return `${cent}th Century (${Math.floor(year / 100) * 100} - ${Math.floor(year / 100) * 100 + 99})`;
    }
    if (zoom === "decade") {
      const dec = Math.floor(year / 10) * 10;
      return `${dec}s (${dec} - ${dec + 9})`;
    }
    // Default: Year view
    return `${year}`;
  };

  // Grouped entries map
  const groupedEvents: Record<string, DBTimelineEvent[]> = {};
  events.forEach((ev) => {
    const key = getGroupKey(ev.event_date);
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    groupedEvents[key].push(ev);
  });

  const sortedGroups = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 select-none">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-mono-sm text-text-tertiary font-mono uppercase">
          <Link href="/" className="hover:text-accent-signal">Dashboard</Link>
          <span>/</span>
          <span>Timeline Log</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
              Chronological Intelligence Records
            </span>
            <h1 className="text-display-lg font-display text-text-primary tracking-tight">
              Visual Chronology
            </h1>
            <p className="text-body-md text-text-secondary">
              Inspect critical security shift logs, policy announcements, and key academic timelines.
            </p>
          </div>

          {/* Zoom Toggles */}
          <div className="flex items-center gap-1.5 border border-border-subtle bg-bg-surface p-1 rounded">
            {(["century", "decade", "year"] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  setZoom(level);
                  setExpandedEventId(null);
                }}
                className={`px-3 py-1 text-mono-sm font-mono uppercase rounded transition-colors cursor-pointer ${
                  zoom === level
                    ? "bg-accent-signal text-text-primary font-bold shadow"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
              <span className="text-mono-sm font-mono uppercase tracking-wider">Aligning Chronologies...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle p-12 text-center text-body-md text-text-secondary">
            No events indexed on active timeline.
          </div>
        ) : (
          /* Timeline group list */
          <div className="flex flex-col gap-8">
            {sortedGroups.map((groupKey) => (
              <div key={groupKey} className="flex flex-col gap-4">
                
                {/* Timeline Group Header */}
                <div className="flex items-center gap-4">
                  <h2 className="text-heading-sm font-display font-bold text-accent-signal tracking-wide uppercase shrink-0">
                    {groupKey}
                  </h2>
                  <div className="w-full border-t border-border-subtle/50" />
                </div>

                {/* Events list within group */}
                <div className="flex flex-col gap-4 pl-4 border-l border-border-subtle/70 ml-2.5">
                  {groupedEvents[groupKey].map((event) => {
                    const isExpanded = expandedEventId === event.id;
                    return (
                      <div
                        key={event.id}
                        className="group relative rounded-lg border border-border-subtle bg-bg-surface p-4 hover:border-accent-signal-muted transition-colors flex flex-col gap-2"
                      >
                        {/* Dot timeline connector */}
                        <div className="absolute -left-[22px] top-6 h-2 w-2 rounded-full bg-border-subtle group-hover:bg-accent-signal transition-colors" />

                        {/* Title Row */}
                        <div
                          onClick={() => toggleExpand(event.id)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                            <span className="text-mono-sm text-text-tertiary font-mono flex items-center gap-1 shrink-0">
                              <Calendar className="h-3.5 w-3.5" />
                              {event.event_date}
                            </span>
                            <span className="text-body-sm text-text-tertiary font-mono uppercase bg-bg-surface-raised px-1.5 py-0.5 rounded border border-border-subtle max-w-fit scale-90">
                              #{event.topic_slug}
                            </span>
                            <h3 className="text-body-md font-semibold text-text-primary group-hover:text-accent-signal transition-colors tracking-tight leading-snug">
                              {event.title}
                            </h3>
                          </div>

                          <button className="text-text-secondary hover:text-text-primary">
                            {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-2 pt-3 border-t border-border-subtle/40 flex flex-col gap-3 animate-[fadeIn_100ms_ease-out]">
                            <p className="text-body-sm text-text-secondary leading-relaxed">
                              {event.description}
                            </p>
                            
                            {/* Link to origin article */}
                            {event.article && (
                              <div className="flex items-center justify-between rounded bg-bg-canvas border border-border-subtle/40 px-3 py-2 text-body-sm text-text-secondary">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] text-text-tertiary font-mono uppercase">Origin Analytical File</span>
                                  <span className="font-semibold text-text-primary truncate">{event.article.title}</span>
                                </div>
                                <Link
                                  href={`/article/${event.article.slug}`}
                                  className="rounded bg-accent-signal text-text-primary py-1 px-2.5 text-mono-sm font-mono uppercase hover:opacity-90 flex items-center gap-1 shrink-0"
                                >
                                  <span>Open File</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </GlobalShell>
  );
}
