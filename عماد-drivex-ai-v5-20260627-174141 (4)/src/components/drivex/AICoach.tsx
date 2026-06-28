"use client";

import { useState } from "react";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

export function AICoach() {
  const trips = useDriveX((s) => s.trips);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const { speak } = useTTS();
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (trips.length === 0) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trips: trips.slice(0, 30) }),
      });
      const data = await res.json();
      if (data?.ok && data.report) {
        setReport(data.report);
        if (ttsEnabled) speak(data.report);
      } else {
        setError(data?.error || "تعذّر تحليل بيانات القيادة.");
      }
    } catch {
      setError("تعذّر الاتصال بالمدرب الذكي.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-[var(--drivex-cyan)]/5 to-transparent border border-[var(--drivex-cyan)]/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] grid place-items-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">مدرب القيادة الذكي</h3>
            <div className="text-[10px] text-muted-foreground">تحليل AI لرحلاتك</div>
          </div>
        </div>
        <button
          onClick={analyze}
          disabled={loading || trips.length === 0}
          className="px-3 h-9 rounded-xl bg-[var(--drivex-cyan)]/15 border border-[var(--drivex-cyan)]/30 text-[var(--drivex-cyan)] text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "يحلّل..." : "تحليل"}
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-xs text-muted-foreground py-3 text-center">
          لا توجد رحلات كافية للتحليل. ابدأ القيادة لتسجيل رحلاتك.
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 py-3 text-center">{error}</div>
      ) : report ? (
        <div className="space-y-2">
          <div className="rounded-xl p-3 bg-[var(--drivex-panel)] border border-white/5">
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{report}</div>
          </div>
          <button
            onClick={() => {
              if (ttsEnabled) speak(report);
            }}
            className="text-[11px] text-[var(--drivex-cyan)] hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> إعادة الاستماع للتقرير
          </button>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground py-3">
          احصل على تقرير مخصص عن أسلوب قيادتك مع نصائح للتحسن. يعتمد التحليل على آخر {Math.min(30, trips.length)} رحلة.
        </div>
      )}
    </div>
  );
}
