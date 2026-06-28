import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DxView =
  | "home"
  | "drive"
  | "chat"
  | "map"
  | "media"
  | "trips"
  | "more"
  | "settings";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

// V5 — long-term memory: user profile the AI companion remembers across sessions.
export type UserProfile = {
  name: string;
  interests: string;
  goals: string;
  notes: string;
};

export type VoiceIntent =
  | "navigate_home"
  | "navigate_to"
  | "open_maps"
  | "play_music"
  | "stop_music"
  | "distance"
  | "speed"
  | "time"
  | "weather"
  | "call"
  | "help"
  | "exit_drive"
  | "unknown";

export type Trip = {
  id: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  maxSpeed: number;
  avgSpeed: number;
  durationMin: number;
  startCoords: { lat: number; lng: number } | null;
  endCoords: { lat: number; lng: number } | null;
  ecoScore: number;
};

export type WeatherData = {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  fetchedAt: number;
};

// === V3 Advanced feature types ===

export type DashcamClip = {
  id: string;
  blob: string; // object URL or base64 — we store as data URL for persistence-free preview
  ts: number;
  durationSec: number;
  trigger: "auto" | "manual" | "crash";
  coords: { lat: number; lng: number } | null;
};

export type ParkingSpot = {
  ts: number;
  coords: { lat: number; lng: number };
  photo: string | null; // data URL thumbnail
  note: string;
};

export type SpeedCamera = {
  id: string;
  lat: number;
  lng: number;
  maxSpeed: number | null;
  direction: string | null;
  distance: number; // meters from current pos
};

export type POI = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
};

export type FrequentRoute = {
  id: string;
  label: string;
  startCoords: { lat: number; lng: number };
  endCoords: { lat: number; lng: number };
  tripCount: number;
  avgDurationMin: number;
  lastUsed: number;
};

export type LiveTripState = {
  sharing: boolean;
  tripCode: string;
  viewers: number;
};

