import { freshnessLabel, pinTrust } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FreshnessBadge({ dock }: { dock: Dock }) {
  const label = freshnessLabel(dock);
  const trust = pinTrust(dock);
  return (
    <span
      className={cn(
        "shrink-0 text-[11px] font-medium",
        label === "Verified" && "text-fresh",
        (label === "Last seen" || label === "Stale") && "text-amber",
        trust === "unverified" && "text-rust",
      )}
    >
      {label}
    </span>
  );
}
