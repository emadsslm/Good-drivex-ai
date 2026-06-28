"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, Phone, MapPin, X, Send } from "lucide-react";
import { useDriveX } from "@/lib/store";

export function SOSButton() {
  const [open, setOpen] = useState(false);
  const coords = useDriveX((s) => s.coords);
  const sosContacts = useDriveX((s) => s.sosContacts);

  const message = coords
    ? `🚨 طلب مساعدة طارئة من DriveX AI.\nموقعي الحالي:\nhttps://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=18/${coords.lat}/${coords.lng}\nالإحداثيات: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
    : "🚨 طلب مساعدة طارئة من DriveX AI. (تعذّر تحديد الموقع)";

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "DriveX AI - SOS", text: message });
      } catch {
        /* user cancelled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      alert("تم نسخ رسالة SOS مع موقعك. الصقها في تطبيق المراسلات.");
    }
  };

  const callEmergency = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-3 z-40 w-14 h-14 rounded-full grid place-items-center bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30 active:scale-90 transition-transform"
        aria-label="طلب مساعدة طارئة"
      >
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-red-400"
          animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <Siren className="w-6 h-6" />
      </motion.button>

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
              className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[var(--drivex-panel)] border border-red-500/30 p-5 dx-safe-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-red-500/20 grid place-items-center">
                    <Siren className="w-4 h-4 text-red-400" />
                  </div>
                  <h2 className="text-base font-bold text-red-300">مساعدة طارئة</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {coords ? (
                <div className="mb-4 rounded-xl p-3 bg-emerald-400/5 border border-emerald-400/20 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-300 mb-1">
                    <MapPin className="w-3.5 h-3.5" /> تم تحديد موقعك
                  </div>
                  <div className="font-mono text-muted-foreground">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-xl p-3 bg-amber-400/5 border border-amber-400/20 text-xs text-amber-300">
                  ⚠ تعذّر تحديد موقعك بدقة. تأكد من تفعيل GPS.
                </div>
              )}

              <div className="space-y-2 mb-4">
                <button
                  onClick={() => callEmergency("911")}
                  className="w-full h-12 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-bold flex items-center justify-center gap-2 hover:bg-red-500/25 transition-colors"
                >
                  <Phone className="w-4 h-4" /> الطوارئ 911
                </button>
                {sosContacts && (
                  <button
                    onClick={() => callEmergency(sosContacts)}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> جهة اتصال: {sosContacts}
                  </button>
                )}
              </div>

              <button
                onClick={share}
                className="w-full h-12 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> مشاركة موقعي مع جهة اتصال
              </button>

              <p className="mt-3 text-[10px] text-muted-foreground/70 text-center">
                سيتم نسخ/مشاركة موقعك الحالي عبر تطبيق المراسلات الذي تختاره.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
