import React from "react";

interface TopicPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  sparklineData?: number[]; // optional mini sparkline data
}

export function TopicPill({
  label,
  active = false,
  onClick,
  className = "",
  sparklineData,
}: TopicPillProps) {
  // Sparkline color based on state
  const strokeColor = active ? "var(--accent-signal)" : "var(--text-secondary)";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-body-sm font-medium transition-colors duration-120 border border-border-subtle cursor-pointer ${
        active
          ? "bg-accent-signal-muted text-accent-signal border-accent-signal"
          : "bg-bg-surface-raised text-text-secondary hover:bg-accent-signal-muted hover:text-accent-signal hover:border-border-subtle"
      } ${className}`}
    >
      <span>{label}</span>
      {sparklineData && sparklineData.length > 0 && (
        <svg className="h-2.5 w-8 shrink-0 opacity-80" viewBox="0 0 32 10" fill="none">
          <path
            d={generateSparklinePath(sparklineData, 32, 10)}
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function generateSparklinePath(data: number[], width: number, height: number): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 2) - 1; // 1px margin
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(" L ")}`;
}
