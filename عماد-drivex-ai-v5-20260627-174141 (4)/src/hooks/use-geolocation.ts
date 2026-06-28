"use client";

import { useEffect, useRef } from "react";
import { useDriveX } from "@/lib/store";

type GeoWatchHandle = number | null;

/**
 * useGeolocation — watches device position, computes GPS speed (km/h),
 * heading and accuracy. Auto-enables "driving" when speed > threshold.
 */
export function useGeolocation(autoDriveThreshold = 15) {
  const setSpeed = useDriveX((s) => s.setSpeed);
  const setHeading = useDriveX((s) => s.setHeading);
  const setCoords = useDriveX((s) => s.setCoords);
  const setAccuracy = useDriveX((s) => s.setAccuracy);
  const setLocationError = useDriveX((s) => s.setLocationError);
  const setAutoDriveDetected = useDriveX((s) => s.setAutoDriveDetected);
  const handleRef = useRef<GeoWatchHandle>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setLocationError(null);
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setAccuracy(pos.coords.accuracy ?? null);

      // Speed from GPS is in m/s; convert to km/h. Many browsers report null,
      // so we fall back to 0 (UI shows "—").
      const ms = pos.coords.speed;
      if (ms != null && !Number.isNaN(ms)) {
        const kmh = Math.max(0, Math.round(ms * 3.6));
        setSpeed(kmh);
        setAutoDriveDetected(kmh >= autoDriveThreshold);
      } else {
        // No GPS speed available — keep last value, don't force driving.
        setSpeed(0);
      }
      if (pos.coords.heading != null && !Number.isNaN(pos.coords.heading)) {
        setHeading(pos.coords.heading);
      }
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setLocationError("تم رفض إذن الموقع. فعّله من إعدادات المتصفح لاستخدام الخرائط وكشف السرعة.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setLocationError("تعذّر تحديد الموقع حاليًا.");
      } else {
        setLocationError("انتهت مهلة تحديد الموقع.");
      }
    };

    handleRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000,
    });

    return () => {
      if (handleRef.current != null) {
        navigator.geolocation.clearWatch(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [autoDriveThreshold]);
}
