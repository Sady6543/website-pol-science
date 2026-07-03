"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlobalShell } from "@/components/global-shell";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { supabase } from "@/lib/supabase";
import { Quote, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from "lucide-react";

interface BriefPageProps {
  params: Promise<{ time: string }>;
}

interface BriefHeadline {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  importance: 1 | 2 | 3;
  source: string;
}

interface BriefSectionItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  importance: 1 | 2 | 3;
  source: string;
}

interface BriefSection {
  title: string;
  items: BriefSectionItem[];
}

export default function BriefPage({ params }: BriefPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const rawTime = resolvedParams.time;

  // Validate time or default to morning
  const time = (["morning", "afternoon", "evening"].includes(rawTime)
    ? rawTime
    : "morning") as "morning" | "afternoon" | "evening";

  const [headlines, setHeadlines] = useState<BriefHeadline[]>([]);
  const [sections, setSections] = useState<BriefSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  useEffect(() => {
    const fetchBriefData = async () => {
      try {
        setLoading(true);
        const { data: arts, error } = await supabase
          .from("articles")
          .select(`
            id, slug, title, summary, importance, source_name,
            category:categories(slug, name, icon)
          `);

        if (error) throw error;

        if (arts) {
          const typedArts = arts as unknown as {
            id: string;
            slug: string;
            title: string;
            summary: string | null;
            importance: number;
            source_name: string | null;
            category: {
              slug: string;
              name: string;
              icon: string;
            } | null;
          }[];

          // Dynamic compilation based on time-of-day
          let selectedHeadlines: BriefHeadline[] = [];
          let selectedSections: BriefSection[] = [];

          if (time === "morning") {
            // High importance articles
            selectedHeadlines = typedArts
              .filter((a) => a.importance === 3)
              .map((a) => ({
                id: a.id,
                slug: a.slug,
                title: a.title,
                summary: a.summary || "",
                category: a.category?.name || "General",
                importance: a.importance as 1 | 2 | 3,
                source: a.source_name || "Direct",
              }));

            // Rest grouped
            const techArts = typedArts.filter((a) => a.category?.slug === "technology" || a.category?.slug === "ai");
            const generalArts = typedArts.filter((a) => a.importance < 3 && a.category?.slug !== "technology" && a.category?.slug !== "ai");

            selectedSections = [
              {
                title: "Technology & Artificial Intelligence",
                items: techArts.map((a) => ({
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  summary: a.summary || "",
                  category: a.category?.name || "General",
                  importance: a.importance as 1 | 2 | 3,
                  source: a.source_name || "Direct",
                })),
              },
              {
                title: "Global Politics & Environment",
                items: generalArts.map((a) => ({
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  summary: a.summary || "",
                  category: a.category?.name || "General",
                  importance: a.importance as 1 | 2 | 3,
                  source: a.source_name || "Direct",
                })),
              },
            ];
          } else if (time === "afternoon") {
            // Medium importance articles
            selectedHeadlines = typedArts
              .filter((a) => a.importance === 2)
              .map((a) => ({
                id: a.id,
                slug: a.slug,
                title: a.title,
                summary: a.summary || "",
                category: a.category?.name || "General",
                importance: a.importance as 1 | 2 | 3,
                source: a.source_name || "Direct",
              }));

            const scienceArts = typedArts.filter((a) => a.category?.slug === "science" || a.category?.slug === "learning");
            selectedSections = [
              {
                title: "Scientific Research & Theory",
                items: scienceArts.map((a) => ({
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  summary: a.summary || "",
                  category: a.category?.name || "General",
                  importance: a.importance as 1 | 2 | 3,
                  source: a.source_name || "Direct",
                })),
              },
            ];
          } else {
            // Evening review: general / low importance
            selectedHeadlines = typedArts
              .filter((a) => a.importance === 1 || a.category?.slug === "learning")
              .map((a) => ({
                id: a.id,
                slug: a.slug,
                title: a.title,
                summary: a.summary || "",
                category: a.category?.name || "General",
                importance: a.importance as 1 | 2 | 3,
                source: a.source_name || "Direct",
              }));

            const otherArts = typedArts.filter((a) => a.importance === 2 && a.category?.slug !== "learning");
            selectedSections = [
              {
                title: "Strategic Summaries & Retrospectives",
                items: otherArts.map((a) => ({
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  summary: a.summary || "",
                  category: a.category?.name || "General",
                  importance: a.importance as 1 | 2 | 3,
                  source: a.source_name || "Direct",
                })),
              },
            ];
          }

          setHeadlines(selectedHeadlines.slice(0, 5));
          setSections(selectedSections.filter((s) => s.items.length > 0));
        }

      } catch (err) {
        console.error("Failed compiling dynamic daily brief:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefData();
  }, [time]);

  // Static facts, quotes, vocab maps based on time-of-day
  const staticBriefMetadata = {
    morning: {
      facts: [
        "Semiconductor capital investments globally are projected to top $150 billion in 2026.",
        "The r-star neutral rate estimate has risen by 75 basis points over the last 24 months.",
        "Fusion energy ignition experiments at NIF now regularly yield more than 5 MJ of thermal energy.",
      ],
      quote: {
        text: "Strategic autonomy is not isolation; it is the freedom to choose your partners based on shared interests rather than historical obligations.",
        author: "Dr. S. Jaishankar",
        context: "Address at the Raisina Dialogue",
      },
      word: {
        word: "Thucydides' Trap",
        pronunciation: "/θuːˈsɪdɪdiːz træp/",
        definition: "The tendency toward conflict when an emerging power threatens to displace an existing hegemon.",
        usage: "Political scientists reference Thucydides' Trap when analyzing the strategic competition between the US and China.",
      },
    },
    afternoon: {
      facts: [
        "India's UPI system now processes over 12 billion transactions monthly.",
        "The James Webb space telescope operates in an orbit around the second Lagrange point (L2).",
        "Over 90% of advanced semiconductor logic production remains concentrated in Hsinchu Science Park, Taiwan.",
      ],
      quote: {
        text: "The supreme art of war is to subdue the enemy without fighting.",
        author: "Sun Tzu",
        context: "The Art of War",
      },
      word: {
        word: "Strategic Autonomy",
        pronunciation: "/strəˈtiːdʒɪk ɔːˈtɒnəmi/",
        definition: "The ability of a state to pursue its national interests without relying heavily on other nations.",
        usage: "India's foreign policy relies heavily on strategic autonomy to balance relations between Russia and the West.",
      },
    },
    evening: {
      facts: [
        "India will host the UN Climate Change Conference (COP) for the second time in late 2026.",
        "Differential privacy adds mathematical noise to datasets to protect individual records while maintaining aggregate value.",
        "The crude oil benchmark Brent Crude is extracted from the North Sea between Scotland and Norway.",
      ],
      quote: {
        text: "The state is a relation of men dominating men, a relation supported by means of legitimate violence.",
        author: "Max Weber",
        context: "Politics as a Vocation",
      },
      word: {
        word: "Hegemony",
        pronunciation: "/hɪˈdʒɛməni/",
        definition: "The political, economic, or military predominance or control of one state over others.",
        usage: "Political realists analyze the shifts in global hegemony as the United States navigates relations in Asia.",
      },
    },
  };

  const meta = staticBriefMetadata[time];

  const tabs = [
    { id: "morning", label: "Morning Brief", desc: "08:00 AM · Global Summary" },
    { id: "afternoon", label: "Afternoon Update", desc: "01:30 PM · Markets & Spits" },
    { id: "evening", label: "Evening Review", desc: "07:30 PM · Retrospective" },
  ];

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6">
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
          <span className="text-mono-sm text-text-tertiary font-mono uppercase">Daily Briefing</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
            Calm Information Stream
          </span>
          <h1 className="text-display-lg font-display text-text-primary tracking-tight">
            The Daily Briefing
          </h1>
          <p className="text-body-md text-text-secondary">
            Structured, curated digests compiling politics, tech, and markets. Read once, understand clearly.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-border-subtle bg-bg-surface rounded-md p-1.5 gap-2 select-none">
          {tabs.map((tab) => {
            const isSelected = tab.id === time;
            return (
              <button
                key={tab.id}
                onClick={() => router.push(`/brief/${tab.id}`)}
                className={`flex flex-col items-center md:items-start p-3 rounded transition-colors text-center md:text-left cursor-pointer ${
                  isSelected
                    ? "bg-bg-surface-raised border border-border-subtle shadow-elevation text-accent-signal"
                    : "hover:bg-bg-surface-raised/40 text-text-secondary"
                }`}
              >
                <span className="text-body-sm font-semibold tracking-tight uppercase">
                  {tab.label}
                </span>
                <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-wide mt-0.5">
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
              <span className="text-mono-sm font-mono uppercase tracking-wider">Compiling Digest...</span>
            </div>
          </div>
        ) : (
          /* Brief Contents */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            
            {/* Headlines & Collapsible Categorized Sections (Left 2 columns) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Headlines Section */}
              <section className="flex flex-col gap-4">
                <h2 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle pb-2">
                  Top Signals
                </h2>
                <div className="flex flex-col gap-4">
                  {headlines.length === 0 ? (
                    <div className="text-body-sm text-text-secondary rounded border border-dashed border-border-subtle p-6 text-center">
                      No matching signals for this brief period.
                    </div>
                  ) : (
                    headlines.map((headline) => (
                      <div
                        key={headline.id}
                        className="group relative rounded-lg border border-border-subtle bg-bg-surface/50 p-4 transition-colors hover:border-accent-signal-muted"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-mono-sm text-text-secondary font-mono uppercase">
                            {headline.source} · {headline.category}
                          </span>
                          <ImportanceDot level={headline.importance} />
                        </div>
                        <h3 className="text-body-md font-semibold text-text-primary group-hover:text-accent-signal transition-colors mb-1">
                          <Link href={`/article/${headline.slug}`}>
                            {headline.title}
                          </Link>
                        </h3>
                        <p className="text-body-sm text-text-secondary">
                          {headline.summary}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Categorized Collapsible Sections */}
              <section className="flex flex-col gap-4">
                <h2 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider border-b border-border-subtle pb-2">
                  Categorized In-Depth
                </h2>
                <div className="flex flex-col gap-4">
                  {sections.length === 0 ? (
                    <div className="text-body-sm text-text-secondary rounded border border-dashed border-border-subtle p-6 text-center">
                      No categorized data files parsed for this update block.
                    </div>
                  ) : (
                    sections.map((sec) => {
                      const isCollapsed = collapsedSections[sec.title] || false;
                      return (
                        <div
                          key={sec.title}
                          className="rounded-lg border border-border-subtle bg-bg-surface"
                        >
                          <button
                            onClick={() => toggleSection(sec.title)}
                            className="w-full flex items-center justify-between p-4 cursor-pointer text-left select-none"
                          >
                            <h3 className="text-body-md font-semibold text-text-primary">
                              {sec.title}
                            </h3>
                            <div className="flex items-center gap-2 text-text-secondary">
                              <span className="text-mono-sm font-mono text-text-tertiary">
                                {sec.items.length} items
                              </span>
                              {isCollapsed ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                            </div>
                          </button>
                          
                          {!isCollapsed && (
                            <div className="border-t border-border-subtle/50 p-4 flex flex-col gap-4">
                              {sec.items.map((item) => (
                                <div key={item.id} className="group relative pl-3 border-l-2 border-border-subtle hover:border-accent-signal transition-colors">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-mono-sm text-text-secondary font-mono uppercase">
                                      {item.source}
                                    </span>
                                    <ImportanceDot level={item.importance} />
                                  </div>
                                  <h4 className="text-body-sm font-semibold text-text-primary group-hover:text-accent-signal transition-colors">
                                    <Link href={`/article/${item.slug}`}>
                                      {item.title}
                                    </Link>
                                  </h4>
                                  <p className="text-body-sm text-text-secondary mt-1">
                                    {item.summary}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            {/* Quick Facts, Quote, and Word of the Day (Right Column) */}
            <div className="flex flex-col gap-6">
              
              {/* Quick Facts strip */}
              <section className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-3">
                <h3 className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider">
                  Quick Facts Strip
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {meta.facts.map((fact, i) => (
                    <li
                      key={i}
                      className="text-body-sm text-text-secondary flex gap-2 items-start"
                    >
                      <span className="text-mono-sm text-accent-signal font-mono">0{i + 1}.</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Quote of the Day */}
              <section className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface p-5">
                <div className="absolute top-3 right-3 text-border-subtle select-none">
                  <Quote className="h-10 w-10 shrink-0 transform scale-x-[-1]" />
                </div>
                <span className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider block mb-3">
                  Quote of the Day
                </span>
                <p className="text-body-md text-text-primary font-medium italic leading-relaxed mb-4">
                  &ldquo;{meta.quote.text}&rdquo;
                </p>
                <div className="flex flex-col">
                  <span className="text-body-sm font-semibold text-text-primary">
                    {meta.quote.author}
                  </span>
                  <span className="text-mono-sm text-text-tertiary font-mono">
                    {meta.quote.context}
                  </span>
                </div>
              </section>

              {/* Word of the Day */}
              <section className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col gap-2">
                <span className="text-mono-sm text-text-tertiary font-mono uppercase tracking-wider">
                  Vocabulary Expansion
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-heading-sm font-display font-semibold text-accent-signal">
                    {meta.word.word}
                  </h3>
                  <span className="text-mono-sm text-text-tertiary font-mono">
                    {meta.word.pronunciation}
                  </span>
                </div>
                <p className="text-body-sm text-text-primary leading-relaxed mt-1">
                  <span className="font-semibold text-text-secondary block mb-0.5">Definition:</span>
                  {meta.word.definition}
                </p>
                <div className="mt-2.5 pt-2 border-t border-border-subtle/50 text-[11px] text-text-secondary leading-relaxed">
                  <span className="text-mono-sm text-text-tertiary font-mono block mb-1">Headline Usage:</span>
                  &ldquo;{meta.word.usage}&rdquo;
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </GlobalShell>
  );
}
