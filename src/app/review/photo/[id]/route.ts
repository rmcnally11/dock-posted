import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readReportPhoto } from "@/lib/persist";
import { REVIEW_COOKIE, reviewPasswordConfigured, reviewSessionValid } from "@/lib/review-auth";
import { readReviewQueue } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!reviewPasswordConfigured()) {
    return new NextResponse(null, { status: 404 });
  }
  const jar = await cookies();
  if (!reviewSessionValid(jar.get(REVIEW_COOKIE)?.value)) {
    return new NextResponse(null, { status: 404 });
  }

  const { id } = await context.params;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const queue = await readReviewQueue();
  const report = queue.submissions.find((row) => row.id === id);
  if (!report?.photoPath) {
    return new NextResponse(null, { status: 404 });
  }

  const photo = await readReportPhoto(report.photoPath);
  if (!photo) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
