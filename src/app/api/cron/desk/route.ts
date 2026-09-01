import { NextResponse } from "next/server";
import { writeCallToAirtable } from "@/lib/airtable-desk";
import { deskCallFromDock, pickDeskDocks } from "@/lib/desk";
import { PIN_PRICE_LABEL, pinPitch, weekOfIso } from "@/lib/income";
import { notifyEmail, sendMail } from "@/lib/notify";
import { addDeskCalls, attachIncomeAirtable, readDocks, readIncomeStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function cronAllowed(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const header = request.headers.get("authorization");
  const query = new URL(request.url).searchParams.get("secret");
  return header === `Bearer ${secret}` || query === secret;
}

export async function GET(request: Request) {
  if (!cronAllowed(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [docks, income] = await Promise.all([readDocks(), readIncomeStore()]);
  const weekOf = weekOfIso();
  const already = income.calls.filter((call) => call.weekOf === weekOf);
  if (already.length > 0 && new URL(request.url).searchParams.get("force") !== "1") {
    return NextResponse.json({ ok: true, weekOf, queued: already.length, skipped: true });
  }

  const picked = pickDeskDocks(docks, income.pins, income.calls);
  const created = await addDeskCalls(picked.map((dock) => deskCallFromDock(dock)));
  for (const call of created) {
    const airtableId = await writeCallToAirtable(call);
    if (airtableId) await attachIncomeAirtable("call", call.id, airtableId);
  }

  const lines = created.map((call, index) => {
    return [
      `${index + 1}. ${call.dockName}`,
      call.phone ? `   ${call.phone}` : "   Phone Call",
      `   ${call.water}`,
      `   ${pinPitch(call.dockName)}`,
    ].join("\n");
  });

  const sent = await sendMail({
    to: notifyEmail(),
    subject: `Monday list — eight docks to phone`,
    text: [
      `Monday list. Week of ${weekOf}. ${created.length} docks. ${PIN_PRICE_LABEL}. Home waters first.`,
      "We don’t sell a gallon. A blank stays blank.",
      "",
      ...lines,
      "",
      "https://dock-posted.vercel.app/desk",
      "https://airtable.com/apppoBWAzJi7lVVKv",
    ].join("\n"),
  });

  return NextResponse.json({
    ok: true,
    weekOf,
    queued: created.length,
    mailed: sent,
    docks: created.map((call) => call.dockId),
  });
}
