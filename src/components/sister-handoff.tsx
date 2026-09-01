import { conditionsHref, type SisterPlace } from "@/lib/sister";

export function SisterHandoff({
  corridor,
  region,
  state,
  city,
  compact = false,
}: SisterPlace & { compact?: boolean }) {
  const next = conditionsHref({ corridor, region, state, city });
  return (
    <p
      data-testid="sister-handoff"
      className={
        compact
          ? "mt-1 text-xs text-[color:var(--ink)]/55"
          : "mt-4 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/60"
      }
    >
      Tide and wind before you leave —{" "}
      <a
        href={next.href}
        data-testid="sister-handoff-link"
        className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
      >
        {next.label}
      </a>
      . Posted fuel lives here.
    </p>
  );
}
