"use client";

import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, Zap, Wind, Moon, RefreshCw } from "lucide-react";
import { useDriveX, type WeatherData } from "@/lib/store";
import { useWeather } from "@/hooks/use-weather";
import { cn } from "@/lib/utils";

function weatherIcon(code: number, isDay: boolean) {
  if (code === 0) return isDay ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
  if (code <= 48) return <CloudFog className="w-5 h-5" />;
  if (code <= 67) return <CloudRain className="w-5 h-5" />;
  if (code <= 77) return <CloudSnow className="w-5 h-5" />;
  if (code <= 82) return <CloudRain className="w-5 h-5" />;
  if (code >= 95) return <Zap className="w-5 h-5" />;
  return <Cloud className="w-5 h-5" />;
}

export function WeatherWidget({ compact = false }: { compact?: boolean }) {
  const { weather, refresh } = useWeather();
  const driving = useDriveX((s) => s.driving);

  if (!weather) {
    if (compact) return null;
    return (
      <div className="rounded-2xl p-4 bg-[var(--drivex-panel)] border border-white/5 text-center">
        <div className="text-xs text-muted-foreground mb-2">حالة الطقس</div>
        <div className="text-sm text-muted-foreground/60">جارٍ التحميل...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10">
        <span className="text-[var(--drivex-cyan)]">{weatherIcon(weather.weatherCode, weather.isDay)}</span>
        <span className="text-sm font-bold">{weather.temperature}°</span>
        <span className="text-[10px] text-muted-foreground">{weather.description}</span>
      </div>
    );
  }

  const badWeather = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
    weather.weatherCode
  );

  return (
    <div className={cn(
      "rounded-2xl p-4 border",
      badWeather ? "bg-amber-400/5 border-amber-400/20" : "bg-[var(--drivex-panel)] border-white/5"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[var(--drivex-cyan)]">
            {weatherIcon(weather.weatherCode, weather.isDay)}
          </span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">الطقس الآن</span>
        </div>
        <button onClick={refresh} className="text-muted-foreground hover:text-[var(--drivex-cyan)]" aria-label="تحديث">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold">{weather.temperature}°C</div>
          <div className="text-sm text-muted-foreground">{weather.description}</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wind className="w-3.5 h-3.5" />
          {weather.windSpeed} كم/س
        </div>
      </div>

      {badWeather && driving && (
        <div className="mt-3 text-xs text-amber-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dx-blink" />
          طقس غير مستقر — كن حذرًا أثناء القيادة
        </div>
      )}
    </div>
  );
}

export { weatherIcon };
export type { WeatherData };
