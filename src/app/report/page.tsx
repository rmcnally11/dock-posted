import type { Metadata } from "next";
import { BrandPhoto } from "@/components/brand-photo";
import { PriceAlertForm } from "@/components/price-alert-form";
import { ReportForm, type ReportDockChoice } from "@/components/report-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { matchesSearch } from "@/lib/board-query";
import { chicagoToday } from "@/lib/price-report";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "I was there",
  description: "You were there. What did they have on the hose.",
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    dock?: string;
    error?: string;
    q?: string;
    who?: string;
    sent?: string;
    alert?: string;
    alertError?: string;
  }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const matched = q.length >= 2 ? docks.filter((dock) => matchesSearch(dock, q)) : docks;
  const visible: ReportDockChoice[] = matched.map((dock) => ({
    id: dock.id,
    name: dock.name,
    city: dock.city,
    state: dock.state,
    phone: dock.phone,
    quotes: dock.quotes,
  }));
  const today = chicagoToday();
  const savedDock = params.dock ? (docks.find((dock) => dock.id === params.dock) ?? null) : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col overflow-x-hidden px-4 py-4 md:px-6 lg:py-6">
      <p className="kicker text-[color:var(--signal)]">Today</p>
      <h1 className="page-title mt-3 text-[color:var(--navy)]">You were there.</h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        What did they have on the hose.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/55">
        Truck day, or when they change the board. Not every morning. If they did not post, leave it blank.
      </p>
      <Waterline className="mt-3 hidden lg:block" />
      <BrandPhoto name="board" className="mt-6 aspect-[16/9] w-full max-w-xl" />

      <form action="/report" method="get" className="mt-6 flex max-w-xl gap-2">
        {params.dock ? <input type="hidden" name="dock" value={params.dock} /> : null}
        {params.who ? <input type="hidden" name="who" value={params.who} /> : null}
        <label className="sr-only" htmlFor="report-search">
          Filter marinas
        </label>
        <input
          id="report-search"
          name="q"
          defaultValue={q}
          placeholder="Find a marina or town"
          className="h-11 min-w-0 flex-1 rounded-md border border-[color:var(--line)] bg-white px-3 text-base lg:text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-[color:var(--line)] bg-[color:var(--fog)] px-3 text-sm"
        >
          Find
        </button>
      </form>

      <div className="mt-6 max-w-xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5">
        {params.error ? (
          <p className="mb-4 rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
            {params.error}
          </p>
        ) : null}
        {params.sent === "1" && savedDock ? (
          <div>
            <p data-testid="report-saved" className="text-sm text-[color:var(--navy)]">
              Got it. We&apos;ll look at the number before it goes on the board.
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink)]/70">
              {savedDock.name}, {savedDock.city} {savedDock.state}.
            </p>
            {params.alert === "1" ? (
              <p className="mt-6 text-sm text-[color:var(--ink)]/80" data-testid="alert-saved">
                Saved. We&apos;ll hold your email for this dock.
              </p>
            ) : (
              <PriceAlertForm dockId={savedDock.id} dockName={savedDock.name} error={params.alertError} />
            )}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-[color:var(--ink)]/70">
            No marina by that name. Try Seabrook, Key Largo, or Beaufort.
          </p>
        ) : (
          <ReportForm
            docks={visible}
            initialDockId={params.dock}
            initialWho={params.who}
            today={today}
          />
        )}
      </div>
      <p className="mt-6 text-sm text-[color:var(--ink)]/55">
        Wrong hose?{" "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/safe-fuel"
        >
          What’s in the hose
        </a>
        .
      </p>
      <SiteFooter />
    </main>
  );
}
