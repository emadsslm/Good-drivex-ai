"use client";

import { useEffect, useRef } from "react";
import { useDriveX } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";

const REST_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const SOONER_REMINDER_MS = 5 * 60 * 1000; // remind again 5 min after dismiss

/**
 * useRestReminder — every 2 hours of continuous driving, fire a voice + visual
 * alert telling the driver to take a break (anti-drowsiness).
 */
export function useRestReminder() {
  const driving = useDriveX((s) => s.driving);
  const enabled = useDriveX((s) => s.restReminderEnabled);
  const triggered = useDriveX((s) => s.restReminderTriggered);
  const setTriggered = useDriveX((s) => s.setRestReminderTriggered);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const voiceResponse = useDriveX((s) => s.voiceResponse);
  const startRef = useRef<number>(0);
  const { speak } = useTTS();

  useEffect(() => {
    if (!driving || !enabled) return;
    startRef.current = Date.now();

    const check = () => {
      const elapsed = Date.now() - startRef.current;
      if (elapsed >= REST_INTERVAL_MS && !useDriveX.getState().restReminderTriggered) {
        setTriggered(true);
        if (voiceResponse && ttsEnabled) {
          speak(
            "لقد قمت بالقيادة لمدة ساعتين. يُنصح بأخذ استراحة قصيرة لتجنب التعب والنعاس. توقف في مكان آمن عند أول فرصة."
          );
        }
      }
    };

    const interval = setInterval(check, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [driving, enabled, setTriggered, speak, ttsEnabled, voiceResponse]);

  const dismiss = () => {
    // Allow re-trigger after SOONER_REMINDER_MS
    setTriggered(false);
    startRef.current = Date.now() - (REST_INTERVAL_MS - SOONER_REMINDER_MS);
  };

  return { triggered, dismiss };
}
