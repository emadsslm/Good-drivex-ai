"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Phone } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useCrashDetection } from "@/hooks/use-crash-detection";
import { SOSButton } from "./SOSButton";

/**
 * CrashDetectionOverlay — listens for crash detection countdown and shows a
 * full-screen 30s countdown. If it reaches 0, opens the SOS dialog.
 */
export function CrashDetectionOverlay() {
  const driving = useDriveX((s) => s.driving);
  const enabled = useDriveX((s) => s.crashDetectionEnabled);
  const coords = useDriveX((s) => s.coords);
  const sosContacts = useDriveX((s) => s.sosContacts);
  const decline = useDriveX((s) => s.crashDeclineRate);

  const triggerSOS = () => {
    // Programmatically open the SOS dialog by clicking the floating button.
    const btn = document.querySelector<HTMLButtonElement>('[aria-label="طلب مساعدة طارئة"]');
    btn?.click();
  };

  const { countdown, dismiss } = useCrashDetection(triggerSOS);

  // When countdown hits 0, fire SOS.
  if (countdown === 0) {
    triggerSOS();
  }

  const active = driving && enabled && countdown !== null && countdown > 0;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-[var(--drivex-panel)] border-2 border-red-500/60 p-6 text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-4">
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-red-500"
                animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <div className="relative w-20 h-20 rounded-full bg-red-500/20 grid place-items-center">
                <ShieldAlert className="w-10 h-10 text-red-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-red-300 mb-1">تم كشف احتمال حادث</h2>
            <p className="text-xs text-muted-foreground mb-4">
              تباطؤ شديد: {decline} كم/س في الثانية
            </p>

            <div className="my-5">
              <motion.div
                key={countdown}
                initial={{ scale: 1.4, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-bold text-red-400 tabular-nums dx-blink"
              >
                {countdown}
              </motion.div>
              <div className="text-xs text-muted-foreground mt-2">ثانية لإلغاء التنبيه</div>
            </div>

            <p className="text-sm text-muted-foreground mb-5">
              سيتم إرسال طلب مساعدة تلقائيًا مع موقعك إذا لم تُلغِ التنبيه.
            </p>

            <button
              onClick={dismiss}
              className="w-full h-14 rounded-xl bg-emerald-500 text-black font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform mb-2"
            >
              <X className="w-6 h-6" />
              أنا بخير — إلغاء
            </button>

            <button
              onClick={triggerSOS}
              className="w-full h-11 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-medium flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              إرسال المساعدة الآن
            </button>

            {coords && (
              <div className="mt-3 text-[10px] text-muted-foreground/70 font-mono">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
