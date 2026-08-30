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

      <aside className="relative z-20 flex w-full flex-col border-t border-[color:var(--line)] bg-[color:var(--ink)]/70 lg:h-full lg:max-w-md lg:border-l lg:border-t-0">
        <div className="border-b border-[color:var(--line)] px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                data-testid="corridor-heading"
                className="font-heading text-xl text-[color:var(--cream)]"
              >
                {viewLabel(query)}
              </h2>
              <p data-testid="dock-count" className="text-sm text-[color:var(--cream)]/60">
                {filtered
                  ? `Showing ${visible.length} of ${inCorridor.length} docks`
                  : `${inCorridor.length} dock${inCorridor.length === 1 ? "" : "s"}`}
              </p>
              {query.corridor === "galveston-bay" && !query.state && !query.region && query.q.length < 2 ? (
                <p className="mt-1 text-xs text-[color:var(--cream)]/50">
                  Clear Lake mouth first. Hours beat a posted price. A 6:30 run cannot use
                  South Shore.
                </p>
              ) : null}
              {query.corridor === "upper-keys" && !query.state && !query.region && query.q.length < 2 ? (
                <p className="mt-1 text-xs text-[color:var(--cream)]/50">
                  E0 still pumping at first light, this side of the island. Islamorada is a
                  different run.
                </p>
              ) : null}
            </div>
            <a
              href={selected ? `/report?dock=${selected.id}` : "/report"}
              className="inline-flex h-8 items-center rounded-md bg-[color:var(--cream)] px-3 text-xs font-medium text-[color:var(--ink)] hover:bg-[color:var(--cream)]/90"
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
              className="h-9 min-w-0 flex-1 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm text-[color:var(--cream)] placeholder:text-[color:var(--cream)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--sea)]/40"
            />
            <button
              type="submit"
              className="h-9 rounded-md border border-[color:var(--line)] bg-[color:var(--panel)] px-3 text-xs font-medium text-[color:var(--cream)] hover:bg-white"
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
                    "shrink-0 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em]",
                    active
                      ? "border-[color:var(--sea)] bg-[color:var(--sea)]/20 text-[color:var(--cream)]"
                      : "border-[color:var(--line)] text-[color:var(--cream)]/60 hover:text-[color:var(--cream)]",
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
            "pointer-events-auto rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] shadow-sm",
            query.corridor === item.id && !query.state && !query.region
              ? "border-[color:var(--sea)] bg-[color:var(--sea)]/20 text-[color:var(--cream)]"
              : "border-[color:var(--line)] bg-[color:var(--ink)]/90 text-[color:var(--cream)]",
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
        "rounded-md border px-2.5 py-1 text-xs",
        active
          ? "border-[color:var(--cream)] text-[color:var(--cream)]"
          : "border-[color:var(--line)] text-[color:var(--cream)]/55",
      )}
    >
      {children}
    </a>
  );
}

function EmptyList({ query }: { query: BoardQuery }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-sm text-[color:var(--cream)]/70">
      {query.q.length >= 2
        ? `Nothing named “${query.q}”. Try Seabrook, Key Largo, or Beaufort.`
        : query.freshOnly || query.e0Only
          ? "No docks match. Clear E0 or This week."
          : "No docks here. Call the dock, or open Clear Lake or Key Largo."}
    </div>
  );
}
