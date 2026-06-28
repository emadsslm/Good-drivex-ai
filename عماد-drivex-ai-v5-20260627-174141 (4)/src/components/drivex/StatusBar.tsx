"use client";

import { useEffect, useState } from "react";
import { Satellite, WifiOff, AlertTriangle, Gauge } from "lucide-react";
import { useDriveX } from "@/lib/store";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe clock initialization
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 10);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function StatusBar() {
  const now = useClock();
  const speed = useDriveX((s) => s.speedKmh);
  const coords = useDriveX((s) => s.coords);
  const locationError = useDriveX((s) => s.locationError);
  const driving = useDriveX((s) => s.driving);

  const gpsOk = !!coords && !locationError;

  return (
    <header className="dx-safe-top flex items-center justify-between px-4 py-3 text-xs text-muted-foreground border-b border-white/5 bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--drivex-cyan)] dx-blink" />
          <span className="font-semibold tracking-wide text-[var(--drivex-cyan)]/90">DriveX AI</span>
          {driving && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--drivex-cyan)]/15 text-[var(--drivex-cyan)] text-[10px] font-bold">
              DRIVING
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {speed > 0 && (
          <span className="flex items-center gap-1 font-mono">
            <Gauge className="w-3.5 h-3.5" />
            {speed} km/h
          </span>
        )}
        <span className="font-mono">
          {now
            ? now.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })
            : "--:--"}
        </span>
        {locationError ? (
          <span className="flex items-center gap-1 text-amber-400" title={locationError}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        ) : gpsOk ? (
          <span className="flex items-center gap-1 text-[var(--drivex-cyan)]" title="GPS مفعّل">
            <Satellite className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <WifiOff className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </header>
  );
}
