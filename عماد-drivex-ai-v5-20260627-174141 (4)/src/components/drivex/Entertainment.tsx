"use client";

import { useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Radio, Music2, Headphones } from "lucide-react";
import { useDriveX } from "@/lib/store";
import { cn } from "@/lib/utils";

type Station = {
  id: string;
  name: string;
  url: string;
  tag: string;
};

// Public sample audio streams (SomaFM — free internet radio).
const STATIONS: Station[] = [
  { id: "groove", name: "Groove Salad", url: "https://ice1.somafm.com/groovesalad-128-mp3", tag: "Chill" },
  { id: "lofi", name: "Lo-Fi Drive", url: "https://ice1.somafm.com/beatblender-128-mp3", tag: "Lo-Fi" },
  { id: "space", name: "Space Station", url: "https://ice1.somafm.com/spacestation-128-mp3", tag: "Ambient" },
  { id: "indie", name: "Indie Pop Rocks", url: "https://ice1.somafm.com/indiepoprock-128-mp3", tag: "Indie" },
  { id: "dance", name: "The Trip", url: "https://ice1.somafm.com/thetrip-128-mp3", tag: "Electronic" },
];

export function Entertainment() {
  const mediaPlaying = useDriveX((s) => s.mediaPlaying);
  const setMediaPlaying = useDriveX((s) => s.setMediaPlaying);
  const mediaStation = useDriveX((s) => s.mediaStation);
  const setMediaStation = useDriveX((s) => s.setMediaStation);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = STATIONS.find((s) => s.name === mediaStation) || STATIONS[0];

  useEffect(() => {
    if (!audioRef.current) return;
    if (mediaPlaying) {
      audioRef.current.src = current.url;
      audioRef.current.play().catch(() => {
        /* autoplay may be blocked until user gesture; ignore */
      });
    } else {
      audioRef.current.pause();
    }
  }, [mediaPlaying, current.url]);

  const select = (st: Station) => {
    setMediaStation(st.name);
    if (!mediaPlaying) setMediaPlaying(true);
    else if (audioRef.current) {
      audioRef.current.src = st.url;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full dx-scroll overflow-y-auto">
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />

      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Radio className="w-5 h-5 text-[var(--drivex-cyan)]" />
        <h2 className="text-base font-semibold">الترفيه أثناء القيادة</h2>
      </div>

      {/* Now playing card */}
      <div className="mx-4 mt-2 rounded-3xl p-5 bg-gradient-to-br from-[var(--drivex-panel-2)] to-[var(--drivex-panel)] border border-[var(--drivex-cyan)]/15 dx-glow">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--drivex-cyan)]/30 to-[var(--drivex-blue)]/20 grid place-items-center">
            {mediaPlaying ? (
              <Headphones className="w-8 h-8 text-[var(--drivex-cyan)]" />
            ) : (
              <Music2 className="w-8 h-8 text-muted-foreground" />
            )}
            {mediaPlaying && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--drivex-cyan)] grid place-items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-black dx-blink" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[var(--drivex-cyan)]/70">يتم تشغيله الآن</div>
            <div className="text-lg font-bold truncate">{current.name}</div>
            <div className="text-xs text-muted-foreground">{current.tag} • Internet Radio</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-6">
          <button
            onClick={() => select(STATIONS[(STATIONS.findIndex((s) => s.id === current.id) - 1 + STATIONS.length) % STATIONS.length])}
            className="w-12 h-12 rounded-full grid place-items-center bg-white/5 hover:bg-white/10 text-white transition-colors"
            aria-label="المحطة السابقة"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMediaPlaying(!mediaPlaying)}
            className="w-16 h-16 rounded-full grid place-items-center bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black active:scale-95 transition-transform dx-glow"
            aria-label={mediaPlaying ? "إيقاف" : "تشغيل"}
          >
            {mediaPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => select(STATIONS[(STATIONS.findIndex((s) => s.id === current.id) + 1) % STATIONS.length])}
            className="w-12 h-12 rounded-full grid place-items-center bg-white/5 hover:bg-white/10 text-white transition-colors"
            aria-label="المحطة التالية"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* stations list */}
      <div className="px-4 mt-5 mb-2 text-xs uppercase tracking-widest text-muted-foreground">المحطات</div>
      <div className="px-4 pb-6 space-y-2">
        {STATIONS.map((st) => {
          const active = st.id === current.id;
          return (
            <button
              key={st.id}
              onClick={() => select(st)}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl p-3 border transition-colors text-left",
                active
                  ? "bg-[var(--drivex-cyan)]/10 border-[var(--drivex-cyan)]/40"
                  : "bg-[var(--drivex-panel)] border-white/5 hover:border-white/15"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl grid place-items-center shrink-0",
                active ? "bg-[var(--drivex-cyan)] text-black" : "bg-white/5 text-[var(--drivex-cyan)]"
              )}>
                <Radio className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{st.name}</div>
                <div className="text-xs text-muted-foreground">{st.tag}</div>
              </div>
              {active && mediaPlaying && (
                <span className="flex items-end gap-0.5 h-4">
                  <span className="w-0.5 bg-[var(--drivex-cyan)] dx-blink" style={{ height: "40%" }} />
                  <span className="w-0.5 bg-[var(--drivex-cyan)] dx-blink" style={{ height: "100%", animationDelay: "0.2s" }} />
                  <span className="w-0.5 bg-[var(--drivex-cyan)] dx-blink" style={{ height: "60%", animationDelay: "0.4s" }} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-6 text-center text-[11px] text-muted-foreground/70">
        محطات راديو الإنترنت من SomaFM — يلزم اتصال بالإنترنت.
      </div>
    </div>
  );
}
