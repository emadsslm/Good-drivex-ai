import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/speed-cameras?lat=24.71&lng=46.68&radius=5000
 * Fetches fixed speed cameras from OpenStreetMap (Overpass).
 * Tags: highway=speed_camera, enforcement=maxspeed.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = Math.min(15000, Math.max(2000, parseInt(searchParams.get("radius") || "5000", 10)));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ ok: false, error: "الإحداثيات غير صالحة." }, { status: 400 });
    }

    const query = `[out:json][timeout:15];(
      node["highway"="speed_camera"](around:${radius},${lat},${lng});
      node["enforcement"="maxspeed"](around:${radius},${lat},${lng});
      node["enforcement"="average_speed"](around:${radius},${lat},${lng});
    );out 50;`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "تعذّر الوصول لخدمة الخرائط." }, { status: 502 });
    }

    const data = await res.json();
    const elements: any[] = data?.elements || [];

    const cameras = elements
      .map((el) => {
        if (!el.lat || !el.lon) return null;
        const tagsObj = el.tags || {};
        return {
          id: `cam-${el.id}`,
          lat: el.lat,
          lng: el.lon,
          maxSpeed: tagsObj["maxspeed"] ? parseInt(tagsObj["maxspeed"], 10) || null : null,
          direction: tagsObj["direction"] || tagsObj["camera:direction"] || null,
          distance: Math.round(haversineM(lat, lng, el.lat, el.lon)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);

    return NextResponse.json({ ok: true, cameras });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "خطأ في جلب الرادارات." }, { status: 500 });
  }
}
