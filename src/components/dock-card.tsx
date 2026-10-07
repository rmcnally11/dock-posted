import { FreshnessBadge } from "@/components/freshness-badge";
import { publicHours } from "@/lib/dock-page";
import { quoteParts, telHref, UNSTATED_PRICE_NOTE } from "@/lib/format";
import {
  pinQuoteSlots,
  publicCallLine,
  publicSource,
  reportLinkLabel,
  type PinQuoteSlot,
} from "@/lib/freshness";
import type { DockHref } from "@/lib/board-query";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

function accessLabel(dock: Dock): string | null {
  if (dock.access === "members" || dock.access === "private") return "Members’ dock";
  return null;
}

function payLabel(dock: Dock): string | null {
  if (dock.pay === "cash") return "Cash";
  if (dock.pay === "card") return "Card";
  if (dock.pay === "both") return "Cash or card";
  return null;
}

function quoteTone(slot: PinQuoteSlot): string {
  if (slot.suppressed) return "text-[color:var(--stale)]";
  const quote = slot.quote;
  if (!quote || quote.status === "not-sold") return "text-[color:var(--ink)]/55";
  if (quote.status !== "posted" || quote.pricePerGallon == null) return "text-[color:var(--signal)]";
  return slot.kind === "diesel" ? "text-[color:var(--diesel)]" : "text-[color:var(--signal)]";
}

function dieselOnly(dock: Dock): boolean {
  const gas = dock.quotes.filter((quote) => quote.product !== "diesel");
  return gas.length > 0 && gas.every((quote) => quote.status === "not-sold");
}

export function QuoteFigure({ slot }: { slot: PinQuoteSlot }) {
  if (slot.suppressed) {
    return <span className="price-blank">Too old to show</span>;
  }
  const parts = quoteParts(slot.quote, slot.kind);
  if (parts.blank) {
    return <span className="price-blank">{parts.figure}</span>;
  }
  return (
    <span className="flex flex-col gap-0.5">
      <span className="price-up">{parts.figure}</span>
      {parts.rest ? (
        <span className="font-mono text-[12px] font-medium tabular-nums text-current/70">{parts.rest}</span>
      ) : null}
    </span>
  );
}

function flagLabels(dock: Dock): string[] {
  const labels: string[] = [];
  if (dock.closed) labels.push("Closed");
  if (dock.flags?.includes("last-pump")) labels.push("Last pump");
  if (dock.flags?.includes("still-open") && !dock.closed) labels.push("Still open");
  if (dock.flags?.includes("west-of-146")) labels.push("West of 146");
  const access = accessLabel(dock);
  if (access) labels.push(access);
  if (dieselOnly(dock)) labels.push("Diesel only");
  const pay = payLabel(dock);
  if (pay) labels.push(pay);
  return labels;
}

export function DockQuoteGrid({
  dock,
  tileClassName,
}: {
  dock: Dock;
  tileClassName: string;
}) {
  const slots = pinQuoteSlots(dock);
  const showPriceNote = slots.some((slot) => {
    if (slot.suppressed) return false;
    return !quoteParts(slot.quote, slot.kind).blank;
  });
  return (
    <>
      {slots.map((slot) => (
        <div key={slot.id} className={tileClassName}>
          <dt className="sr-only">{slot.kind === "diesel" ? "Diesel" : "Gas"}</dt>
          <dd
            data-testid={`quote-${slot.id}-${dock.id}`}
            className={cn("mt-1", quoteTone(slot))}
          >
            <QuoteFigure slot={slot} />
          </dd>
        </div>
      ))}
      {showPriceNote ? (
        <div className="col-span-2 px-1 pt-1">
          <p data-testid={`price-note-${dock.id}`} className="text-[11px] leading-4 text-[color:var(--ink)]/55">
            {UNSTATED_PRICE_NOTE}
          </p>
        </div>
      ) : null}
    </>
  );
}

export function DockProvenance({ dock, className }: { dock: Dock; className?: string }) {
  const line = publicSource(dock);
  if (!line) return null;
  return (
    <p className={cn("text-xs text-[color:var(--ink)]/50", className)} data-testid={`pin-trust-${dock.id}`}>
      {line}
    </p>
  );
}

export function DockPhone({ dock, className }: { dock: Dock; className?: string }) {
  const line = publicCallLine(dock);
  if (!line || !dock.phone) return null;
  const callHref = telHref(dock.phone);
  if (!callHref) {
    return <p className={cn("text-sm text-[color:var(--ink)]/70", className)}>{line}</p>;
  }
  return (
    <p className={className}>
      <a
        href={callHref}
        className="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--diesel)] underline-offset-2 hover:underline"
      >
        {line}
      </a>
    </p>
  );
}

export function DockCard({
  dock,
  selected,
  href,
}: {
  dock: Dock;
  selected?: boolean;
  href: DockHref;
}) {
  const flags = flagLabels(dock);

  return (
    <article
      className={cn(
        "w-full overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--fog)] text-left",
        selected && "border-[color:var(--diesel)] ring-2 ring-[color:var(--diesel)]/30",
      )}
    >
      <a
        href={href}
        aria-current={selected ? "true" : undefined}
        data-testid={`dock-card-${dock.id}`}
        className="block p-5 hover:bg-white/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-lg leading-tight text-[color:var(--navy)]">
              {dock.name}
            </h3>
            <p className="mt-0.5 text-sm text-[color:var(--ink)]/70">
              {dock.city}, {dock.state}
            </p>
            {flags.length > 0 ? (
              <p className="mt-1 text-[11px] font-medium tracking-wide text-[color:var(--ink)]/70">
                {flags.join(" · ")}
              </p>
            ) : null}
          </div>
          <FreshnessBadge dock={dock} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <DockQuoteGrid dock={dock} tileClassName="rounded-lg bg-white px-3 py-2" />
        </dl>
        <dl className="mt-2 text-sm">
          <div className="rounded-lg bg-white px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Hours</dt>
            <dd className="font-mono text-[15px] font-medium text-[color:var(--navy)]">
              {publicHours(dock.hours).length > 0
                ? publicHours(dock.hours).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))
                : "—"}
            </dd>
          </div>
        </dl>

        <DockProvenance dock={dock} className="mt-3" />
      </a>
      <DockPhone dock={dock} className="px-5 pb-3" />
      <p className="border-t border-[color:var(--line)] px-3.5 py-2 text-[11px] text-[color:var(--ink)]/50">
        <a href={`/report?dock=${dock.id}`} className="underline-offset-2 hover:underline">
          {reportLinkLabel(dock)}
        </a>
      </p>
    </article>
  );
}
