import Link from "next/link";
import { DockCard } from "@/components/dock-card";
import { FuelMap } from "@/components/fuel-map";
import { boardHref, type BoardQuery } from "@/lib/board-query";
import { CORRIDORS, type CorridorId, type Dock } from "@/lib/types";
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
  const filtered = query.e0Only || query.freshOnly;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:min-h-[calc(100dvh-14rem)] lg:flex-row">
      <section className="relative isolate h-[52vh] min-h-[320px] lg:h-auto lg:min-h-[28rem] lg:flex-1">
        <FuelMap docks={visible} query={query} />
        <div className="pointer-events-none absolute left-3 top-3 z-[600] flex max-w-[calc(100%-4.5rem)] flex-wrap gap-2">
          <CorridorSwitch query={query} />
        </div>
      </section>

      <aside className="relative z-20 flex w-full flex-col border-t border-harbor/10 bg-foam lg:h-full lg:max-w-md lg:border-l lg:border-t-0">
        <div className="border-b border-harbor/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 data-testid="corridor-heading" className="font-serif text-xl text-harbor">
                {CORRIDORS[query.corridor].label}
              </h2>
              <p data-testid="dock-count" className="text-sm text-harbor/60">
                {filtered
                  ? `Showing ${visible.length} of ${inCorridor.length} docks`
                  : `${inCorridor.length} dock${inCorridor.length === 1 ? "" : "s"} · prices go stale after 7 days`}
              </p>
            </div>
            <Link
              href={selected ? `/report?dock=${selected.id}` : "/report"}
              className="inline-flex h-8 items-center rounded-md bg-wake px-3 text-xs font-medium text-foam hover:bg-wake-deep"
            >
              Report
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <CorridorSwitch query={query} />
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
              Fresh this week
            </FilterChip>
          </div>
        </div>

        <div data-testid="dock-list" className="flex-1 space-y-3 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <EmptyList e0Only={query.e0Only} freshOnly={query.freshOnly} />
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

function CorridorSwitch({ query }: { query: BoardQuery }) {
  return (
    <>
      {(Object.keys(CORRIDORS) as CorridorId[]).map((id) => (
        <Link
          key={id}
          href={boardHref({ ...query, corridor: id, dock: null })}
          className={cn(
            "pointer-events-auto rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm",
            query.corridor === id ? "bg-harbor text-foam" : "bg-white text-harbor ring-1 ring-harbor/15",
          )}
        >
          {CORRIDORS[id].short}
        </Link>
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
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-wake bg-wake/10 text-wake-deep"
          : "border-harbor/15 bg-white text-harbor/70",
      )}
    >
      {children}
    </Link>
  );
}

function EmptyList({ e0Only, freshOnly }: { e0Only: boolean; freshOnly: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-harbor/20 bg-white p-6 text-sm text-harbor/70">
      {freshOnly || e0Only
        ? "No docks match those filters in this corridor. Clear a chip and try again."
        : "No docks loaded. Run npm run seed and refresh."}
    </div>
  );
}
