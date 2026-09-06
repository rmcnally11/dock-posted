import { Waterline } from "@/components/waterline";
import {
  MARINE_TAX_NOTE,
  PRODUCT_DOCK_LABEL,
  TEAR_SHEET_NEED,
  formatCents,
  formatDockDollars,
  fullBookPath,
  marinaPostedNumber,
  tearSheetDate,
  tearSheetPath,
  type ProductNetback,
  type WholesaleArea,
  type WholesaleAreaId,
  type WholesaleProduct,
  type WholesaleTerminal,
} from "@/lib/wholesale";
import { PrintButton } from "@/components/print-button";
import { DeskLogout } from "../desk";

export function TearSheet({
  area,
  terminal,
  product,
  book,
  marinaName,
  asOf,
  otherReady,
}: {
  area: WholesaleArea;
  terminal: WholesaleTerminal;
  product: WholesaleProduct;
  book: ProductNetback;
  marinaName: string;
  asOf?: string | null;
  otherReady: WholesaleProduct | null;
}) {
  const posted = marinaPostedNumber(book);
  const postedKind = posted.kind === "pump" ? "Posted pump" : posted.kind === "rack" ? "Posted rack" : "No number up";
  const postedNote =
    posted.kind === "pump"
      ? "What’s on the hose today."
      : posted.kind === "rack"
        ? "What’s on the rack. No pump number yet."
        : "Blank until someone writes it.";
  const fatLoud = book.fatTake != null && book.fatTake > 0;
  const invoice = book.invoiceDelivered;
  const rack = book.steps.find((step) => step.key === "posted")?.cents ?? null;
  const taxFederal = book.taxMode === "oneline" ? null : book.taxFederal;
  const taxState = book.taxMode === "oneline" ? null : book.taxState;
  const date = tearSheetDate();

  return (
    <main className="mx-auto w-full max-w-[8.5in] flex-1 px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="kicker text-[color:var(--signal)]">Marina sheet</p>
          <p className="mt-1 text-sm text-[color:var(--ink)]/65">
            One letter page. Hand it across the picnic table.
          </p>
        </div>
        <DeskLogout />
      </div>

      <article
        className="tear-sheet border border-[color:var(--navy)] bg-[color:var(--cream)] px-6 py-7 print:border-0 print:px-0 print:py-0"
        data-testid="tear-sheet"
        data-product={product}
        data-terminal={terminal.id}
      >
        <header>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker text-[color:var(--diesel)]">Dock Posted</p>
              <h1 className="font-heading mt-2 text-4xl leading-none text-[color:var(--navy)] print:text-5xl">
                {marinaName}
              </h1>
              <p className="mt-2 text-sm text-[color:var(--ink)]/70">
                {terminal.city} · {terminal.facilityName}
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--ink)]/50">
                {area.label} · {PRODUCT_DOCK_LABEL[product]} · {date}
                {asOf ? ` · board as of ${asOf}` : ""}
              </p>
            </div>
            <p className="font-heading text-2xl text-[color:var(--navy)]">{PRODUCT_DOCK_LABEL[product]}</p>
          </div>
          <Waterline className="mt-4" />
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="kicker text-[color:var(--ink)]/45">{postedKind}</p>
            <p className="price-up mt-2 text-4xl text-[color:var(--navy)] md:text-5xl" data-testid="tear-sheet-posted">
              {formatDockDollars(posted.cents)}
            </p>
            <p className="mt-1 text-xs text-[color:var(--ink)]/50">{postedNote}</p>
            <p className="mt-1 font-mono text-[11px] text-[color:var(--ink)]/40">{formatCents(posted.cents)}</p>
          </div>
          <div data-testid="tear-sheet-fat-take">
            <p className="kicker text-[color:var(--signal)]">Fat take</p>
            <p
              className={`price-up mt-2 text-4xl md:text-5xl ${
                fatLoud ? "text-[color:var(--signal)]" : "text-[color:var(--navy)]"
              }`}
            >
              {formatDockDollars(book.fatTake)}
            </p>
            <p className="mt-1 text-xs text-[color:var(--ink)]/55">
              Invoice {formatDockDollars(invoice)} versus posted rack {formatDockDollars(rack)}.
            </p>
            <p className="mt-1 font-mono text-[11px] text-[color:var(--ink)]/40">{formatCents(book.fatTake)}</p>
          </div>
        </section>

        <section className="mt-6 border-t border-[color:var(--line)] pt-5" data-testid="tear-sheet-taxes">
          <p className="kicker text-[color:var(--ink)]/45">Tax on the gallon</p>
          {book.taxMode === "oneline" ? (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink)]/45">One line</p>
              <p className="mt-1 font-heading text-3xl text-[color:var(--navy)]">
                {formatDockDollars(book.taxOneLine)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[color:var(--ink)]/40">{formatCents(book.taxOneLine)}</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink)]/45">Federal</p>
                <p className="mt-1 font-heading text-3xl text-[color:var(--navy)]">
                  {formatDockDollars(taxFederal)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[color:var(--ink)]/40">{formatCents(taxFederal)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink)]/45">State</p>
                <p className="mt-1 font-heading text-3xl text-[color:var(--navy)]">
                  {formatDockDollars(taxState)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-[color:var(--ink)]/40">{formatCents(taxState)}</p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 border-t border-[color:var(--line)] pt-5" data-testid="tear-sheet-netback">
          <p className="kicker text-[color:var(--diesel)]">What it should have been</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <TearFigure label="DAP" cents={book.dap} />
            <TearFigure label="Fair hose" cents={book.fairHose} />
            <TearFigure label="Should-be" cents={book.shouldBe} testId="tear-sheet-should-be" />
            <TearFigure label="Leftover vs posted" cents={book.postedVsDap} note="Posted pump − DAP" />
          </dl>
        </section>

        <footer className="mt-8 border-t border-[color:var(--diesel)]/40 pt-3 text-[11px] leading-5 text-[color:var(--ink)]/45">
          <p>Dock Posted · Waterdog 2027</p>
          <p>No Platts. No OPIS. We don’t invent a price.</p>
          <p className="mt-1">{MARINE_TAX_NOTE}</p>
        </footer>
      </article>

      <div className="mt-6 flex flex-wrap items-center gap-4 print:hidden">
        <PrintButton />
        {otherReady ? (
          <a
            href={tearSheetPath(area.areaId, terminal.id, otherReady)}
            className="text-sm text-[color:var(--ink)]/55 underline-offset-2 hover:underline"
          >
            {PRODUCT_DOCK_LABEL[otherReady]} sheet
          </a>
        ) : null}
        <a
          href={fullBookPath(area.areaId, terminal.id)}
          className="text-sm text-[color:var(--ink)]/45 underline-offset-2 hover:underline"
          data-testid="print-full-book"
        >
          Full book
        </a>
        <a
          href={`/wholesale?area=${area.areaId}&terminal=${encodeURIComponent(terminal.id)}`}
          className="text-sm text-[color:var(--ink)]/55 underline-offset-2 hover:underline"
        >
          Back to desk
        </a>
      </div>
    </main>
  );
}

function TearFigure({
  label,
  cents,
  note,
  testId,
}: {
  label: string;
  cents: number | null;
  note?: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink)]/45">{label}</dt>
      <dd className="mt-1 font-heading text-2xl text-[color:var(--navy)]">{formatDockDollars(cents)}</dd>
      <p className="mt-0.5 font-mono text-[11px] text-[color:var(--ink)]/40">{formatCents(cents)}</p>
      {note ? <p className="mt-0.5 text-[10px] text-[color:var(--ink)]/40">{note}</p> : null}
    </div>
  );
}

export function TearSheetEmpty({
  areaId,
  terminalId,
}: {
  areaId: WholesaleAreaId;
  terminalId?: string | null;
}) {
  const back = terminalId
    ? `/wholesale?area=${areaId}&terminal=${encodeURIComponent(terminalId)}`
    : `/wholesale?area=${areaId}`;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker text-[color:var(--signal)]">Marina sheet</p>
          <h1 className="page-title mt-2 text-[color:var(--navy)]">Nothing to hand across the table</h1>
          <p className="mt-3 text-sm text-[#8a2c12]" data-testid="print-empty">
            {TEAR_SHEET_NEED} Compute or Save on the desk. Print cannot invent a book.
          </p>
        </div>
        <DeskLogout />
      </div>
      <div className="mt-6 flex flex-wrap gap-4 print:hidden">
        <a
          href={fullBookPath(areaId, terminalId ?? undefined)}
          className="text-sm text-[color:var(--ink)]/45 underline-offset-2 hover:underline"
          data-testid="print-full-book"
        >
          Full book
        </a>
        <a href={back} className="text-sm text-[color:var(--ink)]/55 underline-offset-2 hover:underline">
          Back to desk
        </a>
      </div>
    </main>
  );
}
