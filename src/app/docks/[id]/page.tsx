import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DockPhone, DockProvenance, DockQuoteGrid } from "@/components/dock-card";
import { FreshnessBadge } from "@/components/freshness-badge";
import { SisterHandoff } from "@/components/sister-handoff";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { boardHref } from "@/lib/board-query";
import { dockWaterLabel, runWatchHref } from "@/lib/income";
import { reportLinkLabel } from "@/lib/freshness";
import { readDocks } from "@/lib/store";
import type { Dock } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    description: "What they wrote on the pump. If they didn’t, we leave it blank. Call the dock.",
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
  return `${dock.name}, ${dock.city}, ${dock.state}. What they wrote on the pump. If they didn’t, we leave it blank. Call the dock.`;
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

  const flags = flagLabels(dock);

  return (
    <main
      data-testid="dock-page"
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6"
    >
      <p className="kicker text-[color:var(--signal)]">
        The dock
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h1
          data-testid="dock-page-name"
          className="page-title min-w-0 flex-1 text-[color:var(--navy)]"
        >
          {dock.name}
        </h1>
        <FreshnessBadge dock={dock} />
      </div>
      <p className="mt-2 text-sm text-[color:var(--ink)]/70">
        {dock.city}, {dock.state}
      </p>
      {flags.length > 0 ? (
        <p className="mt-1 text-[11px] font-medium tracking-wide text-[color:var(--ink)]/70">
          {flags.join(" · ")}
        </p>
      ) : null}
      <p className="mt-3 max-w-2xl text-sm text-[color:var(--ink)]/55">
        A blank is a fact. Silence is not a price.
      </p>
      <Waterline className="mt-3" />

      <dl className="mt-8 grid max-w-xl grid-cols-2 gap-2 text-sm">
        <DockQuoteGrid
          dock={dock}
          tileClassName="rounded-lg bg-[color:var(--fog)] px-3 py-2"
        />
        <div className="col-span-2 rounded-lg bg-[color:var(--fog)] px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Hours</dt>
          <dd className="font-mono text-[15px] font-medium text-[color:var(--navy)]">
            {dock.hours ?? "—"}
          </dd>
        </div>
      </dl>

      <DockProvenance dock={dock} className="mt-4" />
      <DockPhone dock={dock} className="mt-5" />

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
          Today
        </a>
        {" · "}
        <a
          href={`/report?dock=${dock.id}`}
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          {reportLinkLabel(dock)}
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
          This is my dock
        </a>
        . Boats see your price before they leave.
      </p>
      <p className="mt-2 max-w-xl text-sm text-[color:var(--ink)]/70">
        <a
          href={runWatchHref({ corridor: dock.corridor, region: dock.region })}
          data-testid="this-water"
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          This water
        </a>
        . {dockWaterLabel(dock)}. See what a tank costs before you leave.
      </p>
      <SisterHandoff
        corridor={dock.corridor}
        region={dock.region}
        state={dock.state}
        city={dock.city}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dockJsonLd(dock)) }}
      />
      <SiteFooter />
    </main>
  );
}
