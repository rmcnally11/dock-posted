import { DockCard } from "@/components/dock-card";
import { FuelMap } from "@/components/fuel-map";
import { SisterHandoff } from "@/components/sister-handoff";
import { SiteFooter } from "@/components/site-footer";
import { boardHref, dockPath, viewLabel, type BoardHref, type BoardQuery } from "@/lib/board-query";
import { runWatchHref } from "@/lib/income";
import { COAST_JUMPS, type Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const filtered = query.e0Only || query.freshOnly || query.q.length >= 2;

  return (
    <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:min-h-0 lg:flex-row">
      <section className="relative isolate h-[32vh] max-h-[32vh] min-h-[10.5rem] min-w-0 lg:h-auto lg:max-h-none lg:min-h-[28rem] lg:flex-1">
        <FuelMap docks={visible} query={query} />
        <div className="pointer-events-none absolute left-2 top-2 z-[600] flex max-w-[calc(100%-1rem)] flex-nowrap gap-1.5 overflow-x-auto">
          <HomePills query={query} />
        </div>
      </section>

      <aside className="relative z-20 flex min-w-0 w-full flex-col border-t border-[color:var(--line)] bg-[color:var(--cream)] lg:h-full lg:max-w-md lg:border-l lg:border-t-0">
        <div className="border-b border-[color:var(--line)] px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                data-testid="corridor-heading"
                className="font-heading text-xl text-[color:var(--navy)]"
              >
                {viewLabel(query)}
              </h2>
              <p data-testid="dock-count" className="text-sm text-[color:var(--ink)]/70">
                {filtered
                  ? `Showing ${visible.length} of ${inCorridor.length} docks`
                  : `${inCorridor.length} dock${inCorridor.length === 1 ? "" : "s"}`}
              </p>
              <p data-testid="board-fact" className="mt-1 text-xs text-[color:var(--ink)]/55">
                A blank is a fact. Silence is not a price.
              </p>
              <p className="mt-1 text-xs text-[color:var(--ink)]/55">
                <a
                  href={runWatchHref({ corridor: query.corridor, region: query.region })}
                  data-testid="board-run"
                  className="underline-offset-2 hover:underline"
                >
                  This trip
                </a>
                . Gallons you will burn.
              </p>
              <SisterHandoff
                corridor={query.corridor}
                region={query.region}
                state={query.state}
                compact
              />
              <p
                data-testid="pin-legend"
                aria-label="On the hose and no number"
                className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--ink)]/70"
              >
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--signal)]" />
                  No number
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--diesel)]" />
                  On the hose
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--gold)]" />
                  Last seen
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--diesel)]" />
                  Diesel
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--signal)]" />
                  Gas
                </span>
              </p>
              {query.corridor === "galveston-bay" && !query.state && !query.region && query.q.length < 2 ? (
                <p className="mt-1 text-xs text-[color:var(--ink)]/50">
                  Clear Lake mouth first. Hours beat a posted price. A 6:30 run cannot use
                  South Shore.
                </p>
              ) : null}
              {query.corridor === "upper-keys" && !query.state && !query.region && query.q.length < 2 ? (
                <p className="mt-1 text-xs text-[color:var(--ink)]/50">
                  E0 still pumping at first light, this side of the island. Islamorada is a
                  different run.
                </p>
              ) : null}
            </div>
            <a
              href={selected ? `/report?dock=${selected.id}` : "/report"}
              className="inline-flex h-11 shrink-0 items-center rounded-md bg-[color:var(--navy)] px-3 text-xs font-medium text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90 lg:h-8"
            >
              I was there
            </a>
          </div>

          <form action="/#board" method="get" className="mt-3 flex gap-2">
            {query.corridor ? <input type="hidden" name="corridor" value={query.corridor} /> : null}
            {query.state ? <input type="hidden" name="state" value={query.state} /> : null}
            {query.region ? <input type="hidden" name="region" value={query.region} /> : null}
            {query.e0Only ? <input type="hidden" name="e0" value="1" /> : null}
            {query.freshOnly ? <input type="hidden" name="fresh" value="1" /> : null}
            <label className="sr-only" htmlFor="dock-search">
              Search docks
            </label>
            <input
              id="dock-search"
              name="q"
              defaultValue={query.q}
              placeholder="Marina or city"
              className="h-11 min-w-0 flex-1 rounded-md border border-[color:var(--line)] bg-white px-3 text-base text-[color:var(--navy)] placeholder:text-[color:var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--diesel)]/40 lg:h-9 lg:text-sm"
            />
            <button
              type="submit"
              className="h-11 rounded-md border border-[color:var(--line)] bg-[color:var(--fog)] px-3 text-sm font-medium text-[color:var(--navy)] hover:bg-white lg:h-9 lg:text-xs"
            >
              Find
            </button>
          </form>

          <div
            data-testid="coast-jumps"
            className="chip-scroll mt-3 flex flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain"
          >
            {COAST_JUMPS.map((jump) => {
              const active =
                jump.kind === "corridor"
                  ? query.corridor === jump.id && !query.state && !query.region && query.q.length < 2
                  : jump.kind === "state"
                    ? query.state === jump.id && query.q.length < 2
                    : query.region === jump.id && query.q.length < 2;
              const href = boardHref({
                corridor: jump.kind === "corridor" ? jump.id : null,
                state: jump.kind === "state" ? jump.id : null,
                region: jump.kind === "region" ? jump.id : null,
                q: "",
                e0Only: query.e0Only,
                freshOnly: query.freshOnly,
                dock: null,
                reported: null,
              });
              return (
                <a
                  key={`${jump.kind}-${jump.id}`}
                  href={href}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center rounded-full border px-3 text-[11px] uppercase tracking-[0.14em] lg:h-auto lg:py-1",
                    active
                      ? "border-[color:var(--diesel)] bg-[color:var(--diesel)]/15 text-[color:var(--navy)]"
                      : "border-[color:var(--line)] text-[color:var(--ink)]/60 hover:text-[color:var(--navy)]",
                  )}
                >
                  {jump.short}
                </a>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <FilterChip
              active={query.e0Only}
              href={boardHref({ ...query, e0Only: !query.e0Only, dock: null })}
            >
              E0 only
            </FilterChip>
            <FilterChip
              active={query.freshOnly}
              href={boardHref({ ...query, freshOnly: !query.freshOnly, dock: null })}
            >
              This week
            </FilterChip>
          </div>
        </div>

        <div
          data-testid="dock-list"
          className="flex-1 space-y-2.5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:overflow-y-auto"
        >
          {visible.length === 0 ? (
            <EmptyList query={query} />
          ) : (
            visible.map((dock) => (
              <DockCard
                key={dock.id}
                dock={dock}
                selected={dock.id === query.dock}
                href={dockPath(dock.id)}
              />
            ))
          )}
        </div>
        <SiteFooter compact />
      </aside>
    </div>
  );
}

