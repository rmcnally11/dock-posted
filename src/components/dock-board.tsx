import { CoastChips } from "@/components/coast-chips";
import { DockCard } from "@/components/dock-card";
import { FuelMap } from "@/components/fuel-map";
import { boardHref, type BoardQuery } from "@/lib/board-query";
import { CORRIDORS, type Dock } from "@/lib/types";

export function DockBoard({
  query,
  inCorridor,
  visible,
}: {
  query: BoardQuery;
  inCorridor: Dock[];
  visible: Dock[];
}) {
  const selected = visible.find((dock) => dock.id === query.dock) ?? null;
  const filtered = query.e0Only || query.freshOnly;
  const label = query.corridor ? CORRIDORS[query.corridor].label : "All water";

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:min-h-[calc(100dvh-16rem)] lg:flex-row">
      <section className="relative isolate h-[52vh] min-h-[320px] lg:h-auto lg:min-h-[28rem] lg:flex-1">
        <FuelMap docks={visible} query={query} />
      </section>

      <aside className="relative z-20 flex w-full flex-col border-t border-[color:var(--line)] bg-white lg:h-full lg:max-w-md lg:border-l lg:border-t-0">
        <div className="border-b border-[color:var(--line)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 data-testid="corridor-heading" className="font-heading text-xl text-[color:var(--cream)]">
                {label}
              </h2>
              <p data-testid="dock-count" className="text-sm text-[color:var(--cream)]/55">
                {filtered
                  ? `Showing ${visible.length} of ${inCorridor.length} docks`
                  : `${inCorridor.length} dock${inCorridor.length === 1 ? "" : "s"} · prices go stale after 7 days`}
              </p>
            </div>
            <a
              href={selected ? `/report?dock=${selected.id}` : "/report"}
              className="inline-flex h-8 items-center rounded-md bg-[color:var(--sea)] px-3 text-xs font-medium text-white"
            >
              Report
            </a>
          </div>
          <div className="mt-3">
            <CoastChips query={query} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={boardHref({ ...query, e0Only: !query.e0Only, dock: null })}
              aria-pressed={query.e0Only}
              className={
                query.e0Only
                  ? "rounded-full border border-[color:var(--sea)] bg-[color:var(--sea)]/10 px-3 py-1 text-xs text-[color:var(--sea)]"
                  : "rounded-full border border-[color:var(--line)] bg-white px-3 py-1 text-xs text-[color:var(--cream)]/70"
              }
            >
              E0 only
            </a>
            <a
              href={boardHref({ ...query, freshOnly: !query.freshOnly, dock: null })}
              aria-pressed={query.freshOnly}
              className={
                query.freshOnly
                  ? "rounded-full border border-[color:var(--sea)] bg-[color:var(--sea)]/10 px-3 py-1 text-xs text-[color:var(--sea)]"
                  : "rounded-full border border-[color:var(--line)] bg-white px-3 py-1 text-xs text-[color:var(--cream)]/70"
              }
            >
              Fresh this week
            </a>
          </div>
        </div>

        <div data-testid="dock-list" className="flex-1 space-y-3 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-sm text-[color:var(--cream)]/70">
              {filtered
                ? "No docks match those filters in this stretch. Clear a chip and try again."
                : "No docks loaded. Run npm run seed and refresh."}
            </div>
          ) : (
            visible.map((dock) => (
              <DockCard
                key={dock.id}
                dock={dock}
                selected={dock.id === query.dock}
                href={boardHref({ ...query, dock: dock.id })}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
