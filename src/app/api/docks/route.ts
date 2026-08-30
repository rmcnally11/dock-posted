import { NextResponse } from "next/server";
import { readDocks, readReports } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [docks, reports] = await Promise.all([readDocks(), readReports()]);
  return NextResponse.json({
    docks,
    reportCount: reports.length,
  });
}
