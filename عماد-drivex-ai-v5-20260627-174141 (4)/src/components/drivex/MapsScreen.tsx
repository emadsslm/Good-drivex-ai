"use client";

import { Navigation, Crosshair, Maximize2, Home } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { MapsView } from "./MapsView";
import { SpeedGauge } from "./SpeedGauge";

export function MapsScreen() {
  const coords = useDriveX((s) => s.coords);
  const accuracy = useDriveX((s) => s.accuracy);
  const homeAddress = useDriveX((s) => s.homeAddress);
  const setView = useDriveX((s) => s.setView);

  return (
    <div className="relative flex-1 flex flex-col">
      {/* map fills the area */}
      <MapsView className="flex-1 w-full" />

      {/* floating speed pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-[var(--drivex-cyan)]/25 dx-glow">
        <SpeedGauge compact />
        <div className="w-px h-5 bg-white/15" />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Navigation className="w-3.5 h-3.5 text-[var(--drivex-cyan)]" />
          {accuracy ? `±${Math.round(accuracy)}م` : "—"}
        </span>
      </div>

      {/* home button */}
      <button
        onClick={() => setView("home")}
        className="absolute top-3 right-3 z-[500] w-10 h-10 rounded-full grid place-items-center bg-black/70 backdrop-blur-md border border-white/10 text-[var(--drivex-cyan)] hover:bg-[var(--drivex-cyan)]/10 transition-colors"
        aria-label="العودة"
      >
        <Maximize2 className="w-4 h-4 rotate-45" />
      </button>

      {/* bottom info card */}
      <div className="absolute bottom-3 left-3 right-3 z-[500] dx-safe-bottom rounded-2xl p-4 bg-black/75 backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[var(--drivex-cyan)]/70 flex items-center gap-1.5">
              <Crosshair className="w-3 h-3" /> موقعك الحالي
            </div>
            {coords ? (
              <div className="text-sm font-mono mt-0.5 truncate">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground mt-0.5">بانتظار إشارة GPS...</div>
            )}
            {homeAddress && (
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Home className="w-3 h-3" /> المنزل: {homeAddress}
              </div>
            )}
          </div>
          <a
            href={
              coords
                ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`
                : "https://www.openstreetmap.org"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black text-xs font-bold"
          >
            فتح كامل
          </a>
        </div>
      </div>
    </div>
  );
}
