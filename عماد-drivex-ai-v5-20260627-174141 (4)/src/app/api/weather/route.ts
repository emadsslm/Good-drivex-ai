import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Open-Meteo weather code → Arabic description.
function describeWeather(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "سماء صافية" : "ليلة صافية";
  if (code <= 2) return "غائم جزئيًا";
  if (code === 3) return "غائم";
  if (code <= 48) return "ضباب";
  if (code <= 57) return "رذاذ";
  if (code <= 67) return "مطر";
  if (code <= 77) return "ثلج";
  if (code <= 82) return "زخات مطر";
  if (code <= 86) return "زخات ثلج";
  if (code >= 95) return "عاصفة رعدية";
  return "حالة جوية متغيرة";
}

/**
 * GET /api/weather?lat=24.71&lng=46.68
 * Proxies Open-Meteo (free, no API key) and returns a compact Arabic description.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { ok: false, error: "الإحداثيات غير صالحة." },
        { status: 400 }
      );
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "تعذّر جلب الطقس." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const cw = data?.current_weather;
    if (!cw) {
      return NextResponse.json(
        { ok: false, error: "بيانات الطقس غير متوفرة." },
        { status: 502 }
      );
    }

    const isDay = cw.is_day === 1;
    return NextResponse.json({
      ok: true,
      weather: {
        temperature: Math.round(cw.temperature),
        windSpeed: Math.round(cw.windspeed),
        weatherCode: cw.weathercode,
        isDay,
        description: describeWeather(cw.weathercode, isDay),
        fetchedAt: Date.now(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "خطأ في جلب الطقس." },
      { status: 500 }
    );
  }
}
