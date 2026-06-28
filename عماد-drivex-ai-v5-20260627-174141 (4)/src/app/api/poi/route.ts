import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OSM tags per category.
const CATEGORY_TAGS: Record<string, string[]> = {
  fuel: ['"amenity"="fuel"'],
  hospital: ['"amenity"="hospital"', '"amenity"="clinic"'],
  restaurant: ['"amenity"="restaurant"', '"amenity"="fast_food"', '"amenity"="cafe"'],
  parking: ['"amenity"="parking"'],
  pharmacy: ['"amenity"="pharmacy"'],
  atm: ['"amenity"="atm"', '"amenity"="bank"'],
  charging: ['"amenity"="charging_station"'],
  toilet: ['"amenity"="toilets"'],
  supermarket: ['"shop"="supermarket"', '"shop"="convenience"'],
};

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
 * GET /api/poi?lat=24.71&lng=46.68&category=fuel&radius=3000
 * Proxies OpenStreetMap Overpass API and returns nearby points of interest.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const category = (searchParams.get("category") || "fuel").toLowerCase();
    const radius = Math.min(8000, Math.max(500, parseInt(searchParams.get("radius") || "3000", 10)));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ ok: false, error: "الإحداثيات غير صالحة." }, { status: 400 });
    }

    const tags = CATEGORY_TAGS[category] || CATEGORY_TAGS.fuel;
    const union = tags
      .map(
        (t) =>
          `node[${t}](around:${radius},${lat},${lng});way[${t}](around:${radius},${lat},${lng});`
      )
      .join("");

    const query = `[out:json][timeout:15];(${union});out center 30;`;

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

    const results = elements
      .map((el) => {
        const elat = el.lat ?? el.center?.lat;
        const elng = el.lon ?? el.center?.lng;
        if (!elat || !elng) return null;
        const tagsObj = el.tags || {};
        const name =
          tagsObj.name || tagsObj["name:ar"] || tagsObj.brand || CATEGORY_LABEL(category);
        return {
          id: `${el.type}-${el.id}`,
          name,
          category,
          lat: elat,
          lng: elng,
          distance: Math.round(haversineM(lat, lng, elat, elng)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15);

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "خطأ في جلب الأماكن القريبة." }, { status: 500 });
  }
}

function CATEGORY_LABEL(c: string): string {
  const m: Record<string, string> = {
    fuel: "محطة وقود",
    hospital: "مستشفى",
    restaurant: "مطعم",
    parking: "موقف سيارات",
    pharmacy: "صيدلية",
    atm: "صراف آلي",
    charging: "محطة شحن",
    toilet: "دورات مياه",
    supermarket: "بقالة",
  };
  return m[c] || c;
}
