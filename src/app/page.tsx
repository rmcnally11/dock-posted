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
    e0?: string;
    fresh?: string;
    dock?: string;
  }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;
  const query = parseBoardQuery(params);
  const { inCorridor, visible } = filterDocks(docks, query);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <section className="border-b border-[color:var(--line)] px-4 py-4 md:px-6">
        <div className="mx-auto max-w-7xl space-y-3">
          <CoastChips query={query} />
          {query.reported ? (
            <p
              data-testid="report-saved"
              className="rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh"
            >
              Report saved. The map now uses your last-verified time for that dock.
            </p>
          ) : null}
        </div>
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
