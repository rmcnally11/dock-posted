import { Badge } from "@/components/ui/badge";
import { freshness, freshnessLabel } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FreshnessBadge({ dock }: { dock: Dock }) {
  const state = freshness(dock);
  return (
    <Badge
      className={cn(
        "rounded-none font-medium tracking-[0.12em]",
        state === "fresh" && "bg-fresh/15 text-fresh",
        state === "stale" && "bg-amber/15 text-amber",
        (state === "call" || state === "no-report" || state === "never") &&
          "bg-rust/15 text-rust",
      )}
    >
      {freshnessLabel(dock)}
    </Badge>
  );
}