type DxState = {
  // Driving state
  view: DxView;
  driving: boolean;
  autoDriveDetected: boolean;
  speedKmh: number;
  speedLimit: number;
  heading: number;
  coords: { lat: number; lng: number } | null;
  accuracy: number | null;
  locationError: string | null;

  // Voice
  listening: boolean;
  lastTranscript: string;
  ttsEnabled: boolean;

  // Chat
  messages: ChatMessage[];

  // Media
  mediaPlaying: boolean;
  mediaStation: string;

  // Settings
  homeAddress: string;
  voiceResponse: boolean;
  largeTextMode: boolean;

  // V5 — user profile (long-term memory for the AI companion)
  userProfile: UserProfile;
  // V5 — continuous voice conversation mode flag (ephemeral, not persisted)
  voiceConvActive: boolean;

  // === NEW: Pro features ===
  // Trip tracking
  trips: Trip[];
  currentTrip: {
    startTime: number;
    distanceKm: number;
    maxSpeed: number;
    speedSum: number;
    speedSamples: number;
    startCoords: { lat: number; lng: number } | null;
    lastCoords: { lat: number; lng: number } | null;
    ecoEvents: number; // harsh events count
  } | null;

  // Weather
  weather: WeatherData | null;

  // Eco score (live, 0-100)
  ecoScore: number;

  // Rest reminder
  restReminderEnabled: boolean;
  restReminderTriggered: boolean; // shown this driving session

  // Camera collision alert
  cameraAlertEnabled: boolean;

  // Night mode (auto by time)
  nightMode: boolean;

  // SOS
  sosContacts: string;

  // === V3 Advanced state ===
  // Dashcam
  dashcamEnabled: boolean;
  dashcamRecording: boolean;
  dashcamClips: DashcamClip[];

  // Crash detection
  crashDetectionEnabled: boolean;
  crashCountdown: number | null; // seconds left, null = inactive
  crashDeclineRate: number; // last computed deceleration km/h/s

  // Parking
  parkingSpot: ParkingSpot | null;

  // Speed cameras
  speedCameras: SpeedCamera[];
  speedCamerasAlerted: string[];
  speedCameraAlertEnabled: boolean;

  // Live trip sharing
  liveTrip: LiveTripState;

  // Frequent routes
  frequentRoutes: FrequentRoute[];

  // POI search
  poiResults: POI[];
  poiLoading: boolean;

  // actions
  setView: (v: DxView) => void;
  startDriving: () => void;
  stopDriving: () => void;
  setAutoDriveDetected: (v: boolean) => void;
  setSpeed: (kmh: number) => void;
  setHeading: (deg: number) => void;
  setCoords: (c: { lat: number; lng: number } | null) => void;
  setAccuracy: (a: number | null) => void;
  setLocationError: (e: string | null) => void;
  setListening: (v: boolean) => void;
  setLastTranscript: (t: string) => void;
  addMessage: (m: ChatMessage) => void;
  clearMessages: () => void;
  setMediaPlaying: (v: boolean) => void;
  setMediaStation: (s: string) => void;
  setHomeAddress: (s: string) => void;
  setTtsEnabled: (v: boolean) => void;
  setVoiceResponse: (v: boolean) => void;
  setLargeTextMode: (v: boolean) => void;
  // V5 actions
  setUserProfile: (p: Partial<UserProfile>) => void;
  setVoiceConvActive: (v: boolean) => void;

  // NEW actions
  startTrip: () => void;
  endTrip: () => void;
  updateTripDistance: (km: number) => void;
  recordSpeedSample: (kmh: number) => void;
  recordHarshEvent: () => void;
  setWeather: (w: WeatherData | null) => void;
  setEcoScore: (s: number) => void;
  setRestReminderEnabled: (v: boolean) => void;
  setRestReminderTriggered: (v: boolean) => void;
  setCameraAlertEnabled: (v: boolean) => void;
  setNightMode: (v: boolean) => void;
  setSosContacts: (s: string) => void;
  deleteTrip: (id: string) => void;
  clearTrips: () => void;

  // V3 actions
  setDashcamEnabled: (v: boolean) => void;
  setDashcamRecording: (v: boolean) => void;
  addDashcamClip: (c: DashcamClip) => void;
  deleteDashcamClip: (id: string) => void;
  clearDashcamClips: () => void;

  setCrashDetectionEnabled: (v: boolean) => void;
  setCrashCountdown: (s: number | null) => void;
  setCrashDeclineRate: (r: number) => void;

  setParkingSpot: (s: ParkingSpot | null) => void;

  setSpeedCameras: (c: SpeedCamera[]) => void;
  setSpeedCamerasAlerted: (ids: string[]) => void;
  setSpeedCameraAlertEnabled: (v: boolean) => void;

  setLiveTrip: (s: Partial<LiveTripState>) => void;

  setFrequentRoutes: (r: FrequentRoute[]) => void;
  addFrequentRouteOrUpdate: (r: FrequentRoute) => void;

  setPoiResults: (p: POI[]) => void;
  setPoiLoading: (v: boolean) => void;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useDriveX = create<DxState>()(
  persist(
    (set, get) => ({
      view: "home",
      driving: false,
      autoDriveDetected: false,
      speedKmh: 0,
      speedLimit: 0,
      heading: 0,
      coords: null,
      accuracy: null,
      locationError: null,

      listening: false,
      lastTranscript: "",
      ttsEnabled: true,

      messages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "مرحبًا، أنا DriveX AI — رفيقك الذكي. يمكنني مساعدتك في أي موضوع: المحادثة، التعليم، البرمجة، التصميم، الكتابة الإبداعية، الأعمال، وأكثر. اكتب رسالة أو اضغط زر المحادثة الصوتية المستمرة لنتحدث بشكل طبيعي.",
          ts: Date.now(),
        },
      ],

      mediaPlaying: false,
      mediaStation: "Lo-Fi Drive",

      homeAddress: "",
      voiceResponse: true,
      largeTextMode: false,

      // V5
      userProfile: { name: "", interests: "", goals: "", notes: "" },
      voiceConvActive: false,

      // NEW
      trips: [],
      currentTrip: null,
      weather: null,
      ecoScore: 100,
      restReminderEnabled: true,
      restReminderTriggered: false,
      cameraAlertEnabled: false,
      nightMode: false,
      sosContacts: "",

      // V3 initial
      dashcamEnabled: false,
      dashcamRecording: false,
      dashcamClips: [],
      crashDetectionEnabled: true,
      crashCountdown: null,
      crashDeclineRate: 0,
      parkingSpot: null,
      speedCameras: [],
      speedCamerasAlerted: [],
      speedCameraAlertEnabled: true,
      liveTrip: { sharing: false, tripCode: "", viewers: 0 },
      frequentRoutes: [],
      poiResults: [],
      poiLoading: false,

      setView: (v) => set({ view: v }),
      startDriving: () =>
        set({ driving: true, view: "drive", restReminderTriggered: false }),
      stopDriving: () => {
        // Save the trip when stopping
        const s = get();
        if (s.currentTrip) {
          get().endTrip();
        }
        set((st) => ({
          driving: false,
          view: st.view === "drive" ? "home" : st.view,
          currentTrip: null,
          ecoScore: 100,
        }));
      },
      setAutoDriveDetected: (v) => set({ autoDriveDetected: v }),
      setSpeed: (kmh) => set({ speedKmh: kmh }),
      setHeading: (deg) => set({ heading: deg }),
      setCoords: (c) => {
        set({ coords: c });
        // Update trip distance if driving
        const s = get();
        if (s.driving && s.currentTrip && c) {
          const last = s.currentTrip.lastCoords;
          if (last) {
            const km = haversineKm(last.lat, last.lng, c.lat, c.lng);
            // Only count if movement is plausible (< 500m between samples to avoid GPS jumps)
            if (km > 0.001 && km < 0.5) {
              get().updateTripDistance(km);
            }
          }
          if (!s.currentTrip.startCoords) {
            set((st) => ({
              currentTrip: st.currentTrip
                ? { ...st.currentTrip, startCoords: c, lastCoords: c }
                : st.currentTrip,
            }));
          } else {
            set((st) => ({
              currentTrip: st.currentTrip
                ? { ...st.currentTrip, lastCoords: c }
                : st.currentTrip,
            }));
          }
        }
      },
      setAccuracy: (a) => set({ accuracy: a }),
      setLocationError: (e) => set({ locationError: e }),
      setListening: (v) => set({ listening: v }),
      setLastTranscript: (t) => set({ lastTranscript: t }),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      clearMessages: () =>
        set({
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "تم مسح المحادثة. كيف يمكنني مساعدتك؟",
              ts: Date.now(),
            },
          ],
        }),
      setMediaPlaying: (v) => set({ mediaPlaying: v }),
      setMediaStation: (s) => set({ mediaStation: s }),
      setHomeAddress: (s) => set({ homeAddress: s }),
      setTtsEnabled: (v) => set({ ttsEnabled: v }),
      setVoiceResponse: (v) => set({ voiceResponse: v }),
      setLargeTextMode: (v) => set({ largeTextMode: v }),
      setUserProfile: (p) =>
        set((s) => ({ userProfile: { ...s.userProfile, ...p } })),
      setVoiceConvActive: (v) => set({ voiceConvActive: v }),

      // NEW actions
      startTrip: () =>
        set({
          currentTrip: {
            startTime: Date.now(),
            distanceKm: 0,
            maxSpeed: 0,
            speedSum: 0,
            speedSamples: 0,
            startCoords: null,
            lastCoords: null,
            ecoEvents: 0,
          },
          ecoScore: 100,
          restReminderTriggered: false,
        }),
      endTrip: () => {
        const s = get();
        if (!s.currentTrip) return;
        const ct = s.currentTrip;
        const endTime = Date.now();
        const durationMin = (endTime - ct.startTime) / 60000;
        const avgSpeed =
          ct.speedSamples > 0 ? ct.speedSum / ct.speedSamples : 0;
        const ecoScore = Math.max(
          0,
          Math.min(100, 100 - ct.ecoEvents * 5 - (ct.maxSpeed > 120 ? 15 : 0))
        );
        const trip: Trip = {
          id: uid(),
          startTime: ct.startTime,
          endTime,
          distanceKm: Math.round(ct.distanceKm * 100) / 100,
          maxSpeed: ct.maxSpeed,
          avgSpeed: Math.round(avgSpeed),
          durationMin: Math.round(durationMin),
          startCoords: ct.startCoords,
          endCoords: s.coords,
          ecoScore,
        };
        set((st) => ({
          trips: [trip, ...st.trips].slice(0, 100), // keep last 100 trips
          currentTrip: null,
        }));
      },
      updateTripDistance: (km) =>
        set((st) => {
          if (!st.currentTrip) return st;
          return {
            currentTrip: {
              ...st.currentTrip,
              distanceKm: st.currentTrip.distanceKm + km,
            },
          };
        }),
      recordSpeedSample: (kmh) =>
        set((st) => {
          if (!st.currentTrip) return st;
          // Detect harsh acceleration / braking
          const prevAvg =
            st.currentTrip.speedSamples > 0
              ? st.currentTrip.speedSum / st.currentTrip.speedSamples
              : 0;
          const delta = Math.abs(kmh - prevAvg);
          const harsh = delta > 25 ? 1 : 0;
          return {
            currentTrip: {
              ...st.currentTrip,
              maxSpeed: Math.max(st.currentTrip.maxSpeed, kmh),
              speedSum: st.currentTrip.speedSum + kmh,
              speedSamples: st.currentTrip.speedSamples + 1,
              ecoEvents: st.currentTrip.ecoEvents + harsh,
            },
          };
        }),
      recordHarshEvent: () =>
        set((st) => {
          if (!st.currentTrip) return st;
          return {
            currentTrip: {
              ...st.currentTrip,
              ecoEvents: st.currentTrip.ecoEvents + 1,
            },
            ecoScore: Math.max(0, st.ecoScore - 3),
          };
        }),
      setWeather: (w) => set({ weather: w }),
      setEcoScore: (s) => set({ ecoScore: Math.max(0, Math.min(100, s)) }),
      setRestReminderEnabled: (v) => set({ restReminderEnabled: v }),
      setRestReminderTriggered: (v) => set({ restReminderTriggered: v }),
      setCameraAlertEnabled: (v) => set({ cameraAlertEnabled: v }),
      setNightMode: (v) => set({ nightMode: v }),
      setSosContacts: (s) => set({ sosContacts: s }),
      deleteTrip: (id) =>
        set((st) => ({ trips: st.trips.filter((t) => t.id !== id) })),
      clearTrips: () => set({ trips: [] }),

      // V3 actions
      setDashcamEnabled: (v) => set({ dashcamEnabled: v }),
      setDashcamRecording: (v) => set({ dashcamRecording: v }),
      addDashcamClip: (c) =>
        set((st) => ({ dashcamClips: [c, ...st.dashcamClips].slice(0, 10) })),
      deleteDashcamClip: (id) =>
        set((st) => ({ dashcamClips: st.dashcamClips.filter((c) => c.id !== id) })),
      clearDashcamClips: () => set({ dashcamClips: [] }),
      setCrashDetectionEnabled: (v) => set({ crashDetectionEnabled: v }),
      setCrashCountdown: (s) => set({ crashCountdown: s }),
      setCrashDeclineRate: (r) => set({ crashDeclineRate: r }),
      setParkingSpot: (s) => set({ parkingSpot: s }),
      setSpeedCameras: (c) => set({ speedCameras: c }),
      setSpeedCamerasAlerted: (ids) => set({ speedCamerasAlerted: ids }),
      setSpeedCameraAlertEnabled: (v) => set({ speedCameraAlertEnabled: v }),
      setLiveTrip: (s) => set((st) => ({ liveTrip: { ...st.liveTrip, ...s } })),
      setFrequentRoutes: (r) => set({ frequentRoutes: r }),
      addFrequentRouteOrUpdate: (r) =>
        set((st) => {
          // Match by rounded coords (within ~100m).
          const matchIdx = st.frequentRoutes.findIndex(
            (fr) =>
              Math.abs(fr.startCoords.lat - r.startCoords.lat) < 0.001 &&
              Math.abs(fr.startCoords.lng - r.startCoords.lng) < 0.001 &&
              Math.abs(fr.endCoords.lat - r.endCoords.lat) < 0.001 &&
              Math.abs(fr.endCoords.lng - r.endCoords.lng) < 0.001
          );
          if (matchIdx >= 0) {
            const existing = st.frequentRoutes[matchIdx];
            const updated: FrequentRoute = {
              ...existing,
              tripCount: existing.tripCount + 1,
              avgDurationMin: Math.round(
                (existing.avgDurationMin * existing.tripCount + r.avgDurationMin) /
                  (existing.tripCount + 1)
              ),
              lastUsed: r.lastUsed,
            };
            const copy = [...st.frequentRoutes];
            copy[matchIdx] = updated;
            return { frequentRoutes: copy };
          }
          return { frequentRoutes: [r, ...st.frequentRoutes].slice(0, 20) };
        }),
      setPoiResults: (p) => set({ poiResults: p }),
      setPoiLoading: (v) => set({ poiLoading: v }),
    }),
    {
      name: "drivex-store",
      partialize: (s) => ({
        homeAddress: s.homeAddress,
        voiceResponse: s.voiceResponse,
        ttsEnabled: s.ttsEnabled,
        largeTextMode: s.largeTextMode,
        mediaStation: s.mediaStation,
        trips: s.trips,
        restReminderEnabled: s.restReminderEnabled,
        cameraAlertEnabled: s.cameraAlertEnabled,
        nightMode: s.nightMode,
        sosContacts: s.sosContacts,
        // V3 persisted
        crashDetectionEnabled: s.crashDetectionEnabled,
        speedCameraAlertEnabled: s.speedCameraAlertEnabled,
        parkingSpot: s.parkingSpot,
        frequentRoutes: s.frequentRoutes,
        // V5 persisted — long-term memory
        userProfile: s.userProfile,
      }),
    }
  )
);

/** Haversine distance in kilometers between two lat/lng points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
