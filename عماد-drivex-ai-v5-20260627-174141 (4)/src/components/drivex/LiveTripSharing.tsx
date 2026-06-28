"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Users, Radio, Copy, Check, MapPin, Gauge } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

const PORT = 3003;

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * LiveTripSharing — broadcasts live location/speed to a mini-service WebSocket
 * so others can follow the trip via a shared link/code.
 */
export function LiveTripSharing() {
  const driving = useDriveX((s) => s.driving);
  const coords = useDriveX((s) => s.coords);
  const speed = useDriveX((s) => s.speedKmh);
  const liveTrip = useDriveX((s) => s.liveTrip);
  const setLiveTrip = useDriveX((s) => s.setLiveTrip);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const { speak } = useTTS();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start broadcasting when sharing becomes true.
  useEffect(() => {
    if (!liveTrip.sharing) {
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ type: "end", code: liveTrip.tripCode }));
          wsRef.current.close();
        } catch {
          /* noop */
        }
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Open WebSocket via the gateway (XTransformPort query).
    const proto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    const host = typeof window !== "undefined" ? window.location.host : "localhost";
    const url = `${proto}://${host}/?XTransformPort=${PORT}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setLiveTrip({ sharing: false });
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      // Broadcast loop: send current position every 5s.
      intervalRef.current = setInterval(() => {
        const s = useDriveX.getState();
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(
          JSON.stringify({
            type: "broadcast",
            code: s.liveTrip.tripCode,
            payload: {
              coords: s.coords,
              speed: s.speedKmh,
              ts: Date.now(),
            },
          })
        );
      }, 5000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "viewers-ping") {
          // We can't easily count viewers server-side; skip for now.
        }
      } catch {
        /* noop */
      }
    };

    ws.onerror = () => {
      /* silent */
    };

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  }, [liveTrip.sharing, liveTrip.tripCode, setLiveTrip]);

  // Stop sharing when driving ends.
  useEffect(() => {
    if (!driving && liveTrip.sharing) {
      setLiveTrip({ sharing: false });
      if (ttsEnabled) speak("تم إيقاف مشاركة الرحلة.");
    }
  }, [driving, liveTrip.sharing, setLiveTrip, ttsEnabled, speak]);

  function startSharing() {
    const code = genCode();
    setLiveTrip({ sharing: true, tripCode: code, viewers: 0 });
    if (ttsEnabled) speak("بدأت مشاركة رحلتك مباشرة. شارك الرمز مع من تريد أن يتابعك.");
  }

  function stopSharing() {
    setLiveTrip({ sharing: false });
  }

  function copyLink() {
    const shareUrl = `${window.location.origin}/?follow=${liveTrip.tripCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  function shareLink() {
    const shareUrl = `${window.location.origin}/?follow=${liveTrip.tripCode}`;
    if (navigator.share) {
      navigator.share({
        title: "تابع رحلتي على DriveX AI",
        text: `أتابع رحلة مباشرة على DriveX AI. الرمز: ${liveTrip.tripCode}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      copyLink();
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => (liveTrip.sharing ? setOpen(true) : setOpen(true))}
        className={cn(
          "w-full flex items-center gap-3 rounded-2xl p-3.5 border transition-colors",
          liveTrip.sharing
            ? "bg-emerald-400/10 border-emerald-400/30"
            : "bg-[var(--drivex-panel)] border-white/5 hover:border-[var(--drivex-cyan)]/30"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl grid place-items-center shrink-0",
          liveTrip.sharing ? "bg-emerald-400/20" : "bg-[var(--drivex-cyan)]/10"
        )}>
          <Radio className={cn("w-5 h-5", liveTrip.sharing ? "text-emerald-400 dx-blink" : "text-[var(--drivex-cyan)]")} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium">
            {liveTrip.sharing ? "مشاركة الرحلة مفعّلة" : "مشاركة الرحلة مباشرة"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {liveTrip.sharing ? `الرمز: ${liveTrip.tripCode}` : "دع الآخرين يتابعون موقعك مباشرة"}
          </div>
        </div>
        <Share2 className={cn("w-4 h-4", liveTrip.sharing ? "text-emerald-400" : "text-muted-foreground")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[var(--drivex-panel)] border border-[var(--drivex-cyan)]/20 p-5 dx-safe-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[var(--drivex-cyan)]/20 grid place-items-center">
                    <Radio className="w-4 h-4 text-[var(--drivex-cyan)]" />
                  </div>
                  <h2 className="text-base font-bold">مشاركة الرحلة</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!liveTrip.sharing ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    اسمح لأي شخص تثق به بمتابعة رحلتك مباشرة على الخريطة مع سرعتك وموقعك. يتوقف المشاركة تلقائيًا عند إنهاء القيادة.
                  </p>
                  <button
                    onClick={startSharing}
                    disabled={!driving}
                    className="w-full h-12 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Radio className="w-5 h-5" /> ابدأ المشاركة
                  </button>
                  {!driving && (
                    <p className="text-[11px] text-amber-400/80 text-center mt-2">
                      يجب أن تكون في وضع القيادة لبدء المشاركة.
                    </p>
                  )}
                </>
              ) : (
                <>
                  {/* Live code */}
                  <div className="rounded-2xl p-4 bg-emerald-400/5 border border-emerald-400/20 mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1">رمز المتابعة</div>
                    <div className="text-3xl font-bold font-mono text-emerald-300 tracking-wider text-center my-2">
                      {liveTrip.tripCode}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300/80">
                      <Users className="w-3.5 h-3.5" /> بث مباشر
                    </div>
                  </div>

                  {/* Live status */}
                  {coords && (
                    <div className="rounded-xl p-3 bg-white/5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-[var(--drivex-cyan)]" />
                          <span className="font-mono">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--drivex-cyan)]">
                          <Gauge className="w-3.5 h-3.5" /> {speed} كم/س
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={shareLink}
                    className="w-full h-12 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black font-bold flex items-center justify-center gap-2 mb-2"
                  >
                    <Share2 className="w-5 h-5" /> مشاركة الرابط
                  </button>
                  <button
                    onClick={copyLink}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium flex items-center justify-center gap-2 mb-2"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
                  </button>
                  <button
                    onClick={stopSharing}
                    className="w-full h-11 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> إيقاف المشاركة
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
