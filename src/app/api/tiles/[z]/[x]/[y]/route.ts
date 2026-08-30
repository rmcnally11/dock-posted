import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TILE_UA = "DockPosted/1.0 (+https://github.com/rmcnally11/dock-posted)";

const UPSTREAMS = [
  (z: number, x: number, y: number) => `https://tile.openstreetmap.de/${z}/${x}/${y}.png`,
  (z: number, x: number, y: number) => `https://a.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png`,
] as const;

function asTileInt(value: string, max: number): number | null {
  const cleaned = value.replace(/\.png$/i, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
}

function needsFallback(status: number): boolean {
  return status === 403 || status === 429 || status >= 500;
}

async function fetchUpstream(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { "User-Agent": TILE_UA },
      cache: "no-store",
    });
  } catch {
    return null;
  }
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

  let upstream: Response | null = null;
  for (const [index, makeUrl] of UPSTREAMS.entries()) {
    const res = await fetchUpstream(makeUrl(zoom, tileX, tileY));
    if (res?.ok) {
      upstream = res;
      break;
    }
    const last = index === UPSTREAMS.length - 1;
    if (last || (res && !needsFallback(res.status))) {
      return new NextResponse(null, { status: res?.status === 404 ? 404 : 502 });
    }
  }

  if (!upstream) {
    return new NextResponse(null, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
