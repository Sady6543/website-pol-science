import React from "react";

// ─── Base Skeleton ────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
  "aria-label"?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
      role="status"
      aria-label={props["aria-label"] || "Loading…"}
      aria-live="polite"
    />
  );
}

// ─── Article row skeleton ─────────────────────────────────────
export function SkeletonArticleRow() {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-surface p-4"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 mt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

// ─── Card skeleton (wider card) ───────────────────────────────
export function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface p-5"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-8 rounded-full" />
      </div>
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

// ─── Stat bar skeleton ────────────────────────────────────────
export function SkeletonStatBar() {
  return (
    <div
      className="flex items-center gap-4 border-y border-border-subtle py-2 px-4"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 shrink-0">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Heatmap skeleton ─────────────────────────────────────────
export function SkeletonHeatmap() {
  return (
    <div className="flex gap-1 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 52 }).map((_, w) => (
        <div key={w} className="flex flex-col gap-1">
          {Array.from({ length: 7 }).map((__, d) => (
            <Skeleton key={d} className="h-3 w-3" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Text lines skeleton ──────────────────────────────────────
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}
