"use client";

import { useEffect } from "react";
import { useDriveX, haversineKm, type FrequentRoute } from "@/lib/store";

/**
 * useFrequentRoutes — when a trip ends, records/updates a frequent route based
 * on start → end coordinates. Also detects the most likely current route when
 * driving starts to suggest it.
 */
export function useFrequentRoutes() {
  const trips = useDriveX((s) => s.trips);
  const addOrUpdate = useDriveX((s) => s.addFrequentRouteOrUpdate);

  // When a new trip is added (first in list), learn the route.
  useEffect(() => {
    if (trips.length === 0) return;
    const latest = trips[0];
    if (!latest.startCoords || !latest.endCoords) return;
    // Only learn routes that have meaningful distance (> 0.5 km).
    if (latest.distanceKm < 0.5) return;

    // Avoid re-adding the same trip on every render: check lastUsed.
    const routes = useDriveX.getState().frequentRoutes;
    const exists = routes.some(
      (r) => Math.abs(r.lastUsed - latest.endTime) < 5000
    );
    if (exists) return;

    const label = guessRouteLabel(latest.startCoords, latest.endCoords);
    const route: FrequentRoute = {
      id: `route-${latest.id}`,
      label,
      startCoords: latest.startCoords,
      endCoords: latest.endCoords,
      tripCount: 1,
      avgDurationMin: latest.durationMin,
      lastUsed: latest.endTime,
    };
    addOrUpdate(route);
  }, [trips, addOrUpdate]);
}

function guessRouteLabel(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): string {
  // Simple heuristic label based on direction + distance.
  const km = haversineKm(start.lat, start.lng, end.lat, end.lng);
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  let dir = "";
  if (Math.abs(dLat) > Math.abs(dLng)) {
    dir = dLat > 0 ? "شمالًا" : "جنوبًا";
  } else {
    dir = dLng > 0 ? "شرقًا" : "غربًا";
  }
  if (km < 3) return `رحلة قصيرة ${dir}`;
  if (km < 15) return `رحلة متوسطة ${dir}`;
  return `رحلة طويلة ${dir} (${Math.round(km)} كم)`;
}
