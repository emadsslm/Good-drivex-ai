"use client";

import { useEffect } from "react";
import { useDriveX } from "@/lib/store";

/**
 * useTripTracker — starts/stops a trip automatically when driving mode
 * toggles, and records speed samples for stats + eco score.
 */
export function useTripTracker() {
  const driving = useDriveX((s) => s.driving);
  const startTrip = useDriveX((s) => s.startTrip);
  const recordSpeedSample = useDriveX((s) => s.recordSpeedSample);

  // Start / stop trip on driving toggle.
  useEffect(() => {
    if (driving) {
      startTrip();
    }
    // Cleanup on unmount / stop handled in store.stopDriving.
  }, [driving]);

  // Sample speed every 3s while driving.
  useEffect(() => {
    if (!driving) return;
    const t = setInterval(() => {
      recordSpeedSample(useDriveX.getState().speedKmh);
    }, 3000);
    return () => clearInterval(t);
  }, [driving, recordSpeedSample]);
}
