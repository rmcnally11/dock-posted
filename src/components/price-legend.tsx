import { PRICE_LEGEND } from "@/lib/freshness";
import { cn } from "@/lib/utils";

export function PriceLegend({
  className,
  testId,
  ariaHidden = false,
}: {
  className?: string;
  testId?: string;
  ariaHidden?: boolean;
}) {
  return (
    <p
      data-testid={testId}
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaHidden ? undefined : "Price colors"}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}
    >
      {PRICE_LEGEND.map((item) => (
        <span key={item.kind} className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: item.swatch }}
          />
          {item.label}
        </span>
      ))}
    </p>
  );
}
