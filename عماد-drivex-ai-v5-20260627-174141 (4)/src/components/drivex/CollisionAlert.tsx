"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, AlertTriangle, X } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

/**
 * CollisionAlert — uses the rear camera + native canvas frame differencing to
 * detect an approaching object in the center of the frame. When motion grows
 * rapidly and sustainedly, it triggers a voice + visual alert.
 *
 * Pure browser APIs (getUserMedia + canvas). No ML library needed.
 */
export function CollisionAlert() {
  const enabled = useDriveX((s) => s.cameraAlertEnabled);
  const setEnabled = useDriveX((s) => s.setCameraAlertEnabled);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const voiceResponse = useDriveX((s) => s.voiceResponse);
  const { speak } = useTTS();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const alertCooldownRef = useRef<number>(0);

  const [alertLevel, setAlertLevel] = useState(0); // 0..100
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  // Start / stop camera based on enabled flag. All camera logic lives inside
  // this effect so refs are only touched during the effect lifecycle.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const stopCamera = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      prevFrameRef.current = null;
      setAlertLevel(0);
    };

    const runDetection = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const W = 96;
      const H = 72;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const loop = () => {
        if (!streamRef.current) return;
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, W, H);
          const frame = ctx.getImageData(0, 0, W, H).data;

          if (prevFrameRef.current) {
            // Compare center region (where a car ahead would be).
            let changed = 0;
            let counted = 0;
            for (let y = Math.floor(H * 0.25); y < H * 0.75; y++) {
              for (let x = Math.floor(W * 0.25); x < W * 0.75; x++) {
                const i = (y * W + x) * 4;
                const dr = Math.abs(frame[i] - prevFrameRef.current[i]);
                const dg = Math.abs(frame[i + 1] - prevFrameRef.current[i + 1]);
                const db = Math.abs(frame[i + 2] - prevFrameRef.current[i + 2]);
                const diff = (dr + dg + db) / 3;
                if (diff > 18) changed++;
                counted++;
              }
            }
            const ratio = counted > 0 ? changed / counted : 0; // 0..1
            setAlertLevel((prev) => Math.round(prev * 0.7 + ratio * 100 * 2.5 * 0.3));

            // Trigger voice alert if sustained high motion (approaching object)
            if (ratio > 0.35 && Date.now() - alertCooldownRef.current > 4000) {
              alertCooldownRef.current = Date.now();
              if (voiceResponse && ttsEnabled) {
                speak("تنبيه: جسم أمامي يقترب. خفّف السرعة واحذر.");
              }
            }
          }
          prevFrameRef.current = new Uint8ClampedArray(frame);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    const startCamera = async () => {
      setCameraError(null);
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
        runDetection();
      } catch (e: any) {
        if (e?.name === "NotAllowedError") {
          setCameraError("تم رفض إذن الكاميرا. فعّله من إعدادات المتصفح.");
        } else if (e?.name === "NotFoundError") {
          setCameraError("لا توجد كاميرا خلفية متاحة.");
        } else {
          setCameraError("تعذّر تشغيل الكاميرا.");
        }
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [enabled, voiceResponse, ttsEnabled, speak]);

  if (!enabled) return null;

  const danger = alertLevel > 35;

  return (
    <div className={cn(
      "fixed z-40 transition-all",
      minimized ? "bottom-20 left-3 w-28 h-20" : "bottom-24 left-3 right-3 sm:right-auto sm:w-80"
    )}>
      <div className={cn(
        "rounded-2xl overflow-hidden border bg-black/85 backdrop-blur-md",
        danger ? "border-red-500/70 dx-glow" : "border-[var(--drivex-cyan)]/30"
      )}>
        {/* header */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/60">
          <div className="flex items-center gap-2">
            <Camera className={cn("w-4 h-4", danger ? "text-red-400 dx-blink" : "text-[var(--drivex-cyan)]")} />
            <span className="text-xs font-medium">
              {danger ? "⚠ تنبيه اقتراب" : "كاشف المسافة الأمامية"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-muted-foreground hover:text-foreground text-xs px-1"
              aria-label="تصغير"
            >
              {minimized ? "⤢" : "⤡"}
            </button>
            <button
              onClick={() => setEnabled(false)}
              className="text-muted-foreground hover:text-red-400"
              aria-label="إيقاف الكاميرا"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* center scan box */}
              <div className={cn(
                "absolute inset-[20%] border-2 rounded transition-colors",
                danger ? "border-red-500" : "border-[var(--drivex-cyan)]/50"
              )} />
              {cameraError && (
                <div className="absolute inset-0 grid place-items-center p-3 text-center text-xs text-amber-300">
                  <div>
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                    {cameraError}
                  </div>
                </div>
              )}
            </div>
            {/* level bar */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>مستوى الاقتراب</span>
                <span className={cn("font-mono font-bold", danger ? "text-red-400" : "text-[var(--drivex-cyan)]")}>
                  {alertLevel}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    alertLevel > 60 ? "bg-red-500" : alertLevel > 35 ? "bg-amber-400" : "bg-[var(--drivex-cyan)]"
                  )}
                  style={{ width: `${Math.min(100, alertLevel)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
