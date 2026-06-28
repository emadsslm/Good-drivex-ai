"use client";

import { useState } from "react";
import { Home, Volume2, Type, MapPin, X, Save, Info, Phone, Camera, Coffee, Video, ShieldAlert, Radio } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const homeAddress = useDriveX((s) => s.homeAddress);
  const setHomeAddress = useDriveX((s) => s.setHomeAddress);
  const voiceResponse = useDriveX((s) => s.voiceResponse);
  const setVoiceResponse = useDriveX((s) => s.setVoiceResponse);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const setTtsEnabled = useDriveX((s) => s.setTtsEnabled);
  const largeTextMode = useDriveX((s) => s.largeTextMode);
  const setLargeTextMode = useDriveX((s) => s.setLargeTextMode);
  const sosContacts = useDriveX((s) => s.sosContacts);
  const setSosContacts = useDriveX((s) => s.setSosContacts);
  const cameraAlertEnabled = useDriveX((s) => s.cameraAlertEnabled);
  const setCameraAlertEnabled = useDriveX((s) => s.setCameraAlertEnabled);
  const restReminderEnabled = useDriveX((s) => s.restReminderEnabled);
  const setRestReminderEnabled = useDriveX((s) => s.setRestReminderEnabled);
  const dashcamEnabled = useDriveX((s) => s.dashcamEnabled);
  const setDashcamEnabled = useDriveX((s) => s.setDashcamEnabled);
  const crashDetectionEnabled = useDriveX((s) => s.crashDetectionEnabled);
  const setCrashDetectionEnabled = useDriveX((s) => s.setCrashDetectionEnabled);
  const speedCameraAlertEnabled = useDriveX((s) => s.speedCameraAlertEnabled);
  const setSpeedCameraAlertEnabled = useDriveX((s) => s.setSpeedCameraAlertEnabled);

  const [addr, setAddr] = useState(homeAddress);
  const [sos, setSos] = useState(sosContacts);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setHomeAddress(addr.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const saveSos = () => {
    setSosContacts(sos.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--drivex-panel)] border border-white/10 rounded-t-3xl sm:rounded-3xl dx-safe-bottom max-h-[92vh] overflow-y-auto dx-scroll">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[var(--drivex-panel)]">
          <h2 className="text-base font-semibold">الإعدادات</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full grid place-items-center bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Home address */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 text-[var(--drivex-cyan)]" />
              <label className="text-sm font-medium">عنوان المنزل</label>
            </div>
            <div className="flex gap-2">
              <input
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="مثال: حي النخيل، الرياض"
                className="flex-1 h-11 rounded-xl bg-[var(--drivex-panel-2)] border border-white/10 px-3 text-sm outline-none focus:border-[var(--drivex-cyan)]/50"
              />
              <button
                onClick={save}
                className="shrink-0 h-11 px-4 rounded-xl bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black text-sm font-medium flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saved ? "تم" : "حفظ"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              يُستخدم عند قول "خذني إلى المنزل" لفتح الطريق على الخريطة.
            </p>
          </section>

          {/* SOS contact */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-red-400" />
              <label className="text-sm font-medium">جهة اتصال للطوارئ</label>
            </div>
            <div className="flex gap-2">
              <input
                value={sos}
                onChange={(e) => setSos(e.target.value)}
                placeholder="مثال: 0551234567"
                inputMode="tel"
                className="flex-1 h-11 rounded-xl bg-[var(--drivex-panel-2)] border border-white/10 px-3 text-sm outline-none focus:border-red-400/50"
              />
              <button
                onClick={saveSos}
                className="shrink-0 h-11 px-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm font-medium flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saved ? "تم" : "حفظ"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              رقم شخص تثق به. يظهر في زر SOS للاتصال السريع أو مشاركة موقعك.
            </p>
          </section>

          {/* Toggles */}
          <section className="space-y-3">
            <ToggleRow
              icon={<Volume2 className="w-4 h-4 text-[var(--drivex-cyan)]" />}
              title="الرد الصوتي"
              desc="ينطق المساعد ردوده بصوت مسموع بالعربية."
              checked={voiceResponse}
              onChange={setVoiceResponse}
            />
            <ToggleRow
              icon={<Volume2 className="w-4 h-4 text-[var(--drivex-cyan)]" />}
              title="نطق الردود (TTS)"
              desc="تفعيل نطق الردود عبر Web Speech API — عربي فقط."
              checked={ttsEnabled}
              onChange={setTtsEnabled}
            />
            <ToggleRow
              icon={<Camera className="w-4 h-4 text-[var(--drivex-cyan)]" />}
              title="كاشف المسافة الأمامية"
              desc="يستخدم الكاميرا الخلفية لتنبيهك عند اقتراب جسم."
              checked={cameraAlertEnabled}
              onChange={setCameraAlertEnabled}
            />
            <ToggleRow
              icon={<Coffee className="w-4 h-4 text-amber-400" />}
              title="تنبيه الاستراحة"
              desc="تذكير صوتي كل ساعتين لمحاربة النعاس."
              checked={restReminderEnabled}
              onChange={setRestReminderEnabled}
            />
            <ToggleRow
              icon={<Video className="w-4 h-4 text-[var(--drivex-cyan)]" />}
              title="كاميرا الطريق (Dashcam)"
              desc="تسجيل فيديو مستمر للطريق بحلقات 60 ثانية."
              checked={dashcamEnabled}
              onChange={setDashcamEnabled}
            />
            <ToggleRow
              icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
              title="كشف الحوادث التلقائي"
              desc="تنبيه SOS عند فرملة شديدة جدًا (كشف حادث محتمل)."
              checked={crashDetectionEnabled}
              onChange={setCrashDetectionEnabled}
            />
            <ToggleRow
              icon={<Radio className="w-4 h-4 text-amber-400" />}
              title="تنبيه رادارات السرعة"
              desc="تنبيه صوتي عند الاقتراب من رادار ثابت."
              checked={speedCameraAlertEnabled}
              onChange={setSpeedCameraAlertEnabled}
            />
            <ToggleRow
              icon={<Type className="w-4 h-4 text-[var(--drivex-cyan)]" />}
              title="نص كبير"
              desc="تكبير الخط أثناء القيادة لسهولة القراءة."
              checked={largeTextMode}
              onChange={setLargeTextMode}
            />
          </section>

          {/* Permissions helper */}
          <section className="rounded-2xl p-4 bg-[var(--drivex-panel-2)] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[var(--drivex-cyan)]" />
              <h3 className="text-sm font-medium">الأذونات المطلوبة</h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pr-4">
              <li><b>الموقع</b>: للخرائط وكشف السرعة وتفعيل وضع القيادة تلقائيًا.</li>
              <li><b>الميكروفون</b>: للأوامر الصوتية والتعرف على الكلام.</li>
              <li>الأفضل استخدام HTTPS وتثبيت التطبيق على الهاتف.</li>
            </ul>
          </section>

          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(() => {}, () => {});
              }
            }}
            className="w-full h-11 rounded-xl border border-[var(--drivex-cyan)]/30 text-[var(--drivex-cyan)] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[var(--drivex-cyan)]/10 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            طلب إذن الموقع
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3.5 bg-[var(--drivex-panel-2)] border border-white/5">
      <div className="w-9 h-9 rounded-xl grid place-items-center bg-white/5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-12 h-7 rounded-full transition-colors shrink-0",
          checked ? "bg-[var(--drivex-cyan)]" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
