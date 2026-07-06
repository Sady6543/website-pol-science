"use client";

import React, { useState, useEffect } from "react";
import { GlobalShell } from "@/components/global-shell";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/glass-card";
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
  
  // Debug diagnostics
  const [debugUrl, setDebugUrl] = useState<string>("");
  const [debugError, setDebugError] = useState<string>("");
  
  // Live World Clocks state
  const [clocks, setClocks] = useState({
    delhi: "",
    london: "",
    newyork: "",
    tokyo: ""
  });

  const fetchLiveData = async () => {
    try {
      const { data: rows, error } = await supabase.from("live_data_cache").select("*");
      if (error) {
        setDebugError(error.message || JSON.stringify(error));
      } else {
        setDebugError("");
      }
      if (rows) {
        const mapped = rows.reduce((acc, row) => {
          acc[row.key] = row;
          return acc;
        }, {} as Record<string, CacheRow>);
        setData(mapped);
      }
    } catch (err: any) {
      setDebugError(err?.message || String(err));
      console.error("Failed loading cached live terminal parameters:", err);
    }
  };

  const triggerIngest = async () => {
    try {
      setRefreshing(true);
      await fetch("/api/ingest?type=all");
      await fetchLiveData();
    } catch (err: any) {
      setDebugError("Trigger Ingest error: " + (err?.message || String(err)));
      console.error("Ingestion triggers failed:", err);
    } finally {
      setRefreshing(false);
    }
  };


  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setDebugUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "not found / empty");
      await fetchLiveData();
      setLoading(false);
    };
    init();

    // World clocks timer
    const clockTimer = setInterval(() => {
      const getLocaleTime = (tz: string) => {
        return new Date().toLocaleTimeString("en-US", {
          timeZone: tz,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
      };
      setClocks({
        delhi: getLocaleTime("Asia/Kolkata"),
        london: getLocaleTime("Europe/London"),
        newyork: getLocaleTime("America/New_York"),
        tokyo: getLocaleTime("Asia/Tokyo")
      });
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // Update timestamps
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const diffs: Record<string, string> = {};
      Object.keys(data).forEach((key) => {
        const updated = new Date(data[key].updated_at);
        const sec = Math.max(0, Math.floor((now.getTime() - updated.getTime()) / 1000));
        if (sec < 60) diffs[key] = `${sec}s ago`;
        else diffs[key] = `${Math.floor(sec / 60)}m ago`;
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
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 font-mono relative">
        
        {/* Ambient background glow behind top panel */}
        <div className="absolute top-10 left-1/3 w-[500px] h-[150px] rounded-full blur-[100px] bg-glow-primary/10 -z-10 pointer-events-none" />

        {/* Bloomberg Top Bar */}
        <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="rounded border border-glass-edge bg-glass-surface hover:bg-glass-surface-raised hover:border-glass-edge-hover hover:text-accent-signal py-1.5 px-3 text-mono-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? "animate-spin text-accent-signal" : ""}`} />
            <span>{refreshing ? "INGESTING..." : "FORCE INGEST DATA"}</span>
          </button>
        </GlassCard>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24 border border-dashed border-glass-edge rounded-2xl bg-glass-surface/30">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent-signal" />
              <span className="text-mono-sm uppercase tracking-wider">Syncing Global Feeds...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* World Clocks Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-glass-edge pb-6">
              {[
                { name: "New Delhi", time: clocks.delhi, label: "IST (UTC+5:30)" },
                { name: "London", time: clocks.london, label: "BST (UTC+1:00)" },
                { name: "New York", time: clocks.newyork, label: "EDT (UTC-4:00)" },
                { name: "Tokyo", time: clocks.tokyo, label: "JST (UTC+9:00)" }
              ].map((c) => (
                <GlassCard key={c.name} className="p-3 flex flex-col gap-1 items-center md:items-start">
                  <span className="text-mono-sm text-text-secondary uppercase">{c.name}</span>
                  <span className="text-heading-md font-bold tracking-wider text-accent-signal">{c.time || "00:00:00"}</span>
                  <span className="text-[10px] text-text-tertiary uppercase">{c.label}</span>
                </GlassCard>
              ))}
            </div>

            {/* Grid metrics widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Stock Indices */}
              <GlassCard glow="primary" className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between border-b border-glass-edge pb-2 mb-3">
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
                        <div key={k} className="flex flex-col border-b border-glass-edge/40 pb-2.5 last:border-0 last:pb-0">
                          <span className="text-mono-sm text-text-secondary font-semibold uppercase">{row.payload.ticker}</span>
                          {renderPriceCell(row.payload.price, row.payload.change, row.payload.changeType)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </GlassCard>

              {/* Card 2: Crypto Core */}
              <GlassCard glow="secondary" className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between border-b border-glass-edge pb-2 mb-3">
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
                        <div key={k} className="flex flex-col border-b border-glass-edge/40 pb-2.5 last:border-0 last:pb-0">
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
              </GlassCard>

              {/* Card 3: Forex Board & Weather */}
              <div className="flex flex-col gap-6">
                
                {/* Forex board */}
                <GlassCard className="p-4 flex-1">
                  <div className="flex items-center justify-between border-b border-glass-edge pb-2 mb-3">
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
                        <div key={k} className="flex items-center justify-between py-1 bg-glass-surface px-2 rounded border border-glass-edge">
                          <span className="text-mono-sm font-bold text-text-secondary">{row.payload.pair}</span>
                          <span className="text-body-sm font-semibold text-text-primary">{(row.payload.rate || 0).toFixed(4)}</span>
                          <span className={`text-[10px] ${row.payload.changeType === "positive" ? "text-data-positive" : "text-data-negative"}`}>{row.payload.change || "0.00%"}</span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* City Weather summary */}
                <GlassCard className="p-4 flex-1">
                  <div className="flex items-center justify-between border-b border-glass-edge pb-2 mb-3">
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
                        <div key={k} className="flex flex-col items-center p-2 rounded bg-glass-surface border border-glass-edge text-center">
                          <span className="text-[10px] text-text-secondary truncate w-full">{row.payload.city}</span>
                          <span className="text-heading-sm font-bold text-text-primary mt-1">{row.payload.temp}°C</span>
                          <span className="text-[9px] text-text-tertiary truncate w-full mt-0.5">{row.payload.condition}</span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>

              </div>
            </div>

            {/* Earthquakes and Launches splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              
              {/* USGS Earthquake feed */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between border-b border-glass-edge pb-2 mb-3">
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
                      <div key={i} className="flex items-start justify-between p-2 rounded bg-glass-surface border border-glass-edge">
                        <div className="flex flex-col min-w-0">
                          <span className="text-body-sm font-semibold text-text-primary truncate">{quake.location}</span>
                          <span className="text-[9px] text-text-tertiary">Depth: {quake.depth} · {new Date(quake.time).toLocaleTimeString()}</span>
                        </div>
                        <span className={`text-mono-sm font-bold px-2 py-0.5 rounded ${isHigh ? "bg-data-negative text-text-primary" : "bg-glass-surface-raised text-accent-signal border border-glass-edge"}`}>
                          M {quake.magnitude.toFixed(1)}
                        </span>
                      </div>
                    );
                  }) || <span className="text-mono-sm text-text-tertiary italic">No active cache</span>}
                </div>
              </GlassCard>

              {/* Launches manifest */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between border-b border-glass-edge pb-2 mb-3">
                  <h3 className="text-mono-sm font-semibold uppercase text-text-primary flex items-center gap-1.5">
                    <Flame className="h-4.5 w-4.5 text-accent-signal" />
                    <span>Space Launch Manifest</span>
                  </h3>
                  <span className="text-[10px] text-text-tertiary">{timeDiffs["launches"] || "No cache"}</span>
                </div>

                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                  {(data["launches"]?.payload?.list as unknown as CacheLaunchItem[])?.map((launch, i: number) => (
                    <div key={i} className="flex flex-col gap-1 p-2.5 rounded bg-glass-surface border border-glass-edge">
                      <div className="flex items-center justify-between">
                        <span className="text-body-sm font-semibold text-text-primary">{launch.mission}</span>
                        <span className="text-[10px] text-accent-signal font-mono uppercase bg-glass-surface-raised border border-glass-edge px-1.5 py-0.5 rounded">{launch.provider}</span>
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
              </GlassCard>
            </div>

            {/* Diagnostics Panel */}
            <div className="mt-8 p-4 rounded-lg border border-glass-edge bg-glass-surface/30 backdrop-blur-md text-mono-sm text-text-secondary flex flex-col gap-2 max-w-4xl mx-auto">
              <div className="text-accent-signal font-semibold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent-signal animate-pulse"></span>
                <span>Diagnostics Panel</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px]">
                <div>URL being requested by browser: <span className="text-text-primary font-bold font-mono">{debugUrl}</span></div>
                <div>Anon Key being used by client: <span className="text-text-primary font-bold font-mono">{(supabase as any).supabaseKey ? `${(supabase as any).supabaseKey.substring(0, 15)}...${(supabase as any).supabaseKey.slice(-10)}` : "not found"}</span></div>
                {debugError ? (
                  <div className="text-data-negative font-bold font-mono bg-data-negative/10 px-2 py-1 rounded mt-1">
                    Error message: {debugError}
                  </div>
                ) : (
                  <div className="text-data-positive font-bold font-mono bg-data-positive/10 px-2 py-1 rounded mt-1">
                    Connection Status: Connected (Cached records found: {Object.keys(data).length})
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </GlobalShell>
  );
}
