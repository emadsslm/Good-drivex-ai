"use client";

import { Mic, MicOff, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDriveX } from "@/lib/store";
import { useDriveXAssistant } from "@/hooks/use-assistant";

export function VoiceOrb({ size = "lg" }: { size?: "lg" | "md" }) {
  const listening = useDriveX((s) => s.listening);
  const driving = useDriveX((s) => s.driving);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const setTtsEnabled = useDriveX((s) => s.setTtsEnabled);
  const setListening = useDriveX((s) => s.setListening);
  const { speechSupported, startListening, stopListening } = useDriveXAssistant();

  const dim = size === "lg" ? "w-32 h-32" : "w-20 h-20";
  const icon = size === "lg" ? "h-12 w-12" : "h-7 w-7";

  const handleToggle = () => {
    if (listening) {
      stopListening();
      setListening(false);
    } else {
      setListening(true);
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <AnimatePresence>
          {listening && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[var(--drivex-cyan)]/60"
                initial={{ scale: 0.85, opacity: 0.7 }}
                animate={{ scale: 1.7, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[var(--drivex-cyan)]/40"
                initial={{ scale: 0.85, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
              />
            </>
          )}
        </AnimatePresence>

        <button
          onClick={handleToggle}
          disabled={!speechSupported}
          aria-pressed={listening}
          aria-label={listening ? "إيقاف الاستماع" : "بدء الاستماع"}
          className={`${dim} relative grid place-items-center rounded-full transition-all
            ${listening
              ? "bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black dx-glow"
              : "bg-[var(--drivex-panel-2)] text-[var(--drivex-cyan)] border border-[var(--drivex-cyan)]/30 hover:border-[var(--drivex-cyan)]/70 hover:bg-[var(--drivex-cyan)]/10"}
            disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
        >
          {listening ? <Square className={`${icon} fill-current`} /> : <Mic className={icon} />}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${listening ? "text-[var(--drivex-cyan)]" : "text-muted-foreground"}`}>
          {listening
            ? "أستمع..."
            : speechSupported
              ? driving
                ? "اضغط وتحدث"
                : "المساعد الصوتي"
              : "الصوت غير مدعوم"}
        </span>
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          title={ttsEnabled ? "الرد الصوتي مفعّل" : "الرد الصوتي معطّل"}
          className="text-muted-foreground hover:text-[var(--drivex-cyan)] transition-colors"
          aria-label="تبديل الرد الصوتي"
        >
          {ttsEnabled ? <MicOff className="hidden" /> : null}
        </button>
      </div>
    </div>
  );
}
