"use client";

import { useState } from "react";
import {
  CALL_FIGURE,
  DATE_UNKNOWN,
  HOME_AREAS,
  NOT_SOLD_FIGURE,
  cardsInArea,
  areaPath,
  cardsNearest,
  formatMiles,
  milesBetween,
  type HomeAreaId,
  type PostedCard,
  type PostedLine,
} from "@/lib/posted";
import { HOME_WELCOME } from "@/lib/home-welcome";
import { cn } from "@/lib/utils";

export type AreaLink = {
  id: HomeAreaId | "all";
  label: string;
  href: string;
};

type Origin = { lat: number; lng: number };

const chip =
  "inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)] md:h-11 md:px-3.5 md:text-sm";

const smallButton =
  "inline-flex h-8 items-center justify-center rounded-md px-2.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]";

function figureTone(line: PostedLine): string {
  if (line.figure === CALL_FIGURE) return "text-[color:var(--signal)]";
  if (line.figure === NOT_SOLD_FIGURE) return "text-[color:var(--ink)]/55";
  return line.kind === "diesel" ? "text-[color:var(--diesel)]" : "text-[color:var(--signal)]";
}

/** One card date when every grade shares a real day. Unknown is not a day. */
function sharedAsOf(lines: PostedLine[]): string | null {
  const first = lines[0]?.asOf;
  if (!first || first === DATE_UNKNOWN) return null;
  if (lines.some((line) => line.asOf !== first)) return null;
  return first;
}

