"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Power,
  Settings as SettingsIcon,
  Mic,
  Map as MapIcon,
  Music,
  Navigation,
  ShieldCheck,
  Sparkles,
  Wifi,
  WifiOff,
  AlertTriangle,
  MessageSquare,
  Phone,
} from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useDriveXAssistant } from "@/hooks/use-assistant";
import { SpeedGauge } from "./SpeedGauge";
import { cn } from "@/lib/utils";

export function HomeScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const startDriving = useDriveX((s) => s.startDriving);
  const setView = useDriveX((s) => s.setView);
  const speed = useDriveX((s) => s.speedKmh);
  const coords = useDriveX((s) => s.coords);
  const locationError = useDriveX((s) => s.locationError);
  const autoDriveDetected = useDriveX((s) => s.autoDriveDetected);
  const { speechSupported } = useDriveXAssistant();

  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe clock initialization
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  const gpsOk = !!coords && !locationError;

  return (
    <div className="relative flex-1 flex flex-col dx-grid-bg">
      {/* hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* logo mark */}
          <div className="relative w-24 h-24 mb-5 grid place-items-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--drivex-cyan)]/30 to-[var(--drivex-blue)]/10 blur-xl" />
            <div className="relative w-20 h-20 rounded-full border-2 border-[var(--drivex-cyan)]/40 grid place-items-center bg-[var(--drivex-panel)]">
              <Navigation className="w-9 h-9 text-[var(--drivex-cyan)] dx-text-glow" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Drive<span className="text-[var(--drivex-cyan)] dx-text-glow">X</span> AI
          </h1>
          <p className="text-[11px] mt-1 px-2 py-0.5 rounded-full bg-[var(--drivex-cyan)]/10 border border-[var(--drivex-cyan)]/30 text-[var(--drivex-cyan)] inline-block">
            V5 — Universal AI Companion
          </p>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
            رفيقك الذكي — تحدّث، اسأل، تعلّم، صمّم، برمج، وابدع في أي موضوع. مع محادثة صوتية مستمرة.
          </p>
        </motion.div>

        {/* status chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Chip ok={gpsOk} icon={gpsOk ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} label={gpsOk ? "GPS جاهز" : "GPS غير مفعّل"} />
          <Chip ok={speechSupported} icon={<Mic className="w-3.5 h-3.5" />} label={speechSupported ? "الصوت جاهز" : "الصوت غير مدعوم"} />
          <Chip ok={autoDriveDetected} icon={<Sparkles className="w-3.5 h-3.5" />} label={autoDriveDetected ? "تم كشف قيادة" : "وضع الانتظار"} />
        </div>

        {locationError && (
          <div className="mt-4 max-w-sm rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{locationError}</span>
          </div>
        )}

        {/* mini speed */}
        <div className="mt-8">
          <SpeedGauge compact />
        </div>

        {/* START button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={startDriving}
          className="mt-10 relative w-44 h-44 rounded-full grid place-items-center bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black font-bold dx-glow active:scale-95 transition-transform"
          aria-label="ابدأ القيادة"
        >
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[var(--drivex-cyan)]/50"
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col items-center">
            <Power className="w-10 h-10 mb-1" />
            <span className="text-lg">ابدأ القيادة</span>
            <span className="text-[10px] font-medium opacity-70 mt-0.5">START DRIVING</span>
          </div>
        </motion.button>

        <p className="mt-4 text-[11px] text-muted-foreground/80 text-center max-w-xs">
          سيتم تفعيل وضع القيادة تلقائيًا عند تجاوز سرعتك 15 كم/س.
        </p>
      </div>

      {/* AI companion entry — prominent */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setView("chat")}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[var(--drivex-cyan)]/15 to-[var(--drivex-blue)]/10 border border-[var(--drivex-cyan)]/40 hover:from-[var(--drivex-cyan)]/25 hover:to-[var(--drivex-blue)]/20 transition-colors"
        >
          <span className="shrink-0 grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div className="flex-1 text-right">
            <div className="text-sm font-semibold text-foreground">DriveX AI Companion</div>
            <div className="text-[11px] text-muted-foreground">محادثة صوتية مستمرة — أي موضوع</div>
          </div>
          <Phone className="w-4 h-4 text-[var(--drivex-cyan)]" />
        </button>
      </div>

      {/* quick actions */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2.5">
        <QuickAction
          icon={<MapIcon className="w-5 h-5" />}
          label="الخريطة"
          onClick={() => setView("map")}
        />
        <QuickAction
          icon={<Music className="w-5 h-5" />}
          label="الترفيه"
          onClick={() => setView("media")}
        />
        <QuickAction
          icon={<SettingsIcon className="w-5 h-5" />}
          label="الإعدادات"
          onClick={onOpenSettings}
        />
      </div>

      {/* safety footer */}
      <div className="dx-safe-bottom px-4 pb-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--drivex-cyan)]/70" />
        <span>قيادة آمنة أولًا — لا تنشغل عن الطريق.</span>
      </div>
    </div>
  );
}

function Chip({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
        ok
          ? "bg-[var(--drivex-cyan)]/10 border-[var(--drivex-cyan)]/30 text-[var(--drivex-cyan)]"
          : "bg-white/5 border-white/10 text-muted-foreground"
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl bg-[var(--drivex-panel)] border border-white/5 hover:border-[var(--drivex-cyan)]/30 hover:bg-[var(--drivex-cyan)]/5 transition-colors text-[var(--drivex-cyan)]"
    >
      {icon}
      <span className="text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}
