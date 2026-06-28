"use client";

import { useEffect, useRef } from "react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";

// Threshold: deceleration in km/h per second. > 25 km/h/s = likely harsh braking
// or collision. (e.g. 80→0 in 2s = 40 km/h/s)
const CRASH_DECLINE_THRESHOLD = 25; // km/h per second

/**
 * useCrashDetection — monitors GPS speed for sudden deceleration indicating a
 * possible crash. Triggers a 30s countdown; if not dismissed, fires SOS.
 */
export function useCrashDetection(onTrigger: () => void) {
  const driving = useDriveX((s) => s.driving);
  const speed = useDriveX((s) => s.speedKmh);
  const enabled = useDriveX((s) => s.crashDetectionEnabled);
  const countdown = useDriveX((s) => s.crashCountdown);
  const setCountdown = useDriveX((s) => s.setCrashCountdown);
  const setDeclineRate = useDriveX((s) => s.setCrashDeclineRate);
  const prevSpeedRef = useRef<number>(0);
  const prevTsRef = useRef<number>(0);
  const lastTriggerRef = useRef<number>(0);
  const { speak } = useTTS();

  // Monitor speed for sudden deceleration.
  useEffect(() => {
    if (!driving || !enabled || countdown !== null) return;

    const now = Date.now();
    const prevSpeed = prevSpeedRef.current;
    const prevTs = prevTsRef.current;

    if (prevTs > 0 && now - prevTs < 5000) {
      const dtSec = (now - prevTs) / 1000;
      if (dtSec > 0.3) {
        const decline = (prevSpeed - speed) / dtSec; // km/h per second (positive = braking)
        setDeclineRate(Math.max(0, Math.round(decline)));

        // Only trigger on strong deceleration from a meaningful speed.
        if (
          decline >= CRASH_DECLINE_THRESHOLD &&
          prevSpeed >= 30 &&
          now - lastTriggerRef.current > 60000 // at most once per minute
        ) {
          lastTriggerRef.current = now;
          setCountdown(30);
          speak(
            "تم كشف فرملة شديدة. إذا كنت بخير، ألغِ التنبيه خلال 30 ثانية، وإلا سيتم إرسال طلب مساعدة تلقائيًا."
          );
          onTrigger();
        }
      }
    }

    prevSpeedRef.current = speed;
    prevTsRef.current = now;
  }, [speed, driving, enabled, countdown, setCountdown, setDeclineRate, speak, onTrigger]);

  // Countdown timer.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      // Countdown reached zero → trigger SOS (handled by component via onTrigger).
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, setCountdown]);

  const dismiss = () => {
    setCountdown(null);
    speak("تم إلغاء التنبيه. استمر بقيادة آمنة.");
  };

  return { countdown, dismiss };
}
