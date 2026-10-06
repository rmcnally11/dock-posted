import { NextResponse } from "next/server";
import { z } from "zod";
import { calendarDay, isFutureChicagoDate } from "@/lib/price-report";
import { queuePriceReport, readReports } from "@/lib/store";
import { clientKey, takeReportSlot } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const productValues = ["87", "89", "90", "91", "93", "diesel"] as const;
const ethanolValues = ["E0", "E10", "E15", "unknown"] as const;

const ReportSchema = z.object({
  dockId: z.string().min(1),
  product: z.enum(productValues),
  ethanol: z.enum(ethanolValues),
  pricePerGallon: z.number().positive().max(20),
  seenAt: z.string().min(8),
  note: z.string().max(400).optional().nullable(),
  company: z.string().optional().nullable(),
});

export async function GET() {
  const reports = await readReports();
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.company && parsed.data.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const seenAt = calendarDay(parsed.data.seenAt);
  if (!seenAt || isFutureChicagoDate(seenAt)) {
    return NextResponse.json({ error: "That day hasn't happened yet." }, { status: 400 });
  }

  const slot = takeReportSlot(clientKey(request.headers));
  if (!slot.ok) {
    return NextResponse.json(
      { error: `Too many reports from this network. Try again in ${Math.ceil(slot.retryAfterSec / 60)} minutes.` },
      { status: 429 },
    );
  }

  try {
    const report = await queuePriceReport({
      dockId: parsed.data.dockId,
      product: parsed.data.product,
      ethanol: parsed.data.ethanol,
      pricePerGallon: parsed.data.pricePerGallon,
      seenAt,
      note: parsed.data.note?.trim() || null,
      marinaOwned: false,
      hours: null,
      pay: null,
      closed: false,
      dieselOnly: false,
      photoPath: null,
    });
    return NextResponse.json({ ok: true, queued: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
