import { freshnessLabel, pinTrust } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FreshnessBadge({ dock }: { dock: Dock }) {
  const label = freshnessLabel(dock);
  const trust = pinTrust(dock);
  return (
    <span
      className={cn(
        "shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.12em]",
        label === "Verified" && "text-[color:var(--sea)]",
        (label === "Last seen" || label === "Stale") && "text-[color:var(--gold)]",
        trust === "unverified" && "text-[color:var(--copper)]",
      )}
    >
      {label}
    </span>
  );
}
