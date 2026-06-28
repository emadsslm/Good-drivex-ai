"use client";

import { useCallback, useEffect } from "react";
import { useDriveX, type WeatherData } from "@/lib/store";

/**
 * useWeather — fetches weather for the current coords (via /api/weather).
 * Refreshes every 30 minutes while coords are available.
 */
export function useWeather() {
  const coords = useDriveX((s) => s.coords);
  const setWeather = useDriveX((s) => s.setWeather);
  const weather = useDriveX((s) => s.weather);

  const fetchWeather = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `/api/weather?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`
        );
        const data = await res.json();
        if (data?.ok && data.weather) {
          setWeather(data.weather as WeatherData);
        }
      } catch {
        /* silent fail — weather is non-critical */
      }
    },
    [setWeather]
  );

  useEffect(() => {
    if (!coords) return;
    // Throttle: refetch at most every 30 min.
    if (weather && Date.now() - weather.fetchedAt < 30 * 60 * 1000) return;
    fetchWeather(coords.lat, coords.lng);
  }, [coords, weather, fetchWeather]);

  return { weather, refresh: () => coords && fetchWeather(coords.lat, coords.lng) };
}
