import React from "react";
import { ImportanceLevel } from "./importance-dot";

interface InfoCardProps {
  importance: ImportanceLevel;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InfoCard({ importance, children, className = "", onClick }: InfoCardProps) {
  let barColorClass = "bg-importance-low";
  if (importance === 3 || importance === "high") {
    barColorClass = "bg-importance-high";
  } else if (importance === 2 || importance === "medium") {
    barColorClass = "bg-importance-medium";
  }

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface p-5 transition-colors duration-120 ease-out hover:border-accent-signal-muted ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* 3px left importance bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${barColorClass}`} />
      <div className="pl-1.5">{children}</div>
    </div>
  );
}
