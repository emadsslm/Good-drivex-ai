"use client";

import { Route, Navigation, Clock, TrendingUp } from "lucide-react";
import { useDriveX } from "@/lib/store";

function fmtAgo(ts: number) {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} أشهر`;
}

export function FrequentRoutes() {
  const routes = useDriveX((s) => s.frequentRoutes);

  if (routes.length === 0) {
    return (
      <div className="rounded-2xl p-4 bg-[var(--drivex-panel)] border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-4 h-4 text-[var(--drivex-cyan)]" />
          <h3 className="text-sm font-semibold">الطرق المتكررة</h3>
        </div>
        <div className="text-xs text-muted-foreground py-3 text-center">
          ستظهر هنا الطرق التي تسلكها كثيرًا (مثل المنزل ↔ العمل) بعد عدة رحلات.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 bg-[var(--drivex-panel)] border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-[var(--drivex-cyan)]" />
          <h3 className="text-sm font-semibold">الطرق المتكررة</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">{routes.length} طريق</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto dx-scroll">
        {routes.slice(0, 6).map((r) => (
          <a
            key={r.id}
            href={`https://www.openstreetmap.org/directions?from=${r.startCoords.lat}%2C${r.startCoords.lng}&to=${r.endCoords.lat}%2C${r.endCoords.lng}#map=13/${r.endCoords.lat}/${r.endCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl p-2.5 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--drivex-cyan)]/10 grid place-items-center shrink-0">
              <Navigation className="w-4 h-4 text-[var(--drivex-cyan)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{r.label}</div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {r.tripCount} مرة
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{r.avgDurationMin} د
                </span>
                <span>{fmtAgo(r.lastUsed)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
