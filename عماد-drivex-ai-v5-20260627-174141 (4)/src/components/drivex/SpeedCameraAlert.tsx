"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Camera, Gauge } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useSpeedCameras } from "@/hooks/use-speed-cameras";

/**
 * SpeedCameraAlert — shows a transient toast when approaching a speed camera.
 * Also exposes nothing else; the hook handles the fetching + voice alerts.
 */
export function SpeedCameraAlert() {
  useSpeedCameras();
  const cameras = useDriveX((s) => s.speedCameras);
  const enabled = useDriveX((s) => s.speedCameraAlertEnabled);
  const driving = useDriveX((s) => s.driving);

  if (!enabled || !driving) return null;

  // Find the nearest camera within 1km for a persistent badge.
  const nearest = cameras.find((c) => c.distance <= 1000);

  return (
    <AnimatePresence>
      {nearest && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 backdrop-blur-md">
            <Camera className="w-4 h-4 text-amber-400 dx-blink" />
            <span className="text-xs font-bold text-amber-300">
              رادار سرعة
            </span>
            <span className="text-xs text-amber-200/80">
              {nearest.distance < 1000 ? `${nearest.distance} م` : `${(nearest.distance / 1000).toFixed(1)} كم`}
            </span>
            {nearest.maxSpeed && (
              <span className="flex items-center gap-1 text-xs text-amber-300 border-l border-amber-500/30 pl-2 ml-1">
                <Gauge className="w-3 h-3" /> {nearest.maxSpeed}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
