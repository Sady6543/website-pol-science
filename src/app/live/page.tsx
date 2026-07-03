"use client";

import React, { useState, useEffect } from "react";
import { GlobalShell } from "@/components/global-shell";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Globe,
  Compass,
  CloudSun,
  Activity,
  Flame,
  Loader2
} from "lucide-react";

interface CacheQuakeItem {
  location: string;
  magnitude: number;
  depth: string;
  time: string;
}

interface CacheLaunchItem {
  mission: string;
  provider: string;
  rocket: string;
  pad: string;
  window_start: string;
}

interface CacheRow {
  key: string;
  payload: {
    ticker?: string;
    symbol?: string;
    pair?: string;
    price?: number;
    rate?: number;
    change?: string;
    changeType?: string;
    high?: number;
    low?: number;
    city?: string;
    temp?: number;
    condition?: string;
    list?: CacheQuakeItem[] | CacheLaunchItem[];
  };
  updated_at: string;
}

export default function LivePage() {
  const [data, setData] = useState<Record<string, CacheRow>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeDiffs, setTimeDiffs] = useState<Record<string, string>>({});
  
  // Live World Clocks state
  const [clocks, setClocks] = useState({
    delhi: "",
    london: "",
    newyork: "",
    tokyo: ""
  });

  const fetchLiveData = async () => {
    try {
      const { data: rows } = await supabase.from("live_data_cache").select("*");
      if (rows) {
        const mapped = rows.reduce((acc, row) => {
          acc[row.key] = row;
          return acc;
        }, {} as Record<string, CacheRow>);
        setData(mapped);
      }
    } catch (err) {
      console.error("Failed loading cached live terminal parameters:", err);
    }
  };

  const triggerIngest = async () => {
    try {
      setRefreshing(true);
      await fetch("/api/ingest?type=all");
      await fetchLiveData();
    } catch (err) {
      console.error("Ingestion triggers failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLiveData();
      setLoading(false);
    };
    init();

    // Setup periodic reload every 10 seconds
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update clocks every second
  useEffect(() => {
    const updateClocks = () => {
      const optionsDelhi = { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" } as const;
      const optionsLondon = { timeZone: "Europe/London", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" } as const;
      const optionsNewYork = { timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" } as const;
      const optionsTokyo = { timeZone: "Asia/Tokyo", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" } as const;

      const now = new Date();
      setClocks({
        delhi: now.toLocaleTimeString("en-US", optionsDelhi),
        london: now.toLocaleTimeString("en-US", optionsLondon),
        newyork: now.toLocaleTimeString("en-US", optionsNewYork),
        tokyo: now.toLocaleTimeString("en-US", optionsTokyo)
      });
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate "updated X seconds/minutes ago" labels
  useEffect(() => {
    const updateTimers = () => {
      const diffs: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        const updatedAt = data[key]?.updated_at;
        if (!updatedAt) return;
        const diffMs = Date.now() - new Date(updatedAt).getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        
        if (diffSecs < 10) {
          diffs[key] = "just now";
        } else if (diffSecs < 60) {
          diffs[key] = `${diffSecs}s ago`;
        } else {
          const mins = Math.floor(diffSecs / 60);
          diffs[key] = `${mins}m ago`;
        }
      });
      setTimeDiffs(diffs);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [data]);

  const renderPriceCell = (price?: number, change?: string, changeType?: string) => {
    const activePrice = price || 0;
    const activeChange = change || "0.00%";
    const isPos = changeType === "positive" || activeChange.startsWith("+");
    return (
      <div className="flex items-baseline justify-between mt-1">
        <span className="text-body-lg font-mono font-bold tracking-tight">
          {activePrice.toFixed(2)}
        </span>
        <span className={`text-mono-sm font-mono flex items-center gap-0.5 ${isPos ? "text-data-positive" : "text-data-negative"}`}>
          {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {activeChange}
        </span>
      </div>
    );
  };

  return (
    <GlobalShell>
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 font-mono">
        
        {/* Bloomberg Top Bar */}
        <div className="border border-border-subtle bg-bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md">
          <div className="flex items-baseline gap-3">
            <span className="text-display-sm font-display font-bold text-text-primary tracking-tight">
              LIVE<span className="text-accent-signal">TERMINAL</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-data-positive animate-pulse shrink-0" />
            <span className="text-mono-sm text-text-tertiary">10.0s auto-refresh</span>
          </div>

          {/* Action Trigger */}
          <button
            onClick={triggerIngest}
            disabled={refreshing}
            className="rounded border border-border-subtle hover:border-accent-signal bg-bg-canvas hover:text-accent-signal py-1.5 px-3 text-mono-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? "animate-spin text-accent-signal" : ""}`} />
            <span>{refreshing ? "INGESTING..." : "FORCE INGEST DATA"}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24 border border-dashed border-border-subtle rounded-md bg-bg-surface/30">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
              <span className="text-mono-sm uppercase tracking-wider">Syncing Global Feeds...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* World Clocks Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-border-subtle pb-6">
              {[
                { name: "New Delhi", time: clocks.delhi, label: "IST (UTC+5:30)" },
                { name: "London", time: clocks.london, label: "BST (UTC+1:00)" },
                { name: "New York", time: clocks.newyork, label: "EDT (UTC-4:00)" },
                { name: "Tokyo", time: clocks.tokyo, label: "JST (UTC+9:00)" }
              ].map((c) => (
                <div key={c.name} className="rounded border border-border-subtle bg-bg-surface p-3 flex flex-col gap-1 items-center md:items-start">
                  <span className="text-mono-sm text-text-secondary uppercase">{c.name}</span>
                  <span className="text-heading-md font-bold tracking-wider text-accent-signal">{c.time || "00:00:00"}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">{c.label}</span>
                </div>
              ))}
            </div>

            {/* Grid metrics widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Stock Indices */}
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-3">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Stocks & Indices</span>
                  </h3>
                  <span className="text-[10px] text-text-tertiary">{timeDiffs["stocks:SPX"] || "No cache"}</span>
                </div>
                
                <div className="flex flex-col gap-4">
                  {["stocks:SPX", "stocks:COMP", "stocks:AAPL", "stocks:TSLA"].map((k) => {
                    const row = data[k];
                    if (!row) return null;
                    return (
                      <div key={k} className="flex flex-col border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-mono-sm text-text-secondary font-semibold uppercase">{row.payload.ticker}</span>
                        {renderPriceCell(row.payload.price, row.payload.change, row.payload.changeType)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Crypto Core */}
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-3">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                    <Compass className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Crypto Portfolio</span>
                  </h3>
                  <span className="text-[10px] text-text-tertiary">{timeDiffs["crypto:BTC"] || "No cache"}</span>
                </div>

                <div className="flex flex-col gap-4">
                  {["crypto:BTC", "crypto:ETH", "crypto:SOL"].map((k) => {
                    const row = data[k];
                    if (!row) return null;
                    return (
                      <div key={k} className="flex flex-col border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-mono-sm text-text-secondary font-semibold uppercase">{row.payload.symbol}</span>
                        {renderPriceCell(row.payload.price, row.payload.change, row.payload.changeType)}
                        <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                          <span>H: {row.payload.high}</span>
                          <span>L: {row.payload.low}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Forex Board & Weather */}
              <div className="flex flex-col gap-6">
                
                {/* Forex board */}
                <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex-1">
                  <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-3">
                    <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                      <TrendingUp className="h-4.5 w-4.5 text-accent-signal" />
                      <span>Currency FX</span>
                    </h3>
                    <span className="text-[10px] text-text-tertiary">{timeDiffs["fx:USD_INR"] || "No cache"}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {["fx:USD_INR", "fx:EUR_USD", "fx:GBP_USD"].map((k) => {
                      const row = data[k];
                      if (!row) return null;
                      return (
                        <div key={k} className="flex items-center justify-between py-1 bg-bg-canvas/50 px-2 rounded border border-border-subtle/30">
                          <span className="text-mono-sm font-bold text-text-secondary">{row.payload.pair}</span>
                          <span className="text-body-sm font-semibold text-text-primary">{(row.payload.rate || 0).toFixed(4)}</span>
                          <span className={`text-[10px] ${row.payload.changeType === "positive" ? "text-data-positive" : "text-data-negative"}`}>{row.payload.change || "0.00%"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* City Weather summary */}
                <div className="rounded-lg border border-border-subtle bg-bg-surface p-4 flex-1">
                  <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-3">
                    <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                      <CloudSun className="h-4.5 w-4.5 text-accent-signal" />
                      <span>Climates</span>
                    </h3>
                    <span className="text-[10px] text-text-tertiary">{timeDiffs["weather:NewDelhi"] || "No cache"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {["weather:NewDelhi", "weather:London", "weather:NewYork"].map((k) => {
                      const row = data[k];
                      if (!row) return null;
                      return (
                        <div key={k} className="flex flex-col items-center p-2 rounded bg-bg-canvas/40 border border-border-subtle/30 text-center">
                          <span className="text-[10px] text-text-secondary truncate w-full">{row.payload.city}</span>
                          <span className="text-heading-sm font-bold text-text-primary mt-1">{row.payload.temp}°C</span>
                          <span className="text-[9px] text-text-tertiary truncate w-full mt-0.5">{row.payload.condition}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Earthquakes and Launches splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              
              {/* USGS Earthquake feed */}
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-3">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Seismic Activity (USGS)</span>
                  </h3>
                  <span className="text-[10px] text-text-tertiary">{timeDiffs["earthquakes"] || "No cache"}</span>
                </div>

                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                  {(data["earthquakes"]?.payload?.list as unknown as CacheQuakeItem[])?.map((quake, i: number) => {
                    const isHigh = quake.magnitude >= 5.0;
                    return (
                      <div key={i} className="flex items-start justify-between p-2 rounded bg-bg-canvas border border-border-subtle/30">
                        <div className="flex flex-col min-w-0">
                          <span className="text-body-sm font-semibold text-text-primary truncate">{quake.location}</span>
                          <span className="text-[9px] text-text-tertiary">Depth: {quake.depth} · {new Date(quake.time).toLocaleTimeString()}</span>
                        </div>
                        <span className={`text-mono-sm font-bold px-2 py-0.5 rounded ${isHigh ? "bg-data-negative text-text-primary" : "bg-bg-surface-raised text-accent-signal border border-border-subtle"}`}>
                          M {quake.magnitude.toFixed(1)}
                        </span>
                      </div>
                    );
                  }) || <span className="text-mono-sm text-text-tertiary italic">No active cache</span>}
                </div>
              </div>

              {/* Launches manifest */}
              <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2 mb-3">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                    <Flame className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Space Launch Manifest</span>
                  </h3>
                  <span className="text-[10px] text-text-tertiary">{timeDiffs["launches"] || "No cache"}</span>
                </div>

                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                  {(data["launches"]?.payload?.list as unknown as CacheLaunchItem[])?.map((launch, i: number) => (
                    <div key={i} className="flex flex-col gap-1 p-2.5 rounded bg-bg-canvas border border-border-subtle/30">
                      <div className="flex items-center justify-between">
                        <span className="text-body-sm font-semibold text-text-primary">{launch.mission}</span>
                        <span className="text-[10px] text-accent-signal font-mono uppercase bg-accent-signal-muted px-1.5 py-0.5 rounded">{launch.provider}</span>
                      </div>
                      <div className="text-[10px] text-text-secondary">
                        Rocket: {launch.rocket}
                      </div>
                      <div className="text-[9px] text-text-tertiary">
                        Pad: {launch.pad} · Window: {new Date(launch.window_start).toLocaleDateString()}
                      </div>
                    </div>
                  )) || <span className="text-mono-sm text-text-tertiary italic">No active cache</span>}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </GlobalShell>
  );
}
