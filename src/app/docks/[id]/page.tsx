import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DockProvenance, DockQuoteGrid } from "@/components/dock-card";
import { FreshnessBadge } from "@/components/freshness-badge";
import { SisterHandoff } from "@/components/sister-handoff";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { boardHref } from "@/lib/board-query";
import {
  depthSourceLine,
  directionsHref,
  dockCanonicalUrl,
  dockJsonLd,
  dockPageDescription,
  dockPageTitle,
  ethanolFreeAnswer,
  fuelsPosted,
  hoursSourceLine,
  postedDepth,
  priceChecks,
  priceCheckText,
  priceHistoryLead,
  publicHours,
} from "@/lib/dock-page";
import { telHref } from "@/lib/format";
import { publicCallLine, reportLinkLabel } from "@/lib/freshness";
import { dockWaterLabel, runWatchHref } from "@/lib/income";
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
  const title = dockPageTitle(dock);
  const description = dockPageDescription(dock);
  const url = dockCanonicalUrl(dock.id);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Dock Posted",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
  const callHref = dock.phone ? telHref(dock.phone) : null;
  const directions = directionsHref(dock);
  const fuels = fuelsPosted(dock);
  const ethanol = ethanolFreeAnswer(dock);
  const depth = postedDepth(dock);
  const hours = publicHours(dock.hours);
  const hoursSource = hoursSourceLine(dock);
  const checks = priceChecks(dock);
  const historyLead = priceHistoryLead(checks.length);
  const callLine = publicCallLine(dock);
  const staleCall = callLine?.startsWith("Too old") ? callLine : null;

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

      <div className="mt-4 flex max-w-xl gap-3" data-testid="dock-actions">
        {callHref && dock.phone ? (
          <a
            href={callHref}
            data-testid="dock-call"
            className="inline-flex min-h-12 flex-1 flex-col items-center justify-center rounded-md bg-[color:var(--navy)] px-4 py-2 text-[color:var(--cream)]"
          >
            <span className="text-base font-medium">Call</span>
            <span className="text-xs font-normal">{dock.phone}</span>
          </a>
        ) : null}
        {directions ? (
          <a
            href={directions}
            data-testid="dock-directions"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-[color:var(--diesel)] px-4 text-base font-medium text-white"
          >
            Directions
          </a>
        ) : null}
      </div>
      {staleCall ? (
        <p className="mt-3 max-w-xl text-sm text-[color:var(--ink)]/70">{staleCall}</p>
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
        <div className="col-span-2 rounded-lg bg-[color:var(--fog)] px-3 py-2" data-testid="dock-fuels">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Fuels</dt>
          <dd className="font-medium text-[color:var(--navy)]">
            {fuels.length > 0 ? fuels.join(" · ") : "Not stated"}
          </dd>
        </div>
        <div className="col-span-2 rounded-lg bg-[color:var(--fog)] px-3 py-2" data-testid="dock-ethanol">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Ethanol-free gas</dt>
          <dd className="font-medium text-[color:var(--navy)]">{ethanol}</dd>
        </div>
        {depth ? (
          <div className="col-span-2 rounded-lg bg-[color:var(--fog)] px-3 py-2" data-testid="dock-depth">
            <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Depth at the dock</dt>
            <dd className="font-medium text-[color:var(--navy)]">{depth.text}</dd>
            <dd className="mt-1 text-xs text-[color:var(--ink)]/50">
              <a
                href={depth.sourceUrl}
                className="underline decoration-[color:var(--ink)]/30 underline-offset-2"
              >
                {depthSourceLine(depth)}
              </a>
            </dd>
          </div>
        ) : null}
        <div className="col-span-2 rounded-lg bg-[color:var(--fog)] px-3 py-2" data-testid="dock-hours">
          <dt className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Hours</dt>
          <dd className="font-mono text-[15px] font-medium text-[color:var(--navy)]">
            {hours.length > 0 ? (
              hours.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))
            ) : (
              "—"
            )}
          </dd>
          {hoursSource ? (
            <dd className="mt-1 text-xs text-[color:var(--ink)]/50">{hoursSource}</dd>
          ) : null}
        </div>
      </dl>

      <section className="mt-6 max-w-xl" data-testid="dock-price-history">
        <h2 className="text-[11px] uppercase tracking-wide text-[color:var(--ink)]/50">Price history</h2>
        {historyLead ? <p className="mt-2 text-sm text-[color:var(--navy)]">{historyLead}</p> : null}
        {checks.length > 0 ? (
          <ol className="mt-2 space-y-3">
            {checks.map((check) => (
              <li key={check.checkedOn} data-testid="price-check" data-date={check.checkedOn} className="text-sm text-[color:var(--navy)]">
                {priceCheckText(check)}
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <DockProvenance dock={dock} className="mt-4" />

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
          href={`/report?dock=${dock.id}`}
          data-testid="report-a-price"
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
        >
          Report a price
        </a>
        . The number on the pump today.
      </p>
      <p className="mt-3 text-sm text-[color:var(--ink)]/70">
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
