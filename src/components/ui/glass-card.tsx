import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  glow?: "primary" | "secondary" | "none";
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, glow = "none", className = "", onClick }: GlassCardProps) {
  // Inline SVG noise data-URI for zero-dependency grain overlay
  const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  return (
    <div className="relative w-full">
      {/* Cinematic Ambient Glow */}
      {glow !== "none" && (
        <div
          className={`absolute -inset-8 rounded-full blur-[80px] opacity-[0.14] -z-10 pointer-events-none transition-all duration-300 ${
            glow === "primary" ? "bg-glow-primary" : "bg-glow-secondary"
          }`}
          aria-hidden="true"
        />
      )}
      
      {/* Frosted Glass Surface */}
      <div
        onClick={onClick}
        className={`relative rounded-2xl border border-glass-edge bg-glass-surface backdrop-blur-[16px] shadow-glass transition-all duration-200 hover:border-glass-edge-hover ${
          onClick ? "cursor-pointer active:scale-[0.99]" : ""
        } ${className}`}
        style={{ willChange: "backdrop-filter, border-color" }}
      >
        {/* Subtle noise grain texture overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-[0.025] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: noiseUrl }}
          aria-hidden="true"
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
