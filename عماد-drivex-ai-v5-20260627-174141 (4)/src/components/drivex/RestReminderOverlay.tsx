"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X, ShieldAlert } from "lucide-react";
import { useRestReminder } from "@/hooks/use-rest-reminder";

export function RestReminderOverlay() {
  const { triggered, dismiss } = useRestReminder();

  return (
    <AnimatePresence>
      {triggered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl bg-[var(--drivex-panel)] border border-amber-400/30 p-6 text-center dx-glow"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/15 grid place-items-center mb-4">
              <Coffee className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-amber-300 mb-2">
              وقت للاستراحة
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              لقد قمت بالقيادة لمدة ساعتين. يُنصح بأخذ استراحة قصيرة (15 دقيقة)
              لتجنب التعب والنعاس. توقف في مكان آمن عند أول فرصة.
            </p>
            <div className="flex items-center gap-1.5 justify-center text-xs text-amber-400/80 mb-5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>القيادة المتواصلة تزيد خطر الحوادث</span>
            </div>
            <button
              onClick={dismiss}
              className="w-full h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-black font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
              فهمت، سأستريح قريبًا
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
