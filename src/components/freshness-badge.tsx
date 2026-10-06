import { pinKind, publicBadge } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FreshnessBadge({ dock }: { dock: Dock }) {
  const label = publicBadge(dock);
  const kind = pinKind(dock);
  return (
    <span
      data-testid={`freshness-${dock.id}`}
      className={cn(
        "max-w-[11rem] shrink-0 text-right text-[11px] font-medium leading-4",
        kind === "marina-site" && "text-[color:var(--diesel)]",
        kind === "report" && "text-[color:var(--gold)]",
        kind === "stale" && "text-[color:var(--stale)]",
        kind === "none" && "text-[color:var(--signal)]",
      )}
    >
      {label}
    </span>
  );
}
