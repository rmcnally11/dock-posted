import { FreshnessBadge } from "@/components/freshness-badge";
import { ethanolCopy, formatDate, formatQuote, sourceLabel } from "@/lib/format";
import { displayDiesel, displayGas, freshness } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DockCard({
  dock,
  selected,
  href,
}: {
  dock: Dock;
  selected?: boolean;
  href: "/" | `/?${string}`;
}) {
  const gas = displayGas(dock);
  const diesel = displayDiesel(dock);
  const state = freshness(dock);

  return (
    <a
      href={href}
      aria-current={selected ? "true" : undefined}
      data-testid={`dock-card-${dock.id}`}
      className={cn(
        "block w-full rounded-xl border p-4 text-left shadow-sm transition",
        selected
          ? "border-[color:var(--sea)] bg-[color:var(--panel)] ring-2 ring-[color:var(--sea)]/30"
          : "border-[color:var(--line)] bg-white hover:border-[color:var(--cream)]/20",
        state === "call" && !selected && "border-l-4 border-l-rust",
        state === "stale" && !selected && "border-l-4 border-l-amber",
        state === "fresh" && !selected && "border-l-4 border-l-fresh",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg leading-tight text-[color:var(--cream)]">{dock.name}</h3>
          <p className="mt-0.5 text-sm text-harbor/60">
            {dock.city}, {dock.state}
            {dock.access !== "public" ? ` · ${dock.access}` : ""}
          </p>
        </div>
        <FreshnessBadge dock={dock} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-sand px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-harbor/50">Gas</dt>
          <dd className="font-semibold tabular-nums text-harbor">{formatQuote(gas)}</dd>
        </div>
        <div className="rounded-lg bg-sand px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-harbor/50">Diesel</dt>
          <dd className="font-semibold tabular-nums text-harbor">{formatQuote(diesel)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-harbor/65">
        {ethanolCopy(dock.ethanol)}
        {dock.hours ? ` · ${dock.hours}` : ""}
      </p>
      <p className="mt-1 text-xs text-harbor/50">
        Last verified {formatDate(dock.lastVerifiedAt)} · {sourceLabel(dock.lastVerifiedSource)}
      </p>
      {dock.phone ? (
        <p className="mt-1 text-xs text-harbor/70">
          Call ahead: <span className="tabular-nums">{dock.phone}</span>
        </p>
      ) : null}
    </a>
  );
}
