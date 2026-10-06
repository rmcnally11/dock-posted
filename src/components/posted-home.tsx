"use client";

import { useState } from "react";
import {
  CALL_FIGURE,
  HOME_AREAS,
  cardsInArea,
  cardsNearest,
  formatMiles,
  milesBetween,
  type HomeAreaId,
  type PostedCard,
  type PostedLine,
} from "@/lib/posted";
import { cn } from "@/lib/utils";

export type AreaLink = {
  id: HomeAreaId | "all";
  label: string;
  href: string;
};

type Origin = { lat: number; lng: number };

const chip =
  "inline-flex h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]";

function figureTone(line: PostedLine): string {
  if (line.figure === CALL_FIGURE) return "text-[color:var(--signal)]";
  if (line.figure === "Not sold") return "text-[color:var(--ink)]/55";
  return line.kind === "diesel" ? "text-[color:var(--diesel)]" : "text-[color:var(--signal)]";
}

function PriceCard({ card, miles }: { card: PostedCard; miles: number | null }) {
  return (
    <article
      data-testid={`posted-card-${card.id}`}
      data-stale={card.stale ? "true" : "false"}
      className="flex h-full flex-col rounded-3xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5 md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-xl leading-tight text-[color:var(--navy)]">
            <a
              href={card.href}
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
            >
              {card.name}
            </a>
          </h3>
          <p className="mt-1 text-sm text-[color:var(--ink)]/70">
            {card.city}, {card.state}
            {miles != null ? <span className="text-[color:var(--ink)]/55"> · {card.areaLabel}</span> : null}
          </p>
          {miles != null ? (
            <p className="mt-1 font-mono text-xs tabular-nums text-[color:var(--ink)]/60">
              {formatMiles(miles)}
            </p>
          ) : null}
          {card.note ? (
            <p className="mt-1 text-[11px] font-medium tracking-wide text-[color:var(--ink)]/70">
              {card.note}
            </p>
          ) : null}
        </div>
        {card.stale ? (
          <span
            data-testid={`posted-stale-${card.id}`}
            className="shrink-0 rounded-full border border-gold bg-gold/20 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--navy)]"
          >
            Stale
          </span>
        ) : null}
      </div>

      <dl className="mt-4 space-y-3">
        {card.lines.map((line) => (
          <div key={line.key} className="flex items-start justify-between gap-3 border-b border-[color:var(--line)] pb-3 last:border-b-0 last:pb-0">
            <dt className="min-w-0 text-sm text-[color:var(--ink)]/70" data-testid={`posted-grade-${card.id}-${line.key}`}>
              {line.label}
            </dt>
            <dd className="shrink-0 text-right">
              <span
                data-testid={`posted-price-${card.id}-${line.key}`}
                className={cn("price-up", figureTone(line))}
              >
                {line.figure}
              </span>
              <span
                data-testid={`posted-asof-${card.id}-${line.key}`}
                className="mt-1 block text-xs text-[color:var(--ink)]/55"
              >
                As of {line.asOf}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex gap-2">
        {card.callHref ? (
          <a
            data-testid={`posted-call-${card.id}`}
            href={card.callHref}
            aria-label={`Call ${card.name}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-[color:var(--navy)] px-3 text-sm font-medium text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
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
            "inline-flex min-h-11 flex-1 items-center justify-center rounded-md px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]",
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

function CardList({ cards, origin }: { cards: PostedCard[]; origin: Origin | null }) {
  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--fog)] p-6 text-sm text-[color:var(--ink)]/70">
        No docks in this area.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <li key={card.id}>
          <PriceCard
            card={card}
            miles={origin ? milesBetween(origin.lat, origin.lng, card.lat, card.lng) : null}
          />
        </li>
      ))}
    </ul>
  );
}

function AreaSection({
  label,
  cards,
  testId,
  callList = false,
}: {
  label: string;
  cards: PostedCard[];
  testId: string;
  callList?: boolean;
}) {
  if (cards.length === 0) return null;
  const headingId = `${testId}-heading`;
  return (
    <section aria-labelledby={headingId} data-testid={testId} className="min-w-0">
      <h2
        id={headingId}
        className={
          callList
            ? "mb-4 font-heading text-xl text-[color:var(--navy)]/80"
            : "mb-4 font-heading text-2xl text-[color:var(--navy)]"
        }
      >
        {label}
        {callList ? (
          <span className="ml-2 align-middle font-sans text-sm font-medium text-[color:var(--signal)]">
            Call
          </span>
        ) : null}
      </h2>
      <CardList cards={cards} origin={null} />
    </section>
  );
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

  const areas = area ? HOME_AREAS.filter((item) => item.id === area) : HOME_AREAS;
  const nearest = origin ? cardsNearest(cards, origin.lat, origin.lng) : null;
  const status = pending ? "Finding you." : locationNote;

  return (
    <section data-testid="posted-home" className="min-w-0 bg-[color:var(--cream)] px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8">
        <header className="flex min-w-0 flex-col gap-5">
          <div>
            <h1 className="font-heading text-[2rem] leading-[1.1] text-[color:var(--navy)] md:text-5xl">
              Where to get fuel
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-[color:var(--ink)]/70">
              Gas and diesel on the dock.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav
              data-testid="area-picker"
              aria-label="Area"
              className="chip-scroll flex min-w-0 gap-2 overflow-x-auto"
            >
              {links.map((link) => {
                const current = origin
                  ? false
                  : link.id === "all"
                    ? area == null
                    : link.id === area;
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

        {nearest ? (
          <section aria-label="Nearest docks" data-testid="posted-nearest">
            <CardList cards={nearest} origin={origin} />
          </section>
        ) : area ? (
          <AreaSection
            label={areas[0]?.label ?? ""}
            cards={cardsInArea(cards, area)}
            testId={`posted-area-${area}`}
          />
        ) : (
          <div className="flex flex-col gap-10">
            {areas.map((item) => (
              <AreaSection
                key={`priced-${item.id}`}
                label={item.label}
                cards={cardsInArea(cards, item.id).filter((card) => card.hasPrice)}
                testId={`posted-area-${item.id}`}
              />
            ))}
            {areas.map((item) => (
              <AreaSection
                key={`call-${item.id}`}
                label={item.label}
                cards={cardsInArea(cards, item.id).filter((card) => !card.hasPrice)}
                testId={`posted-call-area-${item.id}`}
                callList
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
