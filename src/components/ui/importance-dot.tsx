import React from "react";

export type ImportanceLevel = 1 | 2 | 3 | "low" | "medium" | "high";

interface ImportanceDotProps {
  level: ImportanceLevel;
  className?: string;
  showLabel?: boolean;
}

export function ImportanceDot({ level, className = "", showLabel = true }: ImportanceDotProps) {
  let colorClass = "bg-importance-low";
  let label = "Low";

  if (level === 3 || level === "high") {
    colorClass = "bg-importance-high";
    label = "High";
  } else if (level === 2 || level === "medium") {
    colorClass = "bg-importance-medium";
    label = "Medium";
  } else {
    colorClass = "bg-importance-low";
    label = "Low";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorClass}`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-mono-sm text-text-secondary font-mono tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}
