"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, MapPin, Camera, X, Navigation, Trash2, Mic } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

/**
 * ParkingReminder — when driving stops, prompts to save the parking spot
 * (location + optional photo + optional voice note). Later, "Find my car"
 * opens the map with a return route.
 */
export function ParkingReminder() {
  const driving = useDriveX((s) => s.driving);
  const coords = useDriveX((s) => s.coords);
  const parkingSpot = useDriveX((s) => s.parkingSpot);
  const setParkingSpot = useDriveX((s) => s.setParkingSpot);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const { speak } = useTTS();
  const { start } = useSpeechRecognition("ar-SA");

  const [showPrompt, setShowPrompt] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Detect transition from driving → stopped to prompt saving.
  const wasDrivingRef = useRef(false);
  useEffect(() => {
    if (driving) {
      wasDrivingRef.current = true;
    } else if (wasDrivingRef.current && coords) {
      wasDrivingRef.current = false;
      // Just stopped driving → prompt.
      setTimeout(() => setShowPrompt(true), 800);
    }
  }, [driving, coords]);

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraOpen(true);
    } catch {
      /* ignore */
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.6));
    closeCamera();
  }

  function save() {
    if (!coords) return;
    setParkingSpot({
      ts: Date.now(),
      coords: { ...coords },
      photo,
      note: note.trim(),
    });
    setShowPrompt(false);
    setPhoto(null);
    setNote("");
    if (ttsEnabled) speak("تم حفظ مكان سيارتك. ستجده عند الحاجة في قسم المزيد.");
  }

  function recordVoiceNote() {
    start((text) => {
      setNote((prev) => (prev ? `${prev} ${text}` : text));
    });
  }

  function clearSpot() {
    setParkingSpot(null);
    if (ttsEnabled) speak("تم حذف مكان السيارة المحفوظ.");
  }

  return (
    <>
      {/* Floating "Find my car" button when a spot is saved */}
      {parkingSpot && !showPrompt && (
        <button
          onClick={() => setShowPrompt(true)}
          className="w-full flex items-center gap-3 rounded-2xl p-3.5 bg-gradient-to-br from-[var(--drivex-cyan)]/10 to-transparent border border-[var(--drivex-cyan)]/20 hover:bg-[var(--drivex-cyan)]/15 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--drivex-cyan)]/20 grid place-items-center shrink-0">
            <Car className="w-5 h-5 text-[var(--drivex-cyan)]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-medium">مكان سيارتك محفوظ</div>
            <div className="text-[11px] text-muted-foreground">
              {new Date(parkingSpot.ts).toLocaleString("ar", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <Navigation className="w-4 h-4 text-[var(--drivex-cyan)]" />
        </button>
      )}

      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[var(--drivex-panel)] border border-[var(--drivex-cyan)]/20 p-5 dx-safe-bottom max-h-[92vh] overflow-y-auto dx-scroll"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[var(--drivex-cyan)]/20 grid place-items-center">
                    <Car className="w-4 h-4 text-[var(--drivex-cyan)]" />
                  </div>
                  <h2 className="text-base font-bold">
                    {parkingSpot ? "مكان سيارتك" : "حفظ مكان السيارة"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowPrompt(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {coords ? (
                <>
                  <div className="rounded-xl p-3 bg-emerald-400/5 border border-emerald-400/20 mb-3">
                    <div className="flex items-center gap-1.5 text-emerald-300 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5" /> الموقع محفوظ
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </div>
                  </div>

                  {/* Photo */}
                  {photo ? (
                    <div className="relative rounded-xl overflow-hidden mb-3">
                      <img src={photo} alt="مكان السيارة" className="w-full h-40 object-cover" />
                      <button
                        onClick={() => setPhoto(null)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 grid place-items-center text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={openCamera}
                      className="w-full h-12 rounded-xl border border-dashed border-white/20 text-sm text-muted-foreground hover:border-[var(--drivex-cyan)]/40 hover:text-[var(--drivex-cyan)] flex items-center justify-center gap-2 mb-3 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> إضافة صورة للمكان
                    </button>
                  )}

                  {/* Note */}
                  <div className="flex gap-2 mb-3">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="ملاحظة (مثال: الطابق الثاني، بجوار العمود 12)"
                      className="flex-1 h-11 rounded-xl bg-[var(--drivex-panel-2)] border border-white/10 px-3 text-sm outline-none focus:border-[var(--drivex-cyan)]/50"
                    />
                    <button
                      onClick={recordVoiceNote}
                      className="shrink-0 w-11 h-11 rounded-xl bg-[var(--drivex-panel-2)] border border-[var(--drivex-cyan)]/30 text-[var(--drivex-cyan)] grid place-items-center"
                      aria-label="ملاحظة صوتية"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  {parkingSpot ? (
                    <>
                      <a
                        href={`https://www.openstreetmap.org/directions?from=${coords.lat}%2C${coords.lng}&to=${parkingSpot.coords.lat}%2C${parkingSpot.coords.lng}#map=16/${parkingSpot.coords.lat}/${parkingSpot.coords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-12 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black font-bold flex items-center justify-center gap-2 mb-2"
                      >
                        <Navigation className="w-5 h-5" /> خذني لسيارتي
                      </a>
                      <button
                        onClick={clearSpot}
                        className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> حذف المكان المحفوظ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={save}
                      className="w-full h-12 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black font-bold flex items-center justify-center gap-2"
                    >
                      <Car className="w-5 h-5" /> حفظ المكان
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-sm text-amber-300">
                  تعذّر تحديد موقعك. فعّل GPS وأعد المحاولة.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera capture overlay */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 dx-safe-top">
              <span className="text-sm text-white">التقط صورة لمكان السيارة</span>
              <button onClick={closeCamera} className="text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 relative">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="dx-safe-bottom p-6 flex justify-center">
              <button
                onClick={capturePhoto}
                className="w-18 h-18 w-[72px] h-[72px] rounded-full border-4 border-white bg-white/20 grid place-items-center active:scale-95 transition-transform"
                aria-label="التقاط"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
