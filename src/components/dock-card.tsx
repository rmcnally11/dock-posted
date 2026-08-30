import { FreshnessBadge } from "@/components/freshness-badge";
import { ethanolCopy, formatDate, formatQuote, sourceLabel } from "@/lib/format";
import { boardQuote, displayDiesel, displayGas, hasPostedPrice, pinTrust } from "@/lib/freshness";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

function accessLabel(dock: Dock): string | null {
  if (dock.access === "members") return "Members only";
  if (dock.access === "private") return "Club only";
  return null;
}

function payLabel(dock: Dock): string | null {
  if (dock.pay === "cash") return "Cash";
  if (dock.pay === "card") return "Card";
  if (dock.pay === "both") return "Cash or card";
  return null;
}

function dieselOnly(dock: Dock): boolean {
  const gas = dock.quotes.filter((quote) => quote.product !== "diesel");
  return gas.length > 0 && gas.every((quote) => quote.status === "not-sold");
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
  href: "/" | `/?${string}`;
}) {
  const gas = boardQuote(dock, displayGas(dock));
  const diesel = boardQuote(dock, displayDiesel(dock));
  const trust = pinTrust(dock);
  const flags = flagLabels(dock);

  return (
    <article
      className={cn(
        "w-full overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] text-left",
        selected && "border-[color:var(--sea)] ring-2 ring-[color:var(--sea)]/30",
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
            <h3 className="font-heading text-lg leading-tight text-[color:var(--cream)]">
              {dock.name}
            </h3>
            <p className="mt-0.5 text-sm text-[color:var(--cream)]/60">
              {dock.city}, {dock.state}
            </p>
            {flags.length > 0 ? (
              <p className="mt-1 text-[11px] font-medium tracking-wide text-[color:var(--cream)]/70">
                {flags.join(" · ")}
              </p>
            ) : null}
          </div>
          <FreshnessBadge dock={dock} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-[color:var(--ink)] px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--cream)]/50">Regular</dt>
            <dd className="font-mono text-[15px] font-medium tabular-nums text-[color:var(--cream)]">
              {formatQuote(gas)}
            </dd>
          </div>
          <div className="rounded-lg bg-[color:var(--ink)] px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--cream)]/50">Diesel</dt>
            <dd className="font-mono text-[15px] font-medium tabular-nums text-[color:var(--cream)]">
              {formatQuote(diesel)}
            </dd>
          </div>
          <div className="rounded-lg bg-[color:var(--ink)] px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--cream)]/50">Blend</dt>
            <dd className="font-mono text-[15px] font-medium tabular-nums text-[color:var(--cream)]">
              {ethanolCopy(dock.ethanol)}
            </dd>
          </div>
          <div className="rounded-lg bg-[color:var(--ink)] px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--cream)]/50">Hours</dt>
            <dd className="font-mono text-[15px] font-medium tabular-nums text-[color:var(--cream)]">
              {dock.hours ?? "Call"}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-[color:var(--cream)]/50" data-testid={`pin-trust-${dock.id}`}>
          <span className="mr-2 text-[11px] text-[color:var(--cream)]/50">Date</span>
          {formatDate(dock.lastVerifiedAt)}
          {trust === "verified"
            ? ` · Verified · ${sourceLabel(dock.lastVerifiedSource)}`
            : hasPostedPrice(dock)
              ? " · Last seen · Unverified"
              : dock.lastVerifiedAt
                ? " · Unverified"
                : ""}
        </p>
        {dock.phone ? (
          <p className="mt-1 text-xs text-[color:var(--cream)]/70">
            {hasPostedPrice(dock) ? dock.phone : `Call ahead · ${dock.phone}`}
          </p>
        ) : null}
      </a>
      <p className="border-t border-[color:var(--line)] px-3.5 py-2 text-[11px] text-[color:var(--cream)]/50">
        <a href={`/report?dock=${dock.id}`} className="underline-offset-2 hover:underline">
          {trust === "verified" ? "Update this pin" : "Claim this pin"}
        </a>
      </p>
    </article>
  );
}
