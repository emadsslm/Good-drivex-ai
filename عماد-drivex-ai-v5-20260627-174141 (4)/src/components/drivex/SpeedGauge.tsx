"use client";

import { useDriveX } from "@/lib/store";

function compass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const i = Math.round(deg / 45) % 8;
  return dirs[i];
}

export function SpeedGauge({ compact = false }: { compact?: boolean }) {
  const speed = useDriveX((s) => s.speedKmh);
  const heading = useDriveX((s) => s.heading);
  const driving = useDriveX((s) => s.driving);
  const overLimit = speed > 120;

  if (compact) {
    return (
      <div className="flex items-baseline gap-1.5 font-mono">
        <span
          className={`tabular-nums text-2xl font-bold ${overLimit ? "text-red-400" : "text-[var(--drivex-cyan)]"}`}
        >
          {speed}
        </span>
        <span className="text-xs text-muted-foreground">km/h</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative">
        {/* outer ring */}
        <svg viewBox="0 0 220 220" className={`w-[220px] h-[220px] ${driving ? "drop-shadow-[0_0_25px_rgba(56,225,255,0.35)]" : ""}`}>
          <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(56,225,255,0.12)" strokeWidth="2" />
          <circle
            cx="110"
            cy="110"
            r="100"
            fill="none"
            stroke={overLimit ? "#ff5a5a" : "url(#dxGrad)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 100}
            strokeDashoffset={2 * Math.PI * 100 * (1 - Math.min(speed, 160) / 160)}
            transform="rotate(-90 110 110)"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s" }}
          />
          <defs>
            <linearGradient id="dxGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38e1ff" />
              <stop offset="100%" stopColor="#1ea7ff" />
            </linearGradient>
          </defs>
          {/* ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const x1 = 110 + Math.cos(a) * 88;
            const y1 = 110 + Math.sin(a) * 88;
            const x2 = 110 + Math.cos(a) * 78;
            const y2 = 110 + Math.sin(a) * 78;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(56,225,255,0.25)" strokeWidth="2" />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={`font-mono tabular-nums font-bold leading-none ${overLimit ? "text-red-400" : "text-white"} text-7xl dx-text-glow`}
          >
            {speed}
          </div>
          <div className="mt-1 text-sm font-medium text-[var(--drivex-cyan)]/80 tracking-widest">
            KM/H
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--drivex-cyan)]" />
            <span className="font-mono">{compass(heading)}</span>
          </div>
        </div>
      </div>
      {overLimit && (
        <div className="mt-3 text-xs text-red-400 font-medium dx-blink">
          ⚠ السرعة أعلى من المحدود
        </div>
      )}
    </div>
  );
}
