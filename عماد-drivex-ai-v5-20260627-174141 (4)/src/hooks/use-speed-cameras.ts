"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDriveX, haversineKm, type SpeedCamera } from "@/lib/store";
import { useTTS } from "@/hooks/use-speech";

const REFETCH_INTERVAL = 5 * 60 * 1000; // refresh cameras every 5 min
const ALERT_DISTANCE_M = 700; // alert when within 700m of a camera

/**
 * useSpeedCameras — fetches fixed speed cameras near the current location and
 * fires a voice alert when approaching one.
 */
export function useSpeedCameras() {
  const coords = useDriveX((s) => s.coords);
  const driving = useDriveX((s) => s.driving);
  const enabled = useDriveX((s) => s.speedCameraAlertEnabled);
  const setCameras = useDriveX((s) => s.setSpeedCameras);
  const alerted = useDriveX((s) => s.speedCamerasAlerted);
  const setAlerted = useDriveX((s) => s.setSpeedCamerasAlerted);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const voiceResponse = useDriveX((s) => s.voiceResponse);
  const lastFetchRef = useRef(0);
  const lastAlertRef = useRef<Record<string, number>>({});
  const { speak } = useTTS();

  const fetchCameras = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `/api/speed-cameras?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&radius=5000`
        );
        const data = await res.json();
        if (data?.ok && Array.isArray(data.cameras)) {
          setCameras(data.cameras as SpeedCamera[]);
        }
      } catch {
        /* silent */
      }
    },
    [setCameras]
  );

  // Fetch cameras when coords change (throttled).
  useEffect(() => {
    if (!coords) return;
    const now = Date.now();
    if (now - lastFetchRef.current < REFETCH_INTERVAL) return;
    lastFetchRef.current = now;
    fetchCameras(coords.lat, coords.lng);
  }, [coords, fetchCameras]);

  // Check proximity while driving.
  useEffect(() => {
    if (!driving || !enabled || !coords) return;
    const cameras = useDriveX.getState().speedCameras;
    for (const cam of cameras) {
      if (cam.distance <= ALERT_DISTANCE_M) {
        const lastTs = lastAlertRef.current[cam.id] || 0;
        if (Date.now() - lastTs > 90000) {
          // 90s cooldown per camera
          lastAlertRef.current[cam.id] = Date.now();
          if (!alerted.includes(cam.id)) {
            setAlerted([...alerted, cam.id]);
          }
          if (voiceResponse && ttsEnabled) {
            const limit = cam.maxSpeed ? ` الحد الأقصى ${cam.maxSpeed} كم في الساعة.` : "";
            speak(`تنبيه: رادار سرعة خلال ${Math.round(cam.distance / 100) * 100} متر.${limit}`);
          }
          break; // one alert at a time
        }
      }
    }
  }, [coords, driving, enabled, alerted, setAlerted, speak, ttsEnabled, voiceResponse]);
}
