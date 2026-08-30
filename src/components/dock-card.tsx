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
        "block w-full border p-3.5 text-left transition",
        selected ? "border-harbor bg-sand" : "border-harbor/12 bg-white hover:border-harbor/30",
        state === "fresh" && !selected && "border-l-[3px] border-l-fresh",
        state === "stale" && !selected && "border-l-[3px] border-l-amber",
        (state === "call" || state === "no-report" || state === "never") &&
          !selected &&
          "border-l-[3px] border-l-rust",
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
        <div className="bg-sand px-3 py-2">
          <dt className="kicker text-harbor/45">Gas</dt>
          <dd className="font-mono text-[15px] font-medium tabular-nums text-harbor">
            {formatQuote(gas)}
          </dd>
        </div>
        <div className="bg-sand px-3 py-2">
          <dt className="kicker text-harbor/45">Diesel</dt>
          <dd className="font-mono text-[15px] font-medium tabular-nums text-harbor">
            {formatQuote(diesel)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-harbor/65">
        {ethanolCopy(dock.ethanol)}
        {dock.hours ? ` · ${dock.hours}` : ""}
      </p>
      <p className="mt-1 text-xs text-harbor/50">
        {formatDate(dock.lastVerifiedAt)} · {sourceLabel(dock.lastVerifiedSource)}
      </p>
      {dock.phone ? (
        <p className="mt-1 text-xs text-harbor/70">
          {dock.phone}
        </p>
      ) : null}
    </a>
  );
}