function HomePills({ query }: { query: BoardQuery }) {
  return (
    <>
      {(
        [
          { id: "galveston-bay" as const, short: "Clear Lake" },
          { id: "upper-keys" as const, short: "Keys" },
        ] as const
      ).map((item) => (
        <a
          key={item.id}
          href={boardHref({
            corridor: item.id,
            state: null,
            region: null,
            q: "",
            e0Only: query.e0Only,
            freshOnly: query.freshOnly,
            dock: null,
            reported: null,
          })}
          className={cn(
            "pointer-events-auto inline-flex h-11 shrink-0 items-center rounded-full border px-2.5 text-[11px] uppercase tracking-[0.14em] shadow-sm lg:h-auto lg:py-1",
            query.corridor === item.id && !query.state && !query.region
              ? "border-[color:var(--diesel)] bg-[color:var(--diesel)]/15 text-[color:var(--navy)]"
              : "border-[color:var(--line)] bg-[color:var(--cream)]/90 text-[color:var(--navy)]",
          )}
        >
          {item.short}
        </a>
      ))}
    </>
  );
}

function FilterChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: BoardHref;
  children: string;
}) {
  return (
    <a
      href={href}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 items-center rounded-md border px-2.5 text-xs lg:h-auto lg:py-1",
        active
          ? "border-[color:var(--navy)] text-[color:var(--navy)]"
          : "border-[color:var(--line)] text-[color:var(--ink)]/55",
      )}
    >
      {children}
    </a>
  );
}

function EmptyList({ query }: { query: BoardQuery }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--fog)] p-6 text-sm text-[color:var(--ink)]/70">
      {query.q.length >= 2
        ? `Nothing named “${query.q}”. Try Seabrook, Key Largo, or Beaufort.`
        : query.freshOnly || query.e0Only
          ? "No docks match. Clear E0 or This week."
          : "No docks here. Call the dock, or open Clear Lake or Key Largo."}
    </div>
  );
}
