import { CoastChips } from "@/components/coast-chips";
import { DockCard } from "@/components/dock-card";
import { FuelMap } from "@/components/fuel-map";
import { SiteFooter } from "@/components/site-footer";
import { boardHref, viewLabel, type BoardQuery } from "@/lib/board-query";
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
    <div className="flex min-h-0 flex-1 flex-col lg:min-h-[calc(100dvh-13rem)] lg:flex-row">
      <section className="relative isolate h-[46vh] min-h-[280px] lg:h-auto lg:min-h-[28rem] lg:flex-1">
        <FuelMap docks={visible} query={query} />
        <div className="pointer-events-none absolute left-2 top-2 z-[600] hidden max-w-[calc(100%-1rem)] flex-wrap gap-1.5 sm:flex">
          <HomePills query={query} />
        </div>
      </section>

      <aside className="relative z-20 flex w-full flex-col border-t border-harbor/15 bg-paper lg:h-full lg:max-w-md lg:border-l lg:border-t-0">
        <div className="border-b border-harbor/10 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 data-testid="corridor-heading" className="font-serif text-xl text-harbor">
                {viewLabel(query)}
              </h2>
              <p data-testid="dock-count" className="text-sm text-[color:var(--cream)]/55">
                {filtered
                  ? `Showing ${visible.length} of ${inCorridor.length} docks`
                  : `${inCorridor.length} dock${inCorridor.length === 1 ? "" : "s"} on this water`}
              </p>
            </div>
            <a
              href={selected ? `/report?dock=${selected.id}` : "/report"}
              className="inline-flex h-8 items-center border border-harbor bg-harbor px-3 text-xs font-medium text-sand hover:bg-harbor-soft"
            >
              Report
            </a>
          </div>

          <form action="/" method="get" className="mt-3 flex gap-2">
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
              className="h-9 min-w-0 flex-1 border border-harbor/20 bg-white px-3 text-sm text-harbor placeholder:text-harbor/40 focus:outline-none focus:ring-2 focus:ring-wake/40"
            />
            <button
              type="submit"
              className="h-9 border border-harbor/20 bg-sand px-3 text-xs font-medium text-harbor hover:bg-white"
            >
              Find
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-1.5">
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
                    "shrink-0 border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
                    active
                      ? "border-harbor bg-harbor text-sand"
                      : "border-harbor/15 bg-white text-harbor/70",
                  )}
                >
                  {jump.short}
                </a>
              );
            })}
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
              This week
            </FilterChip>
          </div>
        </div>

        <div data-testid="dock-list" className="flex-1 space-y-2.5 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <EmptyList query={query} />
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
            "pointer-events-auto border px-2.5 py-1 text-[11px] font-semibold shadow-sm",
            query.corridor === item.id && !query.state && !query.region
              ? "border-harbor bg-harbor text-sand"
              : "border-harbor/20 bg-paper/95 text-harbor",
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
  href: "/" | `/?${string}`;
  children: string;
}) {
  return (
    <a
      href={href}
      aria-pressed={active}
      className={cn(
        "border px-3 py-1 text-xs font-medium",
        active
          ? "border-wake bg-wake/10 text-wake-deep"
          : "border-harbor/15 bg-white text-harbor/70",
      )}
    >
      {children}
    </a>
  );
}

function EmptyList({ query }: { query: BoardQuery }) {
  return (
    <div className="border border-dashed border-harbor/25 bg-white p-6 text-sm text-harbor/70">
      {query.q.length >= 2
        ? `Nothing named “${query.q}” on this chart. Try a town — Kemah, Islamorada, Beaufort.`
        : query.freshOnly || query.e0Only
          ? "No docks on this water match those chips. Clear one and look again."
          : "No docks on this water. Open Clear Lake or the Keys, or search a town."}
    </div>
  );
}
