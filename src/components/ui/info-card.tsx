import React from "react";
import { ImportanceLevel } from "./importance-dot";
import { GlassCard } from "./glass-card";

interface InfoCardProps {
  importance: ImportanceLevel;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InfoCard({ importance, children, className = "", onClick }: InfoCardProps) {
  let barColorClass = "bg-importance-low";
  const isHighImportance = importance === 3 || importance === "high";
  const isMediumImportance = importance === 2 || importance === "medium";

  if (isHighImportance) {
    barColorClass = "bg-importance-high";
  } else if (isMediumImportance) {
    barColorClass = "bg-importance-medium";
  }

  return (
    <GlassCard
      glow={isHighImportance ? "primary" : "none"}
      onClick={onClick}
      className={`overflow-hidden p-5 ${className}`}
    >
      {/* 3px left importance bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${barColorClass}`} />
      <div className="pl-1.5">{children}</div>
    </GlassCard>
  );
}
