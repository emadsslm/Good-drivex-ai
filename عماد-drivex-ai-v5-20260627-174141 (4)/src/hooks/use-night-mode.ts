"use client";

import { useEffect } from "react";
import { useDriveX } from "@/lib/store";

/**
 * useNightMode — auto-detects night (after sunset / before sunrise) and
 * toggles a "night mode" flag that the UI can use for extra-dim styling.
 */
export function useNightMode() {
  const setNightMode = useDriveX((s) => s.setNightMode);

  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      // Night = 19:00 .. 05:00
      setNightMode(h >= 19 || h < 5);
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000); // recheck every 5 min
    return () => clearInterval(t);
  }, [setNightMode]);
}
