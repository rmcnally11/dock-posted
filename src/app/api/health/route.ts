import { NextResponse } from "next/server";
import { blobConfigured } from "@/lib/persist";
import { wholesalePasswordConfigured } from "@/lib/wholesale-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    blob: blobConfigured(),
    wholesale: wholesalePasswordConfigured(),
    host: "dock-posted.vercel.app",
  });
}
