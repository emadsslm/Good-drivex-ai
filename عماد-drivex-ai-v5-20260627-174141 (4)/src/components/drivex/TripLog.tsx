"use client";

import { Route, Clock, Gauge, Trash2, TrendingUp, Calendar, MapPin, Leaf } from "lucide-react";
import { useDriveX, type Trip } from "@/lib/store";
import { WeatherWidget } from "./WeatherWidget";
import { EcoScore } from "./EcoScore";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("ar", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: () => void }) {
  const ecoColor =
    trip.ecoScore >= 80 ? "text-emerald-400" : trip.ecoScore >= 60 ? "text-[var(--drivex-cyan)]" : "text-amber-400";

  return (
    <div className="rounded-2xl p-4 bg-[var(--drivex-panel)] border border-white/5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--drivex-cyan)]/10 grid place-items-center">
            <Route className="w-4 h-4 text-[var(--drivex-cyan)]" />
          </div>
          <div>
            <div className="text-sm font-medium">{fmtDate(trip.startTime)}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {trip.durationMin} دقيقة
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-red-400 p-1"
          aria-label="حذف الرحلة"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl py-2 bg-white/5">
          <div className="text-[10px] text-muted-foreground mb-0.5">المسافة</div>
          <div className="text-sm font-bold text-[var(--drivex-cyan)]">{trip.distanceKm} كم</div>
        </div>
        <div className="rounded-xl py-2 bg-white/5">
          <div className="text-[10px] text-muted-foreground mb-0.5">أقصى سرعة</div>
          <div className="text-sm font-bold">{trip.maxSpeed}</div>
        </div>
        <div className="rounded-xl py-2 bg-white/5">
          <div className="text-[10px] text-muted-foreground mb-0.5">متوسط</div>
          <div className="text-sm font-bold">{trip.avgSpeed}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Leaf className={`w-3 h-3 ${ecoColor}`} />
          القيادة الاقتصادية: <span className={`font-bold ${ecoColor}`}>{trip.ecoScore}/100</span>
        </span>
        {trip.startCoords && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${trip.startCoords.lat}&mlon=${trip.startCoords.lng}#map=15/${trip.startCoords.lat}/${trip.startCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[var(--drivex-cyan)] hover:underline"
          >
            <MapPin className="w-3 h-3" /> نقطة البداية
          </a>
        )}
      </div>
    </div>
  );
}

export function TripLog() {
  const trips = useDriveX((s) => s.trips);
  const deleteTrip = useDriveX((s) => s.deleteTrip);
  const clearTrips = useDriveX((s) => s.clearTrips);
  const driving = useDriveX((s) => s.driving);

  // Aggregate stats
  const totalDistance = trips.reduce((a, t) => a + t.distanceKm, 0);
  const totalTime = trips.reduce((a, t) => a + t.durationMin, 0);
  const avgEco = trips.length > 0 ? Math.round(trips.reduce((a, t) => a + t.ecoScore, 0) / trips.length) : 0;
  const maxSpeedEver = trips.reduce((a, t) => Math.max(a, t.maxSpeed), 0);

  return (
    <div className="flex flex-col h-full dx-scroll overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-[var(--drivex-cyan)]" />
          <h2 className="text-base font-semibold">سجل الرحلات</h2>
        </div>
        {trips.length > 0 && (
          <button
            onClick={clearTrips}
            className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> مسح الكل
          </button>
        )}
      </div>

      {/* Live stats summary */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl p-3 bg-gradient-to-br from-[var(--drivex-cyan)]/10 to-transparent border border-[var(--drivex-cyan)]/20">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--drivex-cyan)]/70 uppercase tracking-widest mb-1">
              <TrendingUp className="w-3 h-3" /> إجمالي المسافة
            </div>
            <div className="text-2xl font-bold text-[var(--drivex-cyan)]">
              {totalDistance.toFixed(1)} <span className="text-sm">كم</span>
            </div>
          </div>
          <div className="rounded-2xl p-3 bg-gradient-to-br from-emerald-400/10 to-transparent border border-emerald-400/20">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 uppercase tracking-widest mb-1">
              <Clock className="w-3 h-3" /> زمن القيادة
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {Math.floor(totalTime / 60)}<span className="text-sm">س </span>
              {totalTime % 60}<span className="text-sm">د</span>
            </div>
          </div>
          <div className="rounded-2xl p-3 bg-[var(--drivex-panel)] border border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
              <Leaf className="w-3 h-3" /> متوسط القيادة الاقتصادية
            </div>
            <div className="text-2xl font-bold">{avgEco}<span className="text-sm text-muted-foreground">/100</span></div>
          </div>
          <div className="rounded-2xl p-3 bg-[var(--drivex-panel)] border border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
              <Gauge className="w-3 h-3" /> أقصى سرعة
            </div>
            <div className="text-2xl font-bold">{maxSpeedEver}<span className="text-sm text-muted-foreground"> كم/س</span></div>
          </div>
        </div>
      </div>

      {/* Weather + Eco while driving */}
      {driving && (
        <div className="px-4 mb-3 space-y-2">
          <WeatherWidget />
          <EcoScore />
        </div>
      )}

      {/* Trips list */}
      <div className="px-4 mb-2 text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" /> الرحلات السابقة ({trips.length})
      </div>

      {trips.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <Route className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <div className="text-sm text-muted-foreground">لا توجد رحلات مسجّلة بعد</div>
          <div className="text-xs text-muted-foreground/60 mt-1">
            ابدأ القيادة وسيتم تسجيل رحلتك تلقائيًا هنا
          </div>
        </div>
      ) : (
        <div className="px-4 pb-6 space-y-2.5">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} onDelete={() => deleteTrip(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