function PriceCard({ card, miles }: { card: PostedCard; miles: number | null }) {
  const asOf = sharedAsOf(card.lines);
  return (
    <article
      data-testid={`posted-card-${card.id}`}
      data-stale={card.stale ? "true" : "false"}
      className="flex flex-col rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] px-3.5 py-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="min-w-0 font-heading text-lg leading-tight text-[color:var(--navy)]">
          <a
            href={card.href}
            className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
          >
            {card.name}
          </a>
          <span className="font-sans text-sm font-normal text-[color:var(--ink)]/65">
            {" · "}
            {card.city}, {card.state}
            {miles != null ? (
              <span className="font-mono text-xs tabular-nums"> · {formatMiles(miles)}</span>
            ) : null}
          </span>
        </h3>
        {card.stale ? (
          <span
            data-testid={`posted-stale-${card.id}`}
            className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--stale)]"
          >
            Stale
          </span>
        ) : null}
      </div>
      {card.note ? (
        <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[color:var(--ink)]/70">{card.note}</p>
      ) : null}

      <dl className="mt-1.5">
        {card.lines.map((line) => {
          const rowDate = !asOf && line.asOf !== DATE_UNKNOWN ? line.asOf : null;
          return (
            <div key={line.key} className="flex items-baseline justify-between gap-3 py-0.5">
              <dt
                className="min-w-0 text-sm text-[color:var(--ink)]/65"
                data-testid={`posted-grade-${card.id}-${line.key}`}
              >
                {line.label}
              </dt>
              <dd className="flex shrink-0 items-baseline gap-2">
                <span
                  data-testid={`posted-price-${card.id}-${line.key}`}
                  className={cn("price-up", figureTone(line))}
                >
                  {line.figure}
                </span>
                {rowDate ? (
                  <span
                    data-testid={`posted-asof-${card.id}-${line.key}`}
                    className="text-[11px] text-[color:var(--ink)]/45"
                  >
                    {rowDate}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>

      {asOf ? (
        <p data-testid={`posted-asof-${card.id}`} className="mt-1 text-[11px] text-[color:var(--ink)]/45">
          As of {asOf}
        </p>
      ) : null}
      {card.stillPosted ? (
        <p data-testid={`posted-still-${card.id}`} className="mt-0.5 text-[11px] text-[color:var(--ink)]/45">
          {card.stillPosted}
        </p>
      ) : null}

      <div className="mt-2 flex gap-2">
        {card.callHref ? (
          <a
            data-testid={`posted-call-${card.id}`}
            href={card.callHref}
            aria-label={`Call ${card.name}`}
            className={cn(smallButton, "bg-[color:var(--navy)] text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90")}
          >
            Call
          </a>
        ) : null}
        <a
          data-testid={`posted-directions-${card.id}`}
          href={card.directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Directions to ${card.name}`}
          className={cn(
            smallButton,
            card.callHref
              ? "border border-[color:var(--line)] bg-white text-[color:var(--navy)] hover:bg-[color:var(--cream)]"
              : "bg-[color:var(--navy)] text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90",
          )}
        >
          Directions
        </a>
      </div>
    </article>
  );
}

function CallRow({ card }: { card: PostedCard }) {
  return (
    <li
      data-testid={`posted-row-${card.id}`}
      className="flex items-baseline justify-between gap-3 border-b border-[color:var(--line)] py-2 last:border-b-0"
    >
      <p className="min-w-0 text-sm leading-5">
        <a
          href={card.href}
          className="font-heading text-[15px] text-[color:var(--navy)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
        >
          {card.name}
        </a>
        <span className="text-[color:var(--ink)]/60">
          {" · "}
          {card.city}, {card.state}
        </span>
      </p>
      <p className="flex shrink-0 items-center gap-3 text-sm">
        {card.callHref ? (
          <a
            data-testid={`posted-call-${card.id}`}
            href={card.callHref}
            aria-label={`Call ${card.name}`}
            className="font-medium text-[color:var(--diesel)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
          >
            Call
          </a>
        ) : null}
        <a
          data-testid={`posted-directions-${card.id}`}
          href={card.directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Directions to ${card.name}`}
          className="font-medium text-[color:var(--navy)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
        >
          Directions
        </a>
      </p>
    </li>
  );
}

function dockCount(count: number): string {
  return count === 1 ? "1 dock" : `${count} docks`;
}

export function PostedHome({
  cards,
  area,
  links,
}: {
  cards: PostedCard[];
  area: HomeAreaId | null;
  links: AreaLink[];
}) {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [pending, setPending] = useState(false);
  const [locationNote, setLocationNote] = useState("");

  function askLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationNote("Location stayed off.");
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationNote("Nearest first.");
        setPending(false);
      },
      () => {
        setLocationNote("Location stayed off.");
        setPending(false);
      },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 },
    );
  }

  const areas = origin || !area ? HOME_AREAS : HOME_AREAS.filter((item) => item.id === area);
  const priced = (
    origin
      ? cardsNearest(cards, origin.lat, origin.lng)
      : area
        ? cardsInArea(cards, area)
        : HOME_AREAS.flatMap((item) => cardsInArea(cards, item.id))
  ).filter((card) => card.hasPrice);
  const callGroups = areas
    .map((item) => ({
      id: item.id,
      label: item.label,
      cards: cardsInArea(cards, item.id).filter((card) => !card.hasPrice),
    }))
    .filter((group) => group.cards.length > 0);
  const status = pending ? "Finding you." : locationNote;

  return (
    <section data-testid="posted-home" className="min-w-0 bg-[color:var(--cream)] px-4 py-4 md:px-6 md:py-8">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-4">
        <header id="dock-prices" className="flex min-w-0 scroll-mt-16 flex-col gap-3">
          <h2 className="font-heading text-xl leading-tight text-[color:var(--navy)] md:text-2xl">
            {HOME_WELCOME.pricesHeading}
          </h2>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <nav data-testid="area-picker" aria-label="Area" className="flex min-w-0 flex-wrap gap-2">
              {links.map((link) => {
                const current = origin ? false : link.id === "all" ? area == null : link.id === area;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      chip,
                      current
                        ? "border-[color:var(--diesel)] bg-[color:var(--diesel)]/15 text-[color:var(--navy)]"
                        : "border-[color:var(--line)] text-[color:var(--ink)]/70 hover:text-[color:var(--navy)]",
                    )}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
            <button
              type="button"
              data-testid="near-me"
              aria-pressed={origin != null}
              onClick={askLocation}
              className={cn(
                chip,
                "self-start",
                origin
                  ? "border-[color:var(--diesel)] bg-[color:var(--diesel)]/15 text-[color:var(--navy)]"
                  : "border-[color:var(--navy)] bg-[color:var(--navy)] text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90",
              )}
            >
              Near me
            </button>
          </div>
          <p
            role="status"
            data-testid="location-status"
            className={status ? "text-sm text-[color:var(--ink)]/70" : "sr-only"}
          >
            {status}
          </p>
        </header>

        <div data-testid="posted-priced" className="flex flex-col gap-3">
          {priced.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--fog)] px-4 py-3 text-sm text-[color:var(--ink)]/70">
              No docks in this area.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {priced.map((card) => (
                <li key={card.id}>
                  <PriceCard
                    card={card}
                    miles={origin ? milesBetween(origin.lat, origin.lng, card.lat, card.lng) : null}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-[color:var(--ink)]/65">
            <a
              href="/report"
              data-testid="seen-a-price"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
            >
              Seen a price? Report it
            </a>
          </p>
        </div>

        {callGroups.length > 0 ? (
          <section data-testid="posted-call-ahead" aria-labelledby="call-ahead-heading">
            <h2 id="call-ahead-heading" className="font-heading text-lg text-[color:var(--navy)]">
              More fuel docks, call ahead
            </h2>
            <div className="mt-1 divide-y divide-[color:var(--line)] border-t border-[color:var(--line)]">
              {callGroups.map((group) => (
                <details key={group.id} data-testid={`posted-call-area-${group.id}`}>
                  <summary className="cursor-pointer py-3 text-sm font-medium text-[color:var(--navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]">
                    <a
                      href={areaPath(group.id)}
                      data-testid={`area-page-link-${group.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="underline decoration-[color:var(--diesel)] decoration-2 underline-offset-4"
                    >
                      {group.label}
                    </a>
                    {` · ${dockCount(group.cards.length)}`}
                  </summary>
                  <ul className="pb-2">
                    {group.cards.map((card) => (
                      <CallRow key={card.id} card={card} />
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
