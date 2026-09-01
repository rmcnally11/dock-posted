import { DockBoard } from "@/components/dock-board";
import { Masthead } from "@/components/wordmark";
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
        className="flex min-h-0 flex-col justify-center bg-[color:var(--navy)] px-4 py-10 text-[color:var(--cream)] md:min-h-[calc(100dvh-3.6rem)] md:px-6 md:py-24"
      >
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-16">
          <div className="flex min-w-0 flex-col">
            <Masthead className="mb-8 lg:hidden" />
            <p
              data-testid="hero-kicker"
              className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]"
            >
              Marina fuel · Sabine to Key West
            </p>
            <h1
              data-testid="hero-headline"
              className="mt-4 max-w-4xl font-heading text-5xl leading-[1.05] text-[color:var(--cream)] md:text-7xl"
            >
              What they wrote on the pump.
            </h1>
            <p
              data-testid="hero-deck"
              className="mt-6 max-w-xl text-base leading-7 text-[color:var(--cream)]/70 md:text-lg"
            >
              Diesel and gas from the dock. If they didn’t put a number up, we leave it blank. Call the dock.
            </p>
            <p
              data-testid="hero-geo"
              className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--cream)]/55"
            >
              Sabine to Key West. Then the rest of the saltwater coast.
            </p>
            <p
              data-testid="hero-extra"
              className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--cream)]/55"
            >
              We don’t sell fuel. We don’t pull your boat.
            </p>
            <p data-testid="board-tally" className="mt-6 text-sm text-[color:var(--cream)]/55">
              {tally.postedThisWeek} {tally.postedThisWeek === 1 ? "dock wrote" : "docks wrote"} a
              number this week. Most still haven’t. That’s normal. That’s why the phone is on the
              card.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                data-testid="see-the-board"
                href="#board"
                className="inline-flex h-12 items-center rounded-md bg-[color:var(--cream)] px-5 text-sm font-medium text-[color:var(--navy)] hover:bg-[color:var(--cream)]/90"
              >
                See today’s docks
              </a>
              <a
                data-testid="landing-report"
                href="/report"
                className="inline-flex h-12 items-center rounded-md border border-[color:var(--cream)]/25 bg-transparent px-5 text-sm font-medium text-[color:var(--cream)] hover:bg-[color:var(--cream)]/8"
              >
                I was there
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
                Today
              </a>
              <a
                data-testid="landing-link-named-storm"
                href="/haul-out"
                className="inline-flex min-h-11 items-center underline decoration-[color:var(--cream)]/20 underline-offset-4 hover:text-[color:var(--cream)]"
              >
                When they name it
              </a>
              <a
                data-testid="landing-link-pin"
                href="/pin"
                className="inline-flex min-h-11 items-center underline decoration-[color:var(--cream)]/20 underline-offset-4 hover:text-[color:var(--cream)]"
              >
                Your dock
              </a>
              <a
                data-testid="landing-link-run"
                href="/run"
                className="inline-flex min-h-11 items-center underline decoration-[color:var(--cream)]/20 underline-offset-4 hover:text-[color:var(--cream)]"
              >
                This trip
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
          <div
            data-testid="cover-brand"
            className="hidden min-w-0 justify-end lg:flex"
            aria-hidden="true"
          >
            <img
              src="/logo.svg"
              alt=""
              width={720}
              height={280}
              className="h-56 w-auto max-w-full xl:h-72"
            />
          </div>
        </div>
      </section>
      <section
        id="board"
        data-testid="board"
        className="flex min-w-0 flex-col scroll-mt-[3.6rem] bg-[color:var(--cream)] lg:h-[calc(100dvh-3.6rem)] lg:min-h-0 lg:overflow-hidden"
      >
        {query.reported ? (
          <p
            data-testid="report-saved"
            className="border-b border-[color:var(--line)] px-4 py-3 md:px-6"
          >
            <span className="mx-auto block max-w-7xl rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh">
              {reportedDock
                ? `On the hose. ${reportedDock.name} now carries the time you saw.`
                : "On the hose. That dock now carries the time you saw."}
            </span>
          </p>
        ) : null}
        <DockBoard query={query} inCorridor={inCorridor} visible={visible} />
      </section>
    </main>
  );
}
