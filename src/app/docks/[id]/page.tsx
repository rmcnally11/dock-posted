import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { boardHref } from "@/lib/board-query";
import { ethanolCopy, formatDate, formatQuote, sourceLabel, telHref } from "@/lib/format";
import { dockWaterLabel, runWatchHref } from "@/lib/income";
import { boardQuote, displayDiesel, displayGas, hasPostedPrice, pinTrust } from "@/lib/freshness";
import { readDocks } from "@/lib/store";
import type { Dock } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function quoteTone(quote: ReturnType<typeof boardQuote>, kind: "gas" | "diesel"): string {
  const text = formatQuote(quote);
  if (text === "Call") return "text-[color:var(--signal)]";
  if (text === "Not sold") return "text-[color:var(--ink)]/55";
  return kind === "diesel" ? "text-[color:var(--diesel)]" : "text-[color:var(--signal)]";
}

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

function dockJsonLd(dock: Dock) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: dock.name,
    description: "The price they posted. If they didn’t write a number, it stays Call.",
    url: `https://dock-posted.vercel.app/docks/${dock.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: dock.city,
      addressRegion: dock.state,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: dock.lat,
      longitude: dock.lng,
    },
    ...(dock.phone ? { telephone: dock.phone } : {}),
  };
}

function dockDescription(dock: Dock): string {
  return `${dock.name}, ${dock.city}, ${dock.state}. The price they posted. If they didn’t write a number, it stays Call.`;
}

async function loadDock(id: string): Promise<Dock | null> {
  const docks = await readDocks();
  return docks.find((dock) => dock.id === id) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dock = await loadDock(id);
  if (!dock) return { title: "Dock" };
  const description = dockDescription(dock);
  return {
    title: dock.name,
    description,
    alternates: { canonical: `/docks/${dock.id}` },
    openGraph: {
      title: dock.name,
      description,
      url: `/docks/${dock.id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dock.name,
      description,
    },
  };
}

export default async function DockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dock = await loadDock(id);
  if (!dock) notFound();

  const gas = boardQuote(dock, displayGas(dock));
  const diesel = boardQuote(dock, displayDiesel(dock));
  const trust = pinTrust(dock);
  const flags = flagLabels(dock);
  const callHref = dock.phone ? telHref(dock.phone) : null;

  return (
    <main
      data-testid="dock-page"
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6"
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">
        The dock
      </p>
      <h1
        data-testid="dock-page-name"
        className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl"
      >
        {dock.name}
      </h1>
      <p className="mt-2 text-sm text-[color:var(--ink)]/70">
        {dock.city}, {dock.state}
      </p>
      {flags.length > 0 ? (
        <p className="mt-1 text-[11px] font-medium tracking-wide text-[color:var(--ink)]/70">
          {flags.join(" · ")}
        </p>
      ) : null}
      <p className="mt-3 max-w-2xl text-sm text-[color:var(--ink)]/55">
        Call is a fact. A blank stays Call.
      </p>
      <Waterline className="mt-3" />

      <dl className="mt-8 grid max-w-xl grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-[color:var(--fog)] px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Regular</dt>
          <dd
            data-testid={`quote-regular-${dock.id}`}
            className={cn("font-mono text-[15px] font-medium tabular-nums", quoteTone(gas, "gas"))}
          >
            {formatQuote(gas)}
          </dd>
        </div>
        <div className="rounded-lg bg-[color:var(--fog)] px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Diesel</dt>
          <dd
            data-testid={`quote-diesel-${dock.id}`}
            className={cn("font-mono text-[15px] font-medium tabular-nums", quoteTone(diesel, "diesel"))}
          >
            {formatQuote(diesel)}
          </dd>
        </div>
        <div className="rounded-lg bg-[color:var(--fog)] px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Blend</dt>
          <dd className="font-mono text-[15px] font-medium tabular-nums text-[color:var(--navy)]">
            {ethanolCopy(dock.ethanol)}
          </dd>
        </div>
        <div className="col-span-2 rounded-lg bg-[color:var(--fog)] px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Hours</dt>
          <dd className="font-mono text-[15px] font-medium text-[color:var(--navy)]">
            {dock.hours ?? "Hours Call"}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-[color:var(--ink)]/50" data-testid={`pin-trust-${dock.id}`}>
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

      {callHref && dock.phone ? (
        <p className="mt-5">
          <a
            href={callHref}
            className="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--diesel)] underline-offset-2 hover:underline"
          >
            {hasPostedPrice(dock) ? dock.phone : `Call the dock · ${dock.phone}`}
          </a>
        </p>
      ) : dock.phone ? (
        <p className="mt-5 text-sm text-[color:var(--ink)]/70">
          {hasPostedPrice(dock) ? dock.phone : `Call the dock · ${dock.phone}`}
        </p>
      ) : null}

      {dock.website ? (
        <p className="mt-2 text-sm">
          <a
            href={dock.website}
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          >
            Their page
          </a>
        </p>
      ) : null}

      <p className="mt-6 text-sm text-[color:var(--ink)]/70">
        <a
          href={boardHref({
            corridor: null,
            state: null,
            region: null,
            q: "",
            e0Only: false,
            freshOnly: false,
            dock: dock.id,
            reported: null,
          })}
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          On the board
        </a>
        {" · "}
        <a
          href={`/report?dock=${dock.id}`}
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          {trust === "verified" ? "Update this pin" : "Claim this pin"}
        </a>
      </p>
      <p className="mt-3 max-w-xl text-sm text-[color:var(--ink)]/70">
        <a
          href={`/report?dock=${dock.id}&who=marina`}
          data-testid="run-this-dock"
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          I run this dock
        </a>
        . Truck day, or when you change the board.
      </p>
      <p className="mt-2 max-w-xl text-sm text-[color:var(--ink)]/70">
        <a
          href={`/pin?dock=${dock.id}`}
          data-testid="own-this-pin"
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          Own this pin
        </a>
        . You write the number.
      </p>
      <p className="mt-2 max-w-xl text-sm text-[color:var(--ink)]/70">
        <a
          href={runWatchHref({ corridor: dock.corridor, region: dock.region })}
          data-testid="this-water"
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          This water
        </a>
        . {dockWaterLabel(dock)}. Gallons you will burn.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dockJsonLd(dock)) }}
      />
      <SiteFooter />
    </main>
  );
}
