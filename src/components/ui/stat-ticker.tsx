import React from "react";

export interface TickerItem {
  label: string;
  value: string | number;
  change?: string | number; // e.g., +1.5% or -0.8%
  changeType?: "positive" | "negative" | "neutral" | "amber";
}

interface StatTickerProps {
  items: TickerItem[];
  className?: string;
}

export function StatTicker({ items, className = "" }: StatTickerProps) {
  return (
    <div
      className={`border-y border-border-subtle bg-bg-surface py-2 overflow-x-auto whitespace-nowrap scrollbar-none select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-8 md:gap-6 min-w-max">
        {items.map((item, index) => {
          let changeColor = "text-text-secondary";

          if (item.changeType === "positive") {
            changeColor = "text-data-positive";
          } else if (item.changeType === "negative") {
            changeColor = "text-data-negative";
          } else if (item.changeType === "amber") {
            changeColor = "text-data-neutral-amber";
          }

          return (
            <div key={index} className="flex items-center gap-2 text-mono-md">
              <span className="text-text-tertiary text-mono-sm uppercase font-mono tracking-tight shrink-0">
                {item.label}
              </span>
              <span className="text-text-primary font-mono font-semibold shrink-0">
                {item.value}
              </span>
              {item.change !== undefined && (
                <span className={`font-mono text-mono-sm font-medium shrink-0 ${changeColor}`}>
                  {item.change}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
