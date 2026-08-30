import { Badge } from "@/components/ui/badge";
import { freshnessLabel, pinTrust } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FreshnessBadge({ dock }: { dock: Dock }) {
  const label = freshnessLabel(dock);
  const trust = pinTrust(dock);
  return (
    <Badge
      className={cn(
        "rounded-none font-medium tracking-[0.12em]",
        label === "Verified" && "bg-fresh/15 text-fresh",
        (label === "Last seen" || label === "Stale") && "bg-amber/15 text-amber",
        trust === "unverified" && "bg-rust/15 text-rust",
      )}
    >
      {label}
    </Badge>
  );
}
