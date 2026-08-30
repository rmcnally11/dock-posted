import { AllCoastsBoard } from "@/components/all-coasts-board";
import { CoastChips } from "@/components/coast-chips";
import { DockBoard } from "@/components/dock-board";
import { Waterline } from "@/components/waterline";
import { filterDocks, parseBoardQuery } from "@/lib/board-query";
import { readDocks } from "@/lib/store";
import { CORRIDORS } from "@/lib/types";

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
  const reportedDock = query.reported
    ? docks.find((dock) => dock.id === query.reported)
    : null;

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:h-[calc(100dvh-3.6rem)]">
      <section className="border-b border-harbor/15 bg-sand/80 px-4 py-3 md:px-6 paper-grain">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p data-testid="hero-kicker" className="text-sm font-medium text-wake-deep">
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

      {query.corridor == null ? (
        <AllCoastsBoard docks={docks} />
      ) : (
        <>
          <section className="border-b border-[color:var(--line)] px-4 py-4 md:px-6">
            <div className="mx-auto max-w-7xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]">
                {CORRIDORS[query.corridor].state} · one stretch
              </p>
              <h1 className="mt-1 font-heading text-3xl text-[color:var(--cream)] md:text-4xl">
                {CORRIDORS[query.corridor].label}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[color:var(--cream)]/65">
                Call ahead. A missing number is Call, not a guess. Sister page:{" "}
                <a className="text-[color:var(--sea)] underline" href="https://onthiswater.com">
                  On This Water
                </a>
                .
              </p>
              <Waterline className="mt-3" />
            </div>
          </section>
          <DockBoard query={query} inCorridor={inCorridor} visible={visible} />
        </>
      )}
    </main>
  );
}
