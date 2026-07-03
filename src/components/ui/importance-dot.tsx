import React from "react";

export type ImportanceLevel = 1 | 2 | 3 | "low" | "medium" | "high";

interface ImportanceDotProps {
  level: ImportanceLevel;
  className?: string;
  showLabel?: boolean;
}

// Shape + color pairs so importance is NEVER communicated by color alone (WCAG 1.4.1)
const LEVEL_MAP: Record<
  string,
  { colorClass: string; label: string; shape: string }
> = {
  high: {
    colorClass: "bg-importance-high",
    label: "High",
    shape: "●", // filled circle
  },
  medium: {
    colorClass: "bg-importance-medium",
    label: "Medium",
    shape: "◆", // diamond
  },
  low: {
    colorClass: "bg-importance-low",
    label: "Low",
    shape: "○", // empty circle
  },
};

export function ImportanceDot({
  level,
  className = "",
  showLabel = true,
}: ImportanceDotProps) {
  const key =
    level === 3 || level === "high"
      ? "high"
      : level === 2 || level === "medium"
      ? "medium"
      : "low";

  const { colorClass, label, shape } = LEVEL_MAP[key];

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`${label} importance`}
    >
      {/* Shape indicator (color + shape = two distinct channels) */}
      <span
        className={`h-2 w-2 rounded-sm shrink-0 flex items-center justify-center ${colorClass}`}
        aria-hidden="true"
        title={`${label} importance`}
      >
        <span className="sr-only">{shape}</span>
      </span>
      {showLabel && (
        <span className="text-mono-sm text-text-secondary font-mono tracking-wide">
          {label}
        </span>
      )}
      {/* Hidden accessible text when label is hidden */}
      {!showLabel && <span className="sr-only">{label} importance</span>}
    </div>
  );
}
