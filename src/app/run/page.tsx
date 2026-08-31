import type { Metadata } from "next";
import { RunWatchForm } from "@/components/run-watch-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { filterDocks, parseBoardQuery, viewLabel } from "@/lib/board-query";
import { ethanolCopy } from "@/lib/format";
import { parsePositive, WATCH_PRICE_LABEL } from "@/lib/income";
import { runRows, runTally, tankGallons } from "@/lib/run-card";
import { readDocks } from "@/lib/store";
import { CORRIDORS, REGIONS, type CorridorId, type RegionId } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The run",
  description: "Gallons you will burn. What they posted on that water. A blank stays Call.",
};

export default async function RunPage({
  searchParams,
}: {
  searchParams: Promise<{
    corridor?: string;
    region?: string;
    gallons?: string;
    gph?: string;
    hours?: string;
    watched?: string;
    paid?: string;
    error?: string;
  }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;
  const query = parseBoardQuery({ corridor: params.corridor, region: params.region });
  const { visible } = filterDocks(docks, query);
  const gallonsIn = parsePositive(params.gallons ?? "", 2000);
  const gph = parsePositive(params.gph ?? "", 200);
  const hours = parsePositive(params.hours ?? "", 48);
  const gallons = tankGallons({ gallons: gallonsIn, gph, hours });
  const rows = runRows(visible, gallons);
  const tally = runTally(rows);
  const water = viewLabel(query);

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-6">
      <p
        data-testid="run-kicker"
        className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]"
      >
        Fishing run
      </p>
      <h1 data-testid="run-headline" className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl">
        The run
      </h1>
      <p data-testid="run-deck" className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        Gallons you will burn. What they posted on that water. A blank stays Call.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/60">
        Charter or trailer. Same math. We don’t pick a hose. We don’t sell a gallon.
        E15 is not for boats.
      </p>
      <Waterline className="mt-3" />

      <form action="/run" method="get" className="mt-8 max-w-2xl space-y-4" data-testid="run-form">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="text-[color:var(--ink)]/80">Water</span>
            <select
              name="corridor"
              defaultValue={query.corridor ?? ""}
              className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
            >
              <option value="">Sabine to Maine</option>
              {(Object.keys(CORRIDORS) as CorridorId[]).map((id) => (
                <option key={id} value={id}>
                  {CORRIDORS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-[color:var(--ink)]/80">Coast</span>
            <select
              name="region"
              defaultValue={query.region ?? ""}
              className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
            >
              <option value="">All coasts</option>
              {(Object.keys(REGIONS) as RegionId[]).map((id) => (
                <option key={id} value={id}>
                  {REGIONS[id].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="text-[color:var(--ink)]/80">Gallons</span>
            <input
              name="gallons"
              inputMode="decimal"
              defaultValue={params.gallons ?? ""}
              placeholder="40"
              className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-[color:var(--ink)]/80">GPH</span>
            <input
              name="gph"
              inputMode="decimal"
              defaultValue={params.gph ?? ""}
              placeholder="12"
              className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-[color:var(--ink)]/80">Hours</span>
            <input
              name="hours"
              inputMode="decimal"
              defaultValue={params.hours ?? ""}
              placeholder="3"
              className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-md bg-[color:var(--navy)] px-4 text-sm font-medium text-[color:var(--cream)]"
        >
          Run the numbers
        </button>
        <p className="text-xs text-[color:var(--ink)]/50">
          Gallons, or GPH times hours. Posted dollars only. Call if they didn’t write it.
        </p>
      </form>

      <section className="mt-8" data-testid="run-board">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">{water}</h2>
        <p className="mt-2 text-sm text-[color:var(--ink)]/70" data-testid="run-tally">
          {tally.posted} posted. {tally.call} still Call.
          {gallons != null ? ` Tank ${gallons} gal.` : ""}
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--fog)] text-[11px] uppercase tracking-wide text-[color:var(--ink)]/55">
              <tr>
                <th className="px-3 py-2 font-medium">Dock</th>
                <th className="px-3 py-2 font-medium">Gas</th>
                <th className="px-3 py-2 font-medium">Diesel</th>
                <th className="px-3 py-2 font-medium">Tank gas</th>
                <th className="px-3 py-2 font-medium">Tank diesel</th>
                <th className="px-3 py-2 font-medium">Blend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.dock.id} className="border-t border-[color:var(--line)]" data-testid={`run-row-${row.dock.id}`}>
                  <td className="px-3 py-2">
                    <a
                      href={`/docks/${row.dock.id}`}
                      className="font-medium text-[color:var(--navy)] underline-offset-2 hover:underline"
                    >
                      {row.dock.name}
                    </a>
                    <p className="text-xs text-[color:var(--ink)]/55">
                      {row.dock.city}, {row.dock.state}
                      {row.dock.hours ? ` · ${row.dock.hours}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">{row.gasLabel}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{row.dieselLabel}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{row.tankGasLabel}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{row.tankDieselLabel}</td>
                  <td className="px-3 py-2 font-mono">{ethanolCopy(row.dock.ethanol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 max-w-xl">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">Watch this water</h2>
        <p className="mt-2 text-sm text-[color:var(--ink)]/70">{WATCH_PRICE_LABEL}.</p>
        <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5">
          {params.error ? (
            <p className="mb-4 rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
              {params.error}
            </p>
          ) : null}
          {params.watched ? (
            <p className="mb-4 rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh" data-testid="watch-filed">
              {params.paid === "1"
                ? "Watch is paid. We write when a dock on that water posts."
                : "Watch filed. We write when a dock on that water posts."}
            </p>
          ) : null}
          <RunWatchForm
            corridor={query.corridor}
            region={query.region}
            gallons={gallons != null ? String(gallons) : ""}
          />
        </div>
      </section>

      <p className="mt-8 text-sm text-[color:var(--ink)]/55">
        Run the hose?{" "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/pin"
        >
          Own the pin
        </a>
        . Wrong hose?{" "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/safe-fuel"
        >
          E15 is not for boats
        </a>
        .
      </p>
      <SiteFooter />
    </main>
  );
}
