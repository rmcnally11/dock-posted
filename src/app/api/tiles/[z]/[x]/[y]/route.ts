import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOSTS = ["a", "b", "c"] as const;

function asTileInt(value: string, max: number): number | null {
  const cleaned = value.replace(/\.png$/i, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await context.params;
  const zoom = asTileInt(z, 19);
  const tileX = asTileInt(x, 2 ** 20);
  const tileY = asTileInt(y, 2 ** 20);
  if (zoom == null || tileX == null || tileY == null) {
    return NextResponse.json({ error: "Invalid tile" }, { status: 400 });
  }

  const host = HOSTS[Math.abs(tileX) % HOSTS.length];
  const url = `https://${host}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX}/${tileY}.png`;
  const upstream = await fetch(url, {
    headers: { "User-Agent": "DockPosted/1.0 (local marina map)" },
    cache: "force-cache",
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
