"use client";

import { useEffect, useRef } from "react";
import { useDriveX } from "@/lib/store";

type LeafletModule = typeof import("leaflet");

/**
 * MapsView — OpenStreetMap (CartoDB dark tiles) rendered via Leaflet.
 * Shows current location marker and follows the device.
 *
 * Leaflet accesses `window` at import time, so we load it dynamically on the
 * client only (avoids `window is not defined` during SSR).
 */
export function MapsView({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<ReturnType<LeafletModule["map"]> | null>(null);
  const markerRef = useRef<ReturnType<LeafletModule["circleMarker"]> | null>(null);
  const accuracyRef = useRef<ReturnType<LeafletModule["circle"]> | null>(null);
  const coords = useDriveX((s) => s.coords);
  const accuracy = useDriveX((s) => s.accuracy);
  const heading = useDriveX((s) => s.heading);

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    let map: ReturnType<LeafletModule["map"]> | null = null;
    let onResize: (() => void) | null = null;

    const init = async () => {
      if (!containerRef.current) return;
      // CSS first (idempotent in dev).
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [24.7136, 46.6753], // default center (Riyadh) until GPS locks
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // accuracy circle
      accuracyRef.current = L.circle([24.7136, 46.6753], {
        radius: 30,
        color: "#38e1ff",
        weight: 1,
        fillColor: "#1ea7ff",
        fillOpacity: 0.12,
      }).addTo(map);

      // position marker
      markerRef.current = L.circleMarker([24.7136, 46.6753], {
        radius: 9,
        color: "#38e1ff",
        weight: 3,
        fillColor: "#1ea7ff",
        fillOpacity: 1,
      }).addTo(map);

      // Fix sizing after mount
      setTimeout(() => map?.invalidateSize(), 200);

      onResize = () => map?.invalidateSize();
      window.addEventListener("resize", onResize);
    };

    init();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      try {
        map?.remove();
      } catch {
        /* noop */
      }
      mapRef.current = null;
      markerRef.current = null;
      accuracyRef.current = null;
    };
  }, []);

  // Update marker + view when coords change.
  useEffect(() => {
    if (!coords || !mapRef.current || !markerRef.current) return;
    const latlng: [number, number] = [coords.lat, coords.lng];
    markerRef.current.setLatLng(latlng);
    if (accuracyRef.current) {
      accuracyRef.current.setLatLng(latlng);
      accuracyRef.current.setRadius(accuracy ?? 25);
    }
    mapRef.current.panTo(latlng, { animate: true, duration: 0.6 });
  }, [coords, accuracy, heading]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label="خريطة الموقع الحالي"
    />
  );
}
