"use client";

import { Leaf, Gauge } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { cn } from "@/lib/utils";

export function EcoScore({ compact = false }: { compact?: boolean }) {
  const ecoScore = useDriveX((s) => s.ecoScore);
  const driving = useDriveX((s) => s.driving);

  const rating = ecoScore >= 80 ? "ممتاز" : ecoScore >= 60 ? "جيد" : ecoScore >= 40 ? "متوسط" : "ضعيف";
  const color =
    ecoScore >= 80 ? "text-emerald-400" : ecoScore >= 60 ? "text-[var(--drivex-cyan)]" : ecoScore >= 40 ? "text-amber-400" : "text-red-400";
  const barColor =
    ecoScore >= 80 ? "bg-emerald-400" : ecoScore >= 60 ? "bg-[var(--drivex-cyan)]" : ecoScore >= 40 ? "bg-amber-400" : "bg-red-400";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/10">
        <Leaf className={cn("w-3.5 h-3.5", color)} />
        <span className={cn("text-sm font-bold", color)}>{ecoScore}</span>
        <span className="text-[10px] text-muted-foreground">قيادة</span>
      </div>
    );
  }

  if (!driving) return null;

  return (
    <div className="rounded-2xl p-4 bg-[var(--drivex-panel)] border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf className={cn("w-4 h-4", color)} />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">قيادة اقتصادية</span>
        </div>
        <span className={cn("text-xs font-bold", color)}>{rating}</span>
      </div>
      <div className="flex items-end justify-between mb-2">
        <div className={cn("text-3xl font-bold", color)}>{ecoScore}</div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${ecoScore}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
        <Gauge className="w-3 h-3" />
        تجنّب التسارع والفرملة المفاجئة لتحسين النتيجة
      </div>
    </div>
  );
}
