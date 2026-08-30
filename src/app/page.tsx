import { DockBoard } from "@/components/dock-board";
import { Waterline } from "@/components/waterline";
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
    <main className="flex min-w-0 flex-1 flex-col">
      <section
        data-testid="landing"
        className="flex min-h-[calc(100dvh-3.6rem)] flex-col justify-center border-b border-[color:var(--line)] px-4 py-16 md:px-6 md:py-24"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col">
          <p
            data-testid="hero-kicker"
            className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]"
          >
            Marina fuel
          </p>
          <h1
            data-testid="hero-headline"
            className="mt-4 max-w-4xl font-heading text-5xl leading-[1.05] text-[color:var(--cream)] md:text-7xl"
          >
            The price they posted
          </h1>
          <p
            data-testid="hero-deck"
            className="mt-6 max-w-xl text-base leading-7 text-[color:var(--cream)]/70 md:text-lg"
          >
            Diesel and gas from the dock. If they didn’t write a number, it stays Call.
          </p>
          <p
            data-testid="hero-quiet"
            className="mt-3 text-sm text-[color:var(--cream)]/55"
          >
            Sabine to Key West
          </p>
          <p
            data-testid="hero-extra"
            className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--cream)]/45"
          >
            We don’t sell a gallon. We don’t lift a boat.
          </p>
          <p data-testid="board-tally" className="mt-6 text-sm text-[color:var(--cream)]/55">
            {tally.postedThisWeek} posted this week. {tally.call} still Call.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              data-testid="see-the-board"
              href="#board"
              className="inline-flex h-12 items-center rounded-md bg-[color:var(--cream)] px-5 text-sm font-medium text-[color:var(--ink)] hover:bg-[color:var(--cream)]/90"
            >
              See the board
            </a>
            <a
              data-testid="landing-report"
              href="/report"
              className="inline-flex h-12 items-center rounded-md border border-[color:var(--line)] bg-white px-5 text-sm font-medium text-[color:var(--cream)] hover:bg-[color:var(--panel)]"
            >
              Post a number
            </a>
          </div>
          <p data-testid="who-writes-this" className="mt-5 text-sm text-[color:var(--cream)]/50">
            <a
              className="underline decoration-[color:var(--cream)]/25 underline-offset-2 hover:text-[color:var(--cream)]/75"
              href="/about"
            >
              Who writes this.
            </a>
          </p>
          <Waterline className="mt-8" />
          <nav
            data-testid="landing-links"
            aria-label="More"
            className="mt-8 flex flex-col gap-2 text-sm text-[color:var(--cream)]/60 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
          >
            <a
              data-testid="landing-link-board"
              href="#board"
              className="inline-flex min-h-11 items-center underline decoration-[color:var(--cream)]/20 underline-offset-4 hover:text-[color:var(--cream)]"
            >
              The board
            </a>
            <a
              data-testid="landing-link-named-storm"
              href="/haul-out"
              className="inline-flex min-h-11 items-center underline decoration-[color:var(--cream)]/20 underline-offset-4 hover:text-[color:var(--cream)]"
            >
              When they name it
            </a>
            <a
              data-testid="landing-link-about"
              href="/about"
              className="inline-flex min-h-11 items-center underline decoration-[color:var(--cream)]/20 underline-offset-4 hover:text-[color:var(--cream)]"
            >
              About
            </a>
          </nav>
        </div>
      </section>
      <section
        id="board"
        data-testid="board"
        className="flex min-w-0 flex-col scroll-mt-[3.6rem] lg:h-[calc(100dvh-3.6rem)] lg:min-h-0 lg:overflow-hidden"
      >
        {query.reported ? (
          <p
            data-testid="report-saved"
            className="border-b border-[color:var(--line)] px-4 py-3 md:px-6"
          >
            <span className="mx-auto block max-w-7xl rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh">
              {reportedDock
                ? `On the board. ${reportedDock.name} now carries the time you saw.`
                : "On the board. That dock now carries the time you saw."}
            </span>
          </p>
        ) : null}
        <DockBoard query={query} inCorridor={inCorridor} visible={visible} />
      </section>
    </main>
  );
}
