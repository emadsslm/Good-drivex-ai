"use client";

import { useState } from "react";
import { Search, Fuel, Hospital, UtensilsCrossed, ParkingSquare, Pill, Banknote, Zap, Loader2, MapPin, Navigation } from "lucide-react";
import { useDriveX, type POI } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "fuel", label: "وقود", icon: <Fuel className="w-4 h-4" /> },
  { id: "hospital", label: "مستشفى", icon: <Hospital className="w-4 h-4" /> },
  { id: "restaurant", label: "مطعم", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "parking", label: "موقف", icon: <ParkingSquare className="w-4 h-4" /> },
  { id: "pharmacy", label: "صيدلية", icon: <Pill className="w-4 h-4" /> },
  { id: "atm", label: "صراف", icon: <Banknote className="w-4 h-4" /> },
  { id: "charging", label: "شحن", icon: <Zap className="w-4 h-4" /> },
];

export function POIFinder() {
  const coords = useDriveX((s) => s.coords);
  const results = useDriveX((s) => s.poiResults);
  const loading = useDriveX((s) => s.poiLoading);
  const setResults = useDriveX((s) => s.setPoiResults);
  const setLoading = useDriveX((s) => s.setPoiLoading);
  const [activeCat, setActiveCat] = useState<string>("fuel");

  async function search(category: string) {
    setActiveCat(category);
    if (!coords) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(
        `/api/poi?lat=${coords.lat.toFixed(4)}&lng=${coords.lng.toFixed(4)}&category=${category}&radius=5000`
      );
      const data = await res.json();
      if (data?.ok) setResults(data.results as POI[]);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl p-4 bg-[var(--drivex-panel)] border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-[var(--drivex-cyan)]" />
        <h3 className="text-sm font-semibold">الخدمات القريبة</h3>
      </div>

      {!coords ? (
        <div className="text-xs text-muted-foreground py-4 text-center">
          فعّل GPS للبحث عن الخدمات القريبة.
        </div>
      ) : (
        <>
          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto dx-scroll pb-2 mb-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => search(c.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  activeCat === c.id && !loading
                    ? "bg-[var(--drivex-cyan)]/15 border-[var(--drivex-cyan)]/40 text-[var(--drivex-cyan)]"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                )}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> جارٍ البحث...
            </div>
          ) : results.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              اختر فئة للبحث عن أقرب خدمة.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto dx-scroll">
              {results.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 rounded-xl p-2.5 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--drivex-cyan)]/10 grid place-items-center shrink-0">
                    <MapPin className="w-4 h-4 text-[var(--drivex-cyan)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.distance < 1000 ? `${p.distance} م` : `${(p.distance / 1000).toFixed(1)} كم`}
                    </div>
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lng}#map=16/${p.lat}/${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-9 h-9 rounded-lg bg-[var(--drivex-cyan)]/15 grid place-items-center text-[var(--drivex-cyan)] hover:bg-[var(--drivex-cyan)]/25 transition-colors"
                    aria-label="الاتجاهات"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
