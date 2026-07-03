import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface TickerItem {
  label: string;
  value: string | number;
  change?: string | number;
  changeType?: "positive" | "negative" | "neutral" | "amber";
}

interface StatTickerProps {
  items: TickerItem[];
  className?: string;
}

export function StatTicker({ items, className = "" }: StatTickerProps) {
  return (
    <div
      role="region"
      aria-label="Market data ticker"
      className={`border-y border-border-subtle bg-bg-surface py-2 overflow-x-auto whitespace-nowrap scrollbar-none select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-8 md:gap-6 min-w-max">
        {items.map((item, index) => {
          let changeColor = "text-text-secondary";
          let ChangeIcon = Minus;
          let directionLabel = "";

          if (item.changeType === "positive") {
            changeColor = "text-data-positive";
            ChangeIcon = TrendingUp;
            directionLabel = "up";
          } else if (item.changeType === "negative") {
            changeColor = "text-data-negative";
            ChangeIcon = TrendingDown;
            directionLabel = "down";
          } else if (item.changeType === "amber") {
            changeColor = "text-data-neutral-amber";
          }

          const ariaLabel = `${item.label}: ${item.value}${
            item.change !== undefined
              ? `, ${directionLabel ? directionLabel + " " : ""}${item.change}`
              : ""
          }`;

          return (
            <div
              key={index}
              className="flex items-center gap-2 text-mono-md"
              aria-label={ariaLabel}
            >
              <span className="text-text-tertiary text-mono-sm uppercase font-mono tracking-tight shrink-0">
                {item.label}
              </span>
              <span className="text-text-primary font-mono font-semibold shrink-0">
                {item.value}
              </span>
              {item.change !== undefined && (
                <span
                  className={`font-mono text-mono-sm font-medium shrink-0 flex items-center gap-0.5 ${changeColor}`}
                  aria-hidden="true"
                >
                  {(item.changeType === "positive" ||
                    item.changeType === "negative") && (
                    <ChangeIcon className="h-3 w-3" aria-hidden="true" />
                  )}
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
