"use client";

import { motion } from "framer-motion";
import { Map as MapIcon, Music, MessageSquare, Home as HomeIcon, Navigation, Volume2, VolumeX } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { SpeedGauge } from "./SpeedGauge";
import { VoiceOrb } from "./VoiceOrb";
import { WeatherWidget } from "./WeatherWidget";
import { EcoScore } from "./EcoScore";

export function DriveScreen() {
  const setView = useDriveX((s) => s.setView);
  const setMediaPlaying = useDriveX((s) => s.setMediaPlaying);
  const mediaPlaying = useDriveX((s) => s.mediaPlaying);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const setTtsEnabled = useDriveX((s) => s.setTtsEnabled);
  const lastTranscript = useDriveX((s) => s.lastTranscript);
  const speed = useDriveX((s) => s.speedKmh);
  const coords = useDriveX((s) => s.coords);
  const driving = useDriveX((s) => s.driving);

  return (
    <div className="relative flex-1 flex flex-col dx-grid-bg overflow-hidden">
      {/* top: speed gauge */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 overflow-y-auto dx-scroll">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SpeedGauge />
        </motion.div>

        {/* location strip */}
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5 text-[11px] text-muted-foreground">
          <Navigation className="w-3.5 h-3.5 text-[var(--drivex-cyan)]" />
          {coords ? (
            <span className="font-mono">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          ) : (
            <span>بانتظار إشارة GPS...</span>
          )}
        </div>

        {/* widgets row: weather + eco */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <WeatherWidget compact />
          <EcoScore compact />
        </div>

        {/* last transcript */}
        {lastTranscript && (
          <motion.div
            key={lastTranscript}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 max-w-xs text-center text-sm text-[var(--drivex-cyan)]/90 italic"
          >
            “{lastTranscript}”
          </motion.div>
        )}
      </div>

      {/* voice orb */}
      <div className="flex justify-center pb-2">
        <VoiceOrb size="lg" />
      </div>

      {/* quick actions row — big touch targets */}
      <div className="dx-safe-bottom px-4 pb-3 pt-2 grid grid-cols-4 gap-2.5">
        <BigAction
          icon={<HomeIcon className="w-6 h-6" />}
          label="المنزل"
          onClick={() => setView("map")}
        />
        <BigAction
          icon={<MapIcon className="w-6 h-6" />}
          label="الخريطة"
          onClick={() => setView("map")}
        />
        <BigAction
          icon={<Music className="w-6 h-6" />}
          label={mediaPlaying ? "إيقاف" : "موسيقى"}
          active={mediaPlaying}
          onClick={() => {
            setMediaPlaying(!mediaPlaying);
            setView("media");
          }}
        />
        <BigAction
          icon={<MessageSquare className="w-6 h-6" />}
          label="المساعد"
          onClick={() => setView("chat")}
        />
      </div>

      {/* TTS quick toggle (floating) */}
      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        className="absolute top-3 right-3 w-10 h-10 rounded-full grid place-items-center bg-black/50 border border-white/10 text-[var(--drivex-cyan)] hover:bg-[var(--drivex-cyan)]/10 transition-colors"
        aria-label={ttsEnabled ? "كتم الرد الصوتي" : "تفعيل الرد الصوتي"}
        title={ttsEnabled ? "الرد الصوتي مفعّل" : "الرد الصوتي معطّل"}
      >
        {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {driving && speed > 0 && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--drivex-cyan)]/15 border border-[var(--drivex-cyan)]/30 text-[10px] font-bold text-[var(--drivex-cyan)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--drivex-cyan)] dx-blink" />
          وضع القيادة
        </div>
      )}
    </div>
  );
}

function BigAction({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl border transition-colors
        ${active
          ? "bg-[var(--drivex-cyan)]/15 border-[var(--drivex-cyan)]/50 text-[var(--drivex-cyan)]"
          : "bg-[var(--drivex-panel)] border-white/5 text-[var(--drivex-cyan)] hover:border-[var(--drivex-cyan)]/30 hover:bg-[var(--drivex-cyan)]/5"}`}
    >
      {icon}
      <span className="text-xs font-medium text-foreground">{label}</span>
    </motion.button>
  );
}
