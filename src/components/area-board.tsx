import { AREA_CALL_HEADING, AREA_EMPTY_PRICES, AREA_PRICES_HEADING, type AreaDock, type AreaPageModel } from "@/lib/area";
import { cn } from "@/lib/utils";

const callButton =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[color:var(--navy)] px-2.5 text-xs font-medium text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]";

function figureTone(kind: AreaDock["lines"][number]["kind"]): string {
  return kind === "diesel" ? "text-[color:var(--diesel)]" : "text-[color:var(--signal)]";
}

function PricedDock({ dock }: { dock: AreaDock }) {
  return (
    <article
      data-testid={`area-dock-${dock.id}`}
      data-stale={dock.stale ? "true" : "false"}
      className="flex flex-col rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] px-3.5 py-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="min-w-0 font-heading text-lg leading-tight text-[color:var(--navy)]">
          <a
            href={dock.href}
            data-testid={`area-dock-link-${dock.id}`}
            className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
          >
            {dock.name}
          </a>
          <span className="font-sans text-sm font-normal text-[color:var(--ink)]/65">
            {" · "}
            {dock.city}, {dock.state}
          </span>
        </h3>
        {dock.stale ? (
          <span
            data-testid={`area-stale-${dock.id}`}
            className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--stale)]"
          >
            Stale
          </span>
        ) : null}
      </div>
      {dock.note ? (
        <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[color:var(--ink)]/70">{dock.note}</p>
      ) : null}
      <dl className="mt-1.5">
        {dock.lines.map((line) => (
          <div key={line.key} className="flex items-baseline justify-between gap-3 py-0.5">
            <dt className="min-w-0 text-sm text-[color:var(--ink)]/65" data-testid={`area-grade-${dock.id}-${line.key}`}>
              {line.label}
            </dt>
            <dd
              data-testid={`area-price-${dock.id}-${line.key}`}
              className={cn("price-up", figureTone(line.kind))}
            >
              {line.figure}
            </dd>
          </div>
        ))}
      </dl>
      {dock.asOf ? (
        <p data-testid={`area-asof-${dock.id}`} className="mt-1 text-[11px] text-[color:var(--ink)]/45">
          As of {dock.asOf}
        </p>
      ) : null}
      {dock.source ? (
        <p data-testid={`area-source-${dock.id}`} className="mt-0.5 text-[11px] text-[color:var(--ink)]/45">
          {dock.sourceHref ? (
            <a
              href={dock.sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
            >
              {dock.source}
            </a>
          ) : (
            dock.source
          )}
        </p>
      ) : null}
    </article>
  );
}

function CallDock({ dock }: { dock: AreaDock }) {
  return (
    <li
      data-testid={`area-call-row-${dock.id}`}
      className="flex items-center justify-between gap-3 border-b border-[color:var(--line)] py-2 last:border-b-0"
    >
      <p className="min-w-0 text-sm leading-5">
        <a
          href={dock.href}
          data-testid={`area-dock-link-${dock.id}`}
          className="font-heading text-[15px] text-[color:var(--navy)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
        >
          {dock.name}
        </a>
        <span className="text-[color:var(--ink)]/60">
          {" · "}
          {dock.city}, {dock.state}
        </span>
      </p>
      {dock.callHref ? (
        <a
          data-testid={`area-call-${dock.id}`}
          href={dock.callHref}
          aria-label={`Call ${dock.name}`}
          className={callButton}
        >
          Call
        </a>
      ) : null}
    </li>
  );
}

export function AreaBoard({ page }: { page: AreaPageModel }) {
  return (
    <div data-testid="area-page" className="flex flex-col gap-6">
      <header>
        <h1 data-testid="area-title" className="page-title text-[color:var(--navy)]">
          {page.title}
        </h1>
        <p data-testid="area-intro" className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          {page.intro}
        </p>
      </header>

      <section data-testid="area-priced" aria-labelledby="area-prices-heading">
        <h2 id="area-prices-heading" className="font-heading text-lg text-[color:var(--navy)]">
          {AREA_PRICES_HEADING}
        </h2>
        {page.priced.length === 0 ? (
          <p data-testid="area-empty-prices" className="mt-3 text-sm text-[color:var(--ink)]/70">
            {AREA_EMPTY_PRICES}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {page.priced.map((dock) => (
              <li key={dock.id}>
                <PricedDock dock={dock} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {page.callAhead.length > 0 ? (
        <section data-testid="area-call-ahead" aria-labelledby="area-call-heading">
          <h2 id="area-call-heading" className="font-heading text-lg text-[color:var(--navy)]">
            {AREA_CALL_HEADING}
          </h2>
          <ul className="mt-1 border-t border-[color:var(--line)]">
            {page.callAhead.map((dock) => (
              <CallDock key={dock.id} dock={dock} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
