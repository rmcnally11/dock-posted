"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { DockCard } from "@/components/dock-card";
import { FuelMap } from "@/components/fuel-map";
import { freshness } from "@/lib/freshness";
import { CORRIDORS, type CorridorId, type Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DockBoard({ docks }: { docks: Dock[] }) {
  const [corridor, setCorridor] = useState<CorridorId>("galveston-bay");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [e0Only, setE0Only] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);

  const inCorridor = useMemo(
    () => docks.filter((dock) => dock.corridor === corridor),
    [docks, corridor],
  );

  const visible = useMemo(() => {
    return inCorridor
      .filter((dock) => (e0Only ? dock.ethanol === "E0" : true))
      .filter((dock) => (freshOnly ? freshness(dock) === "fresh" : true));
  }, [inCorridor, e0Only, freshOnly]);

  const selected = visible.find((dock) => dock.id === selectedId) ?? null;
  const filtered = e0Only || freshOnly;

  function chooseCorridor(id: CorridorId) {
    setCorridor(id);
    setSelectedId(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:min-h-[calc(100dvh-14rem)] lg:flex-row">
      <section className="relative isolate h-[52vh] min-h-[320px] lg:h-auto lg:min-h-[28rem] lg:flex-1">
        <FuelMap
          docks={visible}
          corridor={corridor}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-2">
          <CorridorSwitch corridor={corridor} onChange={chooseCorridor} />
        </div>
      </section>

      <aside className="relative z-20 flex w-full flex-col border-t border-harbor/10 bg-foam lg:h-full lg:max-w-md lg:border-l lg:border-t-0">
        <div className="border-b border-harbor/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-harbor">{CORRIDORS[corridor].label}</h2>
              <p className="text-sm text-harbor/60">
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
            <CorridorSwitch corridor={corridor} onChange={chooseCorridor} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <FilterChip active={e0Only} onClick={() => setE0Only((value) => !value)}>
              E0 only
            </FilterChip>
            <FilterChip active={freshOnly} onClick={() => setFreshOnly((value) => !value)}>
              Fresh this week
            </FilterChip>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <EmptyList e0Only={e0Only} freshOnly={freshOnly} />
          ) : (
            visible.map((dock) => (
              <DockCard
                key={dock.id}
                dock={dock}
                selected={dock.id === selectedId}
                onSelect={setSelectedId}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function CorridorSwitch({
  corridor,
  onChange,
}: {
  corridor: CorridorId;
  onChange: (id: CorridorId) => void;
}) {
  return (
    <>
      {(Object.keys(CORRIDORS) as CorridorId[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "pointer-events-auto rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm",
            corridor === id ? "bg-harbor text-foam" : "bg-white text-harbor ring-1 ring-harbor/15",
          )}
        >
          {CORRIDORS[id].short}
        </button>
      ))}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-wake bg-wake/10 text-wake-deep"
          : "border-harbor/15 bg-white text-harbor/70",
      )}
    >
      {children}
    </button>
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
