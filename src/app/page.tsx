import { DockBoard } from "@/components/dock-board";
import { filterDocks, parseBoardQuery } from "@/lib/board-query";
import { boardTally } from "@/lib/freshness";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    reported?: string;
    corridor?: string;
    state?: string;
    region?: string;
    q?: string;
    e0?: string;
    fresh?: string;
    dock?: string;
  }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;
  const query = parseBoardQuery(params);
  const { inCorridor, visible } = filterDocks(docks, query);
  const tally = boardTally(docks);
  const reportedDock = query.reported
    ? docks.find((dock) => dock.id === query.reported)
    : null;

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:h-[calc(100dvh-3.6rem)]">
      <section className="border-b border-harbor/15 bg-sand/70 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p data-testid="hero-kicker" className="text-sm text-harbor/70">
            What the dock posted
          </p>
          <h1 data-testid="hero-headline" className="font-serif text-3xl text-harbor md:text-4xl">
            Sabine to Key West
          </h1>
          <p
            data-testid="hero-deck"
            className="max-w-2xl text-sm leading-6 text-harbor/72 md:text-base"
          >
            The last number they wrote on the board. If they did not post, it stays Call.
          </p>
          <p data-testid="board-tally" className="text-sm text-harbor/55">
            {tally.postedThisWeek} posted this week · {tally.call} Call
            {tally.stale ? ` · ${tally.stale} stale` : ""}
          </p>
        </div>
        {query.reported ? (
          <p
            data-testid="report-saved"
            className="mx-auto mt-3 max-w-6xl border border-fresh/25 bg-fresh/10 px-3 py-2 text-sm text-fresh"
          >
            {reportedDock
              ? `On the board. ${reportedDock.name} now carries the time you saw.`
              : "On the board. That dock now carries the time you saw."}
          </p>
        ) : null}
      </section>
      <DockBoard query={query} inCorridor={inCorridor} visible={visible} />
    </main>
  );
}
