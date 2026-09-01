import { NextResponse } from "next/server";
import { filterDocks, parseBoardQuery } from "@/lib/board-query";
import { formatQuote } from "@/lib/format";
import { boardQuote, displayDiesel, displayGas, freshness } from "@/lib/freshness";
import { waterLabel } from "@/lib/income";
import { sendMail } from "@/lib/notify";
import { conditionsMailLine, publicSiteUrl } from "@/lib/sister";
import { readDocks, readIncomeStore } from "@/lib/store";

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
  const watches = income.watches.filter((watch) => watch.status === "paid" || watch.status === "filed");
  let mailed = 0;

  for (const watch of watches) {
    const query = parseBoardQuery({
      corridor: watch.corridor ?? undefined,
      region: watch.region ?? undefined,
    });
    const { visible } = filterDocks(docks, query);
    const posted = visible.filter((dock) => freshness(dock) === "fresh").slice(0, 8);
    const water = waterLabel(watch.corridor, watch.region);
    const lines =
      posted.length === 0
        ? ["Nothing posted this week. Call stays Call."]
        : posted.map((dock) => {
            const gas = formatQuote(boardQuote(dock, displayGas(dock)));
            const diesel = formatQuote(boardQuote(dock, displayDiesel(dock)));
            return `${dock.name}, ${dock.city}: gas ${gas} · diesel ${diesel}`;
          });

    const sent = await sendMail({
      to: watch.email,
      subject: `Dock Posted · ${water}`,
      text: [
        `${water}. What they posted.`,
        "",
        ...lines,
        "",
        "A blank stays Call. We don’t sell a gallon.",
        conditionsMailLine({
          corridor: watch.corridor,
          region: watch.region,
        }),
        `${publicSiteUrl()}/run`,
      ].join("\n"),
    });
    if (sent) mailed += 1;
  }

  return NextResponse.json({ ok: true, watches: watches.length, mailed });
}
