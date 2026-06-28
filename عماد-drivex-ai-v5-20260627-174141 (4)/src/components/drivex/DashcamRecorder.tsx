"use client";

import { useEffect, useRef, useState } from "react";
import { Video, Circle, Square, Download, Trash2, X } from "lucide-react";
import { useDriveX, type DashcamClip } from "@/lib/store";
import { cn } from "@/lib/utils";

const CLIP_DURATION_MS = 60 * 1000; // 60s loop segments

/**
 * DashcamRecorder — records the road via the rear camera in 60-second loop
 * segments using MediaRecorder. Clips are kept in memory (last 10).
 *
 * All camera/recorder logic lives inside a single effect so refs are only
 * touched during the effect lifecycle (satisfies react-hooks/immutability).
 */
export function DashcamRecorder() {
  const enabled = useDriveX((s) => s.dashcamEnabled);
  const setRecording = useDriveX((s) => s.setDashcamRecording);
  const clips = useDriveX((s) => s.dashcamClips);
  const addClip = useDriveX((s) => s.addDashcamClip);
  const deleteClip = useDriveX((s) => s.deleteDashcamClip);
  const clearClips = useDriveX((s) => s.clearDashcamClips);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClips, setShowClips] = useState(false);
  const [manualSaveFlag, setManualSaveFlag] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Main recording lifecycle.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const cleanup = () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
      try {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          recorderRef.current.stop();
        }
      } catch {
        /* noop */
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      recorderRef.current = null;
      setRecording(false);
    };

    const saveClip = (blob: Blob, trigger: "auto" | "manual") => {
      const url = URL.createObjectURL(blob);
      const coords = useDriveX.getState().coords;
      const clip: DashcamClip = {
        id: Math.random().toString(36).slice(2),
        blob: url,
        ts: Date.now(),
        durationSec: Math.round(blob.size / 1024),
        trigger,
        coords: coords ? { ...coords } : null,
      };
      addClip(clip);
    };

    const startSegment = (manualNext: boolean) => {
      if (!recorderRef.current) return;
      chunksRef.current = [];
      try {
        recorderRef.current.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            saveClip(blob, manualNext ? "manual" : "auto");
            chunksRef.current = [];
          }
          // Loop: restart if still enabled.
          if (!cancelled && useDriveX.getState().dashcamEnabled) {
            startSegment(false);
          }
        };
        recorderRef.current.start();
        stopTimerRef.current = setTimeout(() => {
          if (recorderRef.current && recorderRef.current.state === "recording") {
            recorderRef.current.stop();
          }
        }, CLIP_DURATION_MS);
      } catch {
        /* already recording */
      }
    };

    const start = async () => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";
        const rec = new MediaRecorder(stream, { mimeType: mime });
        recorderRef.current = rec;
        setRecording(true);
        startSegment(false);
      } catch (e: any) {
        if (e?.name === "NotAllowedError") {
          setError("تم رفض إذن الكاميرا. فعّله من إعدادات المتصفح.");
        } else if (e?.name === "NotFoundError") {
          setError("لا توجد كاميرا متاحة.");
        } else {
          setError("تعذّر تشغيل الكاميرا.");
        }
      }
    };

    start();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, addClip, setRecording]);

  // Manual save: stop current segment (which triggers onstop with manual tag).
  useEffect(() => {
    if (manualSaveFlag === 0) return;
    if (recorderRef.current && recorderRef.current.state === "recording") {
      // Set a flag on the recorder so onstop knows to tag as manual.
      (recorderRef.current as any).__manual = true;
      // Rebind onstop to tag the next save as manual.
      const rec = recorderRef.current;
      rec.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const coords = useDriveX.getState().coords;
          addClip({
            id: Math.random().toString(36).slice(2),
            blob: url,
            ts: Date.now(),
            durationSec: Math.round(blob.size / 1024),
            trigger: "manual",
            coords: coords ? { ...coords } : null,
          });
          chunksRef.current = [];
        }
        if (useDriveX.getState().dashcamEnabled) {
          // restart normal looping
          chunksRef.current = [];
          try {
            rec.onstop = () => {
              if (chunksRef.current.length > 0) {
                const blob = new Blob(chunksRef.current, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                const coords = useDriveX.getState().coords;
                addClip({
                  id: Math.random().toString(36).slice(2),
                  blob: url,
                  ts: Date.now(),
                  durationSec: Math.round(blob.size / 1024),
                  trigger: "auto",
                  coords: coords ? { ...coords } : null,
                });
                chunksRef.current = [];
              }
              if (useDriveX.getState().dashcamEnabled) {
                try {
                  rec.start();
                  stopTimerRef.current = setTimeout(() => {
                    if (rec.state === "recording") rec.stop();
                  }, CLIP_DURATION_MS);
                } catch {
                  /* noop */
                }
              }
            };
            rec.start();
            stopTimerRef.current = setTimeout(() => {
              if (rec.state === "recording") rec.stop();
            }, CLIP_DURATION_MS);
          } catch {
            /* noop */
          }
        }
      };
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
  }, [manualSaveFlag, addClip]);

  if (!enabled) return null;

  return (
    <div className="fixed z-40 bottom-24 right-16 w-32 sm:w-40">
      <div className="rounded-2xl overflow-hidden border border-[var(--drivex-cyan)]/30 bg-black/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-2 py-1.5 bg-black/60">
          <div className="flex items-center gap-1">
            <Video className={cn("w-3.5 h-3.5", useDriveX.getState().dashcamRecording ? "text-red-400" : "text-[var(--drivex-cyan)]")} />
            <span className="text-[10px] font-medium">Dashcam</span>
            {useDriveX.getState().dashcamRecording && <Circle className="w-2 h-2 fill-red-500 text-red-500 dx-blink" />}
          </div>
          <button
            onClick={() => useDriveX.getState().setDashcamEnabled(false)}
            className="text-muted-foreground hover:text-red-400"
            aria-label="إيقاف Dashcam"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          {error && (
            <div className="absolute inset-0 grid place-items-center p-2 text-center text-[10px] text-amber-300">
              {error}
            </div>
          )}
          {useDriveX.getState().dashcamRecording && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-red-500/80 text-white text-[9px] font-bold flex items-center gap-1">
              <Circle className="w-1.5 h-1.5 fill-white" /> REC
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 p-1.5">
          <button
            onClick={() => setManualSaveFlag((f) => f + 1)}
            disabled={!useDriveX.getState().dashcamRecording}
            className="h-8 rounded-lg bg-[var(--drivex-cyan)]/15 border border-[var(--drivex-cyan)]/30 text-[var(--drivex-cyan)] text-[10px] font-medium flex items-center justify-center gap-1 disabled:opacity-40"
          >
            <Square className="w-3 h-3" /> حفظ
          </button>
          <button
            onClick={() => setShowClips(!showClips)}
            className="h-8 rounded-lg bg-white/5 border border-white/10 text-foreground text-[10px] font-medium flex items-center justify-center gap-1"
          >
            <Video className="w-3 h-3" /> {clips.length}
          </button>
        </div>
      </div>

      {showClips && (
        <div className="mt-2 rounded-2xl border border-white/10 bg-[var(--drivex-panel)] p-2 max-h-48 overflow-y-auto dx-scroll">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">المقاطع المحفوظة</span>
            {clips.length > 0 && (
              <button onClick={clearClips} className="text-[10px] text-red-400 hover:text-red-300">
                مسح
              </button>
            )}
          </div>
          {clips.length === 0 ? (
            <div className="text-[10px] text-muted-foreground/60 text-center py-3">
              لا توجد مقاطع بعد. اضغط "حفظ" لتسجيل مقطع يدويًا.
            </div>
          ) : (
            <div className="space-y-1.5">
              {clips.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg bg-white/5 p-1.5">
                  <video src={c.blob} className="w-12 h-9 rounded object-cover" muted />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">
                      {new Date(c.ts).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {c.trigger === "manual" ? "يدوي" : c.trigger === "crash" ? "حادث" : "تلقائي"}
                    </div>
                  </div>
                  <a
                    href={c.blob}
                    download={`drivex-clip-${c.ts}.webm`}
                    className="text-[var(--drivex-cyan)] hover:text-[var(--drivex-cyan)]/80"
                    aria-label="تنزيل"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => deleteClip(c.id)}
                    className="text-muted-foreground hover:text-red-400"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
