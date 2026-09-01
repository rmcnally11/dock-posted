import { FreshnessBadge } from "@/components/freshness-badge";
import { ethanolCopy, formatDate, formatQuote, isBlankPrice, quoteParts, sourceLabel, telHref } from "@/lib/format";
import { boardQuote, displayDiesel, displayGas, hasPostedPrice, pinTrust } from "@/lib/freshness";
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

function quoteTone(quote: ReturnType<typeof boardQuote>, kind: "gas" | "diesel"): string {
  const text = formatQuote(quote);
  if (isBlankPrice(text)) return "text-[color:var(--signal)]";
  if (text === "Not sold") return "text-[color:var(--ink)]/55";
  return kind === "diesel" ? "text-[color:var(--diesel)]" : "text-[color:var(--signal)]";
}

function dieselOnly(dock: Dock): boolean {
  const gas = dock.quotes.filter((quote) => quote.product !== "diesel");
  return gas.length > 0 && gas.every((quote) => quote.status === "not-sold");
}

export function QuoteFigure({ quote }: { quote: ReturnType<typeof boardQuote> }) {
  const parts = quoteParts(quote);
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

export function DockCard({
  dock,
  selected,
  href,
}: {
  dock: Dock;
  selected?: boolean;
  href: DockHref;
}) {
  const gas = boardQuote(dock, displayGas(dock));
  const diesel = boardQuote(dock, displayDiesel(dock));
  const trust = pinTrust(dock);
  const flags = flagLabels(dock);
  const callHref = dock.phone ? telHref(dock.phone) : null;

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
          <div>
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
          <div className="rounded-lg bg-white px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Regular</dt>
            <dd
              data-testid={`quote-regular-${dock.id}`}
              className={cn("mt-1", quoteTone(gas, "gas"))}
            >
              <QuoteFigure quote={gas} />
            </dd>
          </div>
          <div className="rounded-lg bg-white px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Diesel</dt>
            <dd
              data-testid={`quote-diesel-${dock.id}`}
              className={cn("mt-1", quoteTone(diesel, "diesel"))}
            >
              <QuoteFigure quote={diesel} />
            </dd>
          </div>
          <div className="rounded-lg bg-white px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Blend</dt>
            <dd className="font-mono text-[15px] font-medium tabular-nums text-[color:var(--navy)]">
              {ethanolCopy(dock.ethanol)}
            </dd>
          </div>
        </dl>
        <dl className="mt-2 text-sm">
          <div className="rounded-lg bg-white px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Hours</dt>
            <dd className="font-mono text-[15px] font-medium text-[color:var(--navy)]">
              {dock.hours ?? "—"}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-[color:var(--ink)]/50" data-testid={`pin-trust-${dock.id}`}>
          <span className="mr-2 text-[11px] text-[color:var(--ink)]/50">Date</span>
          {formatDate(dock.lastVerifiedAt)}
          {trust === "verified"
            ? ` · Verified · ${sourceLabel(dock.lastVerifiedSource)}`
            : hasPostedPrice(dock)
              ? " · Last seen · Unverified"
              : dock.lastVerifiedAt
                ? " · Unverified"
                : ""}
        </p>
      </a>
      {callHref && dock.phone ? (
        <p className="px-5 pb-3">
          <a
            href={callHref}
            className="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--diesel)] underline-offset-2 hover:underline"
          >
            {hasPostedPrice(dock) ? dock.phone : `Call the dock · ${dock.phone}`}
          </a>
        </p>
      ) : dock.phone ? (
        <p className="px-5 pb-3 text-xs text-[color:var(--ink)]/70">
          {hasPostedPrice(dock) ? dock.phone : `Call the dock · ${dock.phone}`}
        </p>
      ) : null}
      <p className="border-t border-[color:var(--line)] px-3.5 py-2 text-[11px] text-[color:var(--ink)]/50">
        <a href={`/report?dock=${dock.id}`} className="underline-offset-2 hover:underline">
          {trust === "verified" ? "Update the number" : "I was there"}
        </a>
      </p>
    </article>
  );
}
