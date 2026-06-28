"use client";

import {
  Music, Camera, Settings as SettingsIcon, Coffee, CloudSun,
  Siren, Route, Map as MapIcon, MessageSquare, Home as HomeIcon, Sparkles, ShieldCheck,
  Video, ShieldAlert, Car, Radio, Brain, Search, Navigation,
} from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";
import { ParkingReminder } from "./ParkingReminder";
import { LiveTripSharing } from "./LiveTripSharing";
import { AICoach } from "./AICoach";
import { POIFinder } from "./POIFinder";
import { FrequentRoutes } from "./FrequentRoutes";

type Tile = {
  view: "home" | "chat" | "map" | "media" | "trips" | "settings";
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
};

const TILES: Tile[] = [
  { view: "media", label: "الترفيه", desc: "راديو وموسيقى", icon: <Music className="w-5 h-5" />, color: "text-[var(--drivex-cyan)]" },
  { view: "trips", label: "سجل الرحلات", desc: "إحصائيات وبيانات", icon: <Route className="w-5 h-5" />, color: "text-emerald-400" },
  { view: "settings", label: "الإعدادات", desc: "تخصيص التطبيق", icon: <SettingsIcon className="w-5 h-5" />, color: "text-amber-400" },
];

export function MoreMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const setView = useDriveX((s) => s.setView);
  const cameraAlertEnabled = useDriveX((s) => s.cameraAlertEnabled);
  const setCameraAlertEnabled = useDriveX((s) => s.setCameraAlertEnabled);
  const restReminderEnabled = useDriveX((s) => s.restReminderEnabled);
  const setRestReminderEnabled = useDriveX((s) => s.setRestReminderEnabled);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const setTtsEnabled = useDriveX((s) => s.setTtsEnabled);
  const nightMode = useDriveX((s) => s.nightMode);
  // V3 state
  const dashcamEnabled = useDriveX((s) => s.dashcamEnabled);
  const setDashcamEnabled = useDriveX((s) => s.setDashcamEnabled);
  const crashDetectionEnabled = useDriveX((s) => s.crashDetectionEnabled);
  const setCrashDetectionEnabled = useDriveX((s) => s.setCrashDetectionEnabled);
  const speedCameraAlertEnabled = useDriveX((s) => s.speedCameraAlertEnabled);
  const setSpeedCameraAlertEnabled = useDriveX((s) => s.setSpeedCameraAlertEnabled);
  const { speak } = useTTS();

  const toggleCamera = () => {
    const next = !cameraAlertEnabled;
    setCameraAlertEnabled(next);
    if (next && ttsEnabled) speak("تم تفعيل كاشف المسافة الأمامية بالكاميرا.");
  };

  const toggleRest = () => {
    setRestReminderEnabled(!restReminderEnabled);
    if (ttsEnabled) speak(restReminderEnabled ? "تم إيقاف تنبيه الاستراحة." : "تم تفعيل تنبيه الاستراحة كل ساعتين.");
  };

  const toggleDashcam = () => {
    const next = !dashcamEnabled;
    setDashcamEnabled(next);
    if (ttsEnabled) speak(next ? "تم تفعيل كاميرا الطريق." : "تم إيقاف كاميرا الطريق.");
  };

  const toggleCrash = () => {
    setCrashDetectionEnabled(!crashDetectionEnabled);
    if (ttsEnabled) speak(crashDetectionEnabled ? "تم إيقاف كشف الحوادث." : "تم تفعيل كشف الحوادث التلقائي.");
  };

  const toggleSpeedCam = () => {
    setSpeedCameraAlertEnabled(!speedCameraAlertEnabled);
    if (ttsEnabled) speak(speedCameraAlertEnabled ? "تم إيقاف تنبيه الرادارات." : "تم تفعيل تنبيه رادارات السرعة.");
  };

  return (
    <div className="flex flex-col h-full dx-scroll overflow-y-auto">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--drivex-cyan)]" />
        <h2 className="text-base font-semibold">المزيد من الميزات</h2>
      </div>

      {/* Quick toggles */}
      <div className="px-4 mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">الميزات الذكية</div>
        <div className="space-y-2">
          <FeatureToggle
            icon={<Camera className="w-5 h-5" />}
            color="text-[var(--drivex-cyan)]"
            title="كاشف المسافة الأمامية"
            desc="تنبيه عند اقتراب جسم أمامي بالكاميرا"
            checked={cameraAlertEnabled}
            onChange={toggleCamera}
          />
          <FeatureToggle
            icon={<Coffee className="w-5 h-5" />}
            color="text-amber-400"
            title="تنبيه الاستراحة"
            desc="تذكير كل ساعتين لمحاربة النعاس"
            checked={restReminderEnabled}
            onChange={toggleRest}
          />
          <FeatureToggle
            icon={<CloudSun className="w-5 h-5" />}
            color="text-emerald-400"
            title="الرد الصوتي بالعربية"
            desc="المساعد ينطق ردوده بالعربية فقط"
            checked={ttsEnabled}
            onChange={() => setTtsEnabled(!ttsEnabled)}
          />
        </div>
      </div>

      {/* V3 Advanced toggles */}
      <div className="px-4 mb-4">
        <div className="text-xs uppercase tracking-widest text-[var(--drivex-cyan)]/70 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> الميزات المتقدمة
        </div>
        <div className="space-y-2">
          <FeatureToggle
            icon={<Video className="w-5 h-5" />}
            color="text-[var(--drivex-cyan)]"
            title="كاميرا الطريق (Dashcam)"
            desc="تسجيل فيديو مستمر للطريق بحلقات 60 ثانية"
            checked={dashcamEnabled}
            onChange={toggleDashcam}
          />
          <FeatureToggle
            icon={<ShieldAlert className="w-5 h-5" />}
            color="text-red-400"
            title="كشف الحوادث التلقائي"
            desc="تنبيه SOS عند فرملة شديدة جدًا"
            checked={crashDetectionEnabled}
            onChange={toggleCrash}
          />
          <FeatureToggle
            icon={<Radio className="w-5 h-5" />}
            color="text-amber-400"
            title="تنبيه رادارات السرعة"
            desc="تنبيه صوتي عند الاقتراب من رادار"
            checked={speedCameraAlertEnabled}
            onChange={toggleSpeedCam}
          />
        </div>
      </div>

      {/* V3 Smart tools */}
      <div className="px-4 mb-4 space-y-2.5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">أدوات ذكية</div>
        <ParkingReminder />
        <LiveTripSharing />
        <POIFinder />
        <FrequentRoutes />
        <AICoach />
      </div>

      {/* Navigation tiles */}
      <div className="px-4 mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">الأقسام</div>
        <div className="grid grid-cols-3 gap-2.5">
          {TILES.map((t) => (
            <button
              key={t.view}
              onClick={() => (t.view === "settings" ? onOpenSettings() : setView(t.view))}
              className="flex flex-col items-center justify-center gap-1.5 h-24 rounded-2xl bg-[var(--drivex-panel)] border border-white/5 hover:border-[var(--drivex-cyan)]/30 hover:bg-[var(--drivex-cyan)]/5 transition-colors"
            >
              <span className={t.color}>{t.icon}</span>
              <div className="text-xs font-medium">{t.label}</div>
              <div className="text-[9px] text-muted-foreground text-center px-1">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pro features badges */}
      <div className="px-4 mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">مميزات احترافية مفعّلة</div>
        <div className="grid grid-cols-2 gap-2">
          <ProBadge icon={<MapPin />} label="خرائط حية" />
          <ProBadge icon={<MessageSquare />} label="مساعد ذكي" />
          <ProBadge icon={<Siren />} label="زر طوارئ SOS" />
          <ProBadge icon={<CloudSun />} label="حالة الطقس" />
          <ProBadge icon={<Route />} label="سجل الرحلات" />
          <ProBadge icon={<Coffee />} label="تنبيه النعاس" />
          <ProBadge icon={<Camera />} label="كاشف المسافة" />
          <ProBadge icon={<ShieldCheck />} label="قيادة اقتصادية" />
        </div>
      </div>

      <div className="px-4 pb-6 mt-auto pt-4 text-center">
        <div className="text-[11px] text-muted-foreground/70">
          DriveX AI — مساعد القيادة الذكي
        </div>
        <div className="text-[10px] text-muted-foreground/50 mt-1">
          النسخة الاحترافية • {nightMode ? "الوضع الليلي مفعّل" : "الوضع النهاري"}
        </div>
      </div>
    </div>
  );
}

function FeatureToggle({
  icon, color, title, desc, checked, onChange,
}: {
  icon: React.ReactNode; color: string; title: string; desc: string;
  checked: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3.5 bg-[var(--drivex-panel)] border border-white/5">
      <div className={`w-10 h-10 rounded-xl grid place-items-center bg-white/5 shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? "bg-[var(--drivex-cyan)]" : "bg-white/15"}`}
      >
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function ProBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl p-2.5 bg-white/5 border border-white/5">
      <span className="text-[var(--drivex-cyan)] [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

// Local import to avoid extra dependency noise.
import { MapPin } from "lucide-react";
