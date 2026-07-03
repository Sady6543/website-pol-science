"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GlobalShell } from "@/components/global-shell";
import { ImportanceDot } from "@/components/ui/importance-dot";
import { supabase } from "@/lib/supabase";
import { Landmark, ShieldAlert, ArrowRight, Loader2, Info } from "lucide-react";

interface CountryData {
  id: string;
  name: string;
  capital: string;
  alliances: string;
  status: string;
  conflictIndex: "Low" | "Medium" | "High" | "Critical";
  color: string;
  // Mock grid positioning coordinates for SVG layout
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DBArticleLink {
  id: string;
  title: string;
  slug: string;
  summary: string;
  importance: 1 | 2 | 3;
}

export default function MapPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [articles, setArticles] = useState<DBArticleLink[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Seeded Geopolitical Nodes Catalog
  const countries: CountryData[] = [
    { id: "US", name: "United States", capital: "Washington D.C.", alliances: "NATO, Quad, AUKUS", status: "Global hegemon navigating security dilemmas and semiconductor trade competition with China.", conflictIndex: "Medium", color: "#3D6BFF", x: 60, y: 110, width: 140, height: 80 },
    { id: "BR", name: "Brazil", capital: "Brasília", alliances: "BRICS, G20, Mercosur", status: "South American leader anchoring Global South developmental dialogues and resource trades.", conflictIndex: "Low", color: "#10B981", x: 140, y: 220, width: 80, height: 100 },
    { id: "UK", name: "United Kingdom", capital: "London", alliances: "NATO, AUKUS, G7", status: "Strategic island power coordinating security transfers in European and Indo-Pacific grids.", conflictIndex: "Low", color: "#6366F1", x: 260, y: 70, width: 40, height: 35 },
    { id: "DE", name: "Germany", capital: "Berlin", alliances: "NATO, European Union", status: "European economic anchor adapting to energy supply chains shifts and eastern defenses.", conflictIndex: "Low", color: "#3B82F6", x: 310, y: 80, width: 50, height: 50 },
    { id: "ZA", name: "South Africa", capital: "Pretoria", alliances: "BRICS, African Union", status: "Pivotal regional gatekeeper driving trade corridors and G20 multilateral coordination.", conflictIndex: "Low", color: "#84CC16", x: 340, y: 240, width: 60, height: 70 },
    { id: "RU", name: "Russia", capital: "Moscow", alliances: "BRICS, SCO", status: "Eurasian power locked in military conflict in Europe and pivoting export frameworks to Asia.", conflictIndex: "Critical", color: "#EF4444", x: 400, y: 60, width: 190, height: 65 },
    { id: "IN", name: "India", capital: "New Delhi", alliances: "Quad, BRICS, SCO", status: "Key multi-aligned power balancing ties between Western hubs and continental security blocks.", conflictIndex: "Medium", color: "#F59E0B", x: 440, y: 150, width: 90, height: 75 },
    { id: "CN", name: "China", capital: "Beijing", alliances: "BRICS, SCO", status: "Challenger superpower expanding semiconductor logic manufacturing and maritime zone assertions.", conflictIndex: "High", color: "#EC4899", x: 520, y: 100, width: 130, height: 80 },
    { id: "JP", name: "Japan", capital: "Tokyo", alliances: "Quad, G7", status: "Allied East Asian island chain expanding local chip foundry clusters and defense budgets.", conflictIndex: "Medium", color: "#14B8A6", x: 670, y: 110, width: 45, height: 60 }
  ];

  // Fetch articles mapping to selected country name
  useEffect(() => {
    if (!selectedCountry) {
      setTimeout(() => setArticles([]), 0);
      return;
    }

    const fetchCountryArticles = async () => {
      try {
        setTimeout(() => setLoadingArticles(true), 0);
        
        // Fetch article_entities joining with articles table
        const { data, error } = await supabase
          .from("article_entities")
          .select(`
            article:articles(
              id, title, slug, summary, importance
            )
          `)
          .eq("entity_name", selectedCountry.name);

        if (error) throw error;

        if (data) {
          const parsed = (data as unknown as { article: DBArticleLink | null }[])
            .map((item) => item.article)
            .filter((x): x is DBArticleLink => !!x);
          setTimeout(() => setArticles(parsed), 0);
        } else {
          setTimeout(() => setArticles([]), 0);
        }
      } catch (err) {
        console.error("Geopolitical map articles fetch failure:", err);
      } finally {
        setTimeout(() => setLoadingArticles(false), 0);
      }
    };

    fetchCountryArticles();
  }, [selectedCountry]);

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 select-none">
        
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-border-subtle pb-5">
          <span className="text-mono-sm text-accent-signal uppercase font-mono tracking-wider">
            Geopolitical Command Center
          </span>
          <h1 className="text-display-lg font-display text-text-primary tracking-tight">
            Interactive Geopolitical Map
          </h1>
          <p className="text-body-md text-text-secondary">
            Identify hot spots, strategic partnerships, and browse region-linked research files.
          </p>
        </div>

        {/* Map Panel & Drilldown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* 1. SVG Map Container (Left 3 columns) */}
          <div className="lg:col-span-3 rounded-xl border border-border-subtle bg-bg-surface p-4 relative overflow-hidden flex flex-col items-center">
            
            {/* Legend Tickers — wraps on mobile */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono uppercase text-text-tertiary mb-2" role="legend" aria-label="Conflict risk legend">
              {[
                { label: "Critical", color: "#EF4444" },
                { label: "High Risk", color: "#EC4899" },
                { label: "Medium", color: "#F59E0B" },
                { label: "Stable", color: "#3D6BFF" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: l.color }} aria-hidden="true" />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>

            {/* World SVG Canvas — uses viewBox for full responsiveness */}
            <svg
              viewBox="0 0 800 400"
              className="w-full h-auto border border-border-subtle/50 bg-[#0C0F17] rounded-lg"
              role="img"
              aria-label="Interactive geopolitical world map"
            >
              {/* Abstract map grid dots */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="#1E293B" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Render Country SVG boundary capsules */}
              {countries.map((country) => {
                const isSelected = selectedCountry?.id === country.id;
                return (
                  <g
                    key={country.id}
                    className="group cursor-pointer"
                    role="button"
                    aria-label={`Select ${country.name} — ${country.conflictIndex} risk`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedCountry(country); } }}
                    onClick={() => setSelectedCountry(country)}
                  >
                    <rect
                      x={country.x}
                      y={country.y}
                      width={country.width}
                      height={country.height}
                      rx="8"
                      fill={country.color}
                      fillOpacity={isSelected ? "0.25" : "0.08"}
                      stroke={country.color}
                      strokeWidth={isSelected ? "2.5" : "1"}
                      strokeOpacity={isSelected ? "1" : "0.4"}
                      className="transition-all duration-150 group-hover:fill-opacity-20 group-hover:stroke-opacity-80"
                    />
                    <text
                      x={country.x + country.width / 2}
                      y={country.y + country.height / 2 + 3}
                      fill="#E2E8F0"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight={isSelected ? "bold" : "normal"}
                      className="pointer-events-none uppercase tracking-wide opacity-80 group-hover:opacity-100"
                      aria-hidden="true"
                    >
                      {country.id}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex items-center gap-2 mt-4 text-mono-sm text-text-tertiary font-mono uppercase text-center justify-center">
              <Info className="h-4.5 w-4.5 text-accent-signal" />
              <span>Select a region capsule to inspect local security status & articles</span>
            </div>
          </div>

          {/* 2. Geopolitical Drilldown Panel (Right column) */}
          <aside className="rounded-xl border border-border-subtle bg-bg-surface p-5 flex flex-col gap-5 min-h-[350px]">
            
            {/* Empty check */}
            {!selectedCountry ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-tertiary gap-3">
                <Landmark className="h-10 w-10 shrink-0" />
                <span className="text-body-sm font-semibold uppercase tracking-wider font-mono">No Region Inspected</span>
                <p className="text-[11px] leading-relaxed">Select a geopolitical capsule node on the map to query regional intelligence data.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-[fadeIn_120ms_ease-out]">
                
                {/* Country title details */}
                <div className="border-b border-border-subtle pb-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-heading-sm font-display font-bold text-text-primary uppercase tracking-wider">
                      {selectedCountry.name}
                    </h2>
                    <span className="rounded bg-bg-surface-raised border border-border-subtle px-2 py-0.5 text-mono-sm font-mono text-text-secondary">
                      {selectedCountry.id}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-tertiary font-mono uppercase">Capital: {selectedCountry.capital}</span>
                </div>

                {/* Conflict indicator status */}
                <div className="flex items-center justify-between rounded bg-bg-canvas/50 border border-border-subtle/40 p-2.5">
                  <span className="text-mono-sm text-text-secondary uppercase flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-accent-signal" />
                    Conflict Risk Index:
                  </span>
                  <span className={`text-mono-sm font-mono font-bold uppercase ${
                    selectedCountry.conflictIndex === "Critical" ? "text-data-negative animate-pulse" :
                    selectedCountry.conflictIndex === "High" ? "text-[#EC4899]" :
                    selectedCountry.conflictIndex === "Medium" ? "text-[#F59E0B]" :
                    "text-data-positive"
                  }`}>
                    {selectedCountry.conflictIndex}
                  </span>
                </div>

                {/* Geopolitical summary description */}
                <div className="flex flex-col gap-1">
                  <span className="text-mono-sm text-text-tertiary font-mono uppercase">Strategic Summary:</span>
                  <p className="text-body-sm text-text-secondary leading-relaxed">
                    {selectedCountry.status}
                  </p>
                </div>

                {/* Alliances */}
                <div className="flex flex-col gap-1">
                  <span className="text-mono-sm text-text-tertiary font-mono uppercase">Security Alliances:</span>
                  <span className="text-mono-sm font-bold text-accent-signal uppercase tracking-wider font-mono">
                    {selectedCountry.alliances}
                  </span>
                </div>

                {/* Linked database articles list */}
                <div className="border-t border-border-subtle pt-4 flex flex-col gap-3">
                  <span className="text-mono-sm text-text-tertiary font-mono uppercase">Linked Files:</span>
                  
                  {loadingArticles ? (
                    <div className="flex justify-center items-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-accent-signal" />
                    </div>
                  ) : articles.length === 0 ? (
                    <span className="text-[11px] text-text-tertiary font-mono italic">No mapped updates indexed in active cycle.</span>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                      {articles.map((art) => (
                        <Link
                          key={art.id}
                          href={`/article/${art.slug}`}
                          className="group flex flex-col gap-1 p-2 rounded bg-bg-canvas border border-border-subtle/50 hover:border-accent-signal-muted transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ImportanceDot level={art.importance} showLabel={false} />
                            <span className="text-body-sm font-semibold text-text-primary group-hover:text-accent-signal transition-colors line-clamp-1">
                              {art.title}
                            </span>
                          </div>
                          <span className="text-[9px] text-text-tertiary font-mono flex items-center gap-1 self-end">
                            Inspect File <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </aside>

        </div>
      </div>
    </GlobalShell>
  );
}
