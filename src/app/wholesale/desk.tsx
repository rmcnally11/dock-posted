import {
  MARINE_TAX_NOTE,
  PRODUCT_LABEL,
  WHOLESALE_AREA_ORDER,
  WHOLESALE_PRODUCTS,
  areaLabel,
  displayInputValue,
  deskFootnotes,
  fattestTakeAcross,
  formatBoth,
  formatCents,
  tcnLabel,
  type AreaTerminalRef,
  type DiffRow,
  type InputUnit,
  type PreparedWorksheet,
  type ProductNetback,
  type TerminalWorksheet,
  type WaterfallRung,
  type WholesaleArea,
  type WholesaleAreaId,
  type WholesaleProduct,
  type WholesaleTerminal,
} from "@/lib/wholesale";
import type { NymexScreenPull } from "@/lib/wholesale-nymex";
import {
  addTerminalDiff,
  applyTerminalDiff,
  computeWholesaleWorksheet,
  loginWholesale,
  logoutWholesale,
  removeTerminalDiff,
  saveWholesaleWorksheet,
} from "./actions";

export function DeskLogout() {
  return (
    <form action={logoutWholesale} className="print:hidden">
      <button
        type="submit"
        data-testid="wholesale-logout"
        className="text-sm text-black/55 underline-offset-2 hover:underline"
      >
        Log out
      </button>
    </form>
  );
}

export function AreaChips({ areaId }: { areaId: WholesaleAreaId }) {
  return (
    <nav className="flex flex-wrap gap-1.5" data-testid="wholesale-areas">
      {WHOLESALE_AREA_ORDER.map((id) => {
        const active = id === areaId;
        return (
          <a
            key={id}
            href={`/wholesale?area=${id}`}
            data-testid={`area-${id}`}
            className={
              active
                ? "border border-black bg-black px-2.5 py-1 text-xs text-white"
                : "border border-black/20 bg-white px-2.5 py-1 text-xs text-black/70 hover:border-black/40"
            }
          >
            {areaLabel(id)}
          </a>
        );
      })}
    </nav>
  );
}

export function TerminalTable({
  area,
  rows,
  selectedId,
  unit,
}: {
  area: WholesaleArea;
  rows: Array<{ terminal: WholesaleTerminal; ref: AreaTerminalRef; rb: ProductNetback; ho: ProductNetback }>;
  selectedId: string | null;
  unit: InputUnit;
}) {
  void unit;
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">Terminals for this region</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-black/55">{area.note}</p>
      <div className="mt-3 overflow-x-auto border border-black/15 bg-white">
        <table className="min-w-full text-left text-xs" data-testid="region-terminals">
          <thead className="border-b border-black/10 bg-black/[0.03] text-[11px] uppercase tracking-[0.08em] text-black/45">
            <tr>
              <th className="px-3 py-2 font-medium">Terminal</th>
              <th className="px-3 py-2 font-medium">TCN_IRS</th>
              <th className="px-3 py-2 font-medium">Operator</th>
              <th className="px-3 py-2 font-medium">RB rack margin</th>
              <th className="px-3 py-2 font-medium">HO rack margin</th>
              <th className="px-3 py-2 font-medium">RB remaining</th>
              <th className="px-3 py-2 font-medium">HO remaining</th>
              <th className="px-3 py-2 font-medium">RB implied Δ</th>
              <th className="px-3 py-2 font-medium">HO implied Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ terminal, ref, rb, ho }) => {
              const href = `/wholesale?area=${area.areaId}&terminal=${terminal.id}`;
              const selected = selectedId === terminal.id;
              return (
                <tr
                  key={terminal.id}
                  data-testid={`terminal-row-${terminal.id}`}
                  className={selected ? "bg-black/[0.04]" : "border-t border-black/10"}
                >
                  <td className="px-3 py-2">
                    <a href={href} className="font-medium underline-offset-2 hover:underline">
                      {terminal.city} · {terminal.facilityName}
                    </a>
                    <div className="mt-0.5 text-black/45">
                      {terminal.hub}
                      {ref.inArea ? "" : " · nearest, not in-region"}
                      {ref.miles != null ? ` · ${ref.miles} mi ${ref.direction ?? ""}` : ""}
                    </div>
                    {terminal.tcnStatus === "unverified" ? (
                      <div className="text-[#8a2c12]">Unverified TCN</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono">{tcnLabel(terminal)}</td>
                  <td className="px-3 py-2">{terminal.operator}</td>
                  <td className="px-3 py-2 font-mono">{formatBoth(rb.rackMargin)}</td>
                  <td className="px-3 py-2 font-mono">{formatBoth(ho.rackMargin)}</td>
                  <td className="px-3 py-2 font-mono">{formatBoth(rb.dockRemaining)}</td>
                  <td className="px-3 py-2 font-mono">{formatBoth(ho.dockRemaining)}</td>
                  <td className="px-3 py-2 font-mono">{formatBoth(rb.impliedDiff)}</td>
                  <td className="px-3 py-2 font-mono">{formatBoth(ho.impliedDiff)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {deskFootnotes(area).length > 0 ? (
        <ul className="mt-3 max-w-3xl space-y-1 text-xs leading-5 text-black/45">
          {deskFootnotes(area).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function NymexBanner({ screens }: { screens: NymexScreenPull }) {
  return (
    <section className="mt-6 border border-black/15 bg-white p-4" data-testid="nymex-yahoo">
      <h2 className="text-sm font-medium">NYMEX screen · Yahoo Finance (public)</h2>
      <p className="mt-1 text-xs text-black/45">
        RB=F (RBOB / gasoline) and HO=F (NY Harbor ULSD / heating oil). Server pull only. Not Platts,
        OPIS, DTN, or a paid vendor. Typed screen wins. Failed or stale quotes stay —.
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {WHOLESALE_PRODUCTS.map((product) => {
          const quote = screens[product];
          const asOf = quote.asOfLabel ?? "no as-of";
          const price = formatBoth(quote.cents);
          const status =
            quote.status === "ok"
              ? `as of ${asOf}`
              : quote.note ?? `${quote.status} — screen left blank`;
          return (
            <li key={product} data-testid={`nymex-${product.toLowerCase()}`}>
              <span className="font-medium">{product}</span> · {quote.ticker}
              {quote.shortName ? ` · ${quote.shortName}` : ""} · {price}
              <span className="text-black/45"> · {status}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Worksheet({
  areaId,
  terminal,
  sheet,
  prepared,
  unit,
  diffs,
  screens,
  draft,
  error,
  saved,
}: {
  areaId: WholesaleAreaId;
  terminal: WholesaleTerminal;
  sheet: TerminalWorksheet;
  prepared?: PreparedWorksheet;
  unit: InputUnit;
  diffs: DiffRow[];
  screens: NymexScreenPull;
  draft?: boolean;
  error?: string;
  saved?: boolean;
}) {
  const unitLabel = unit === "dollar" ? "$/gal" : "¢/gal";
  const display: TerminalWorksheet = {
    rb: prepared?.rb.input ?? sheet.rb,
    ho: prepared?.ho.input ?? sheet.ho,
    tax: sheet.tax,
    taxRb: {
      federal: prepared?.rb.tax.federal.cents ?? sheet.taxRb?.federal ?? sheet.tax.federal,
      state: prepared?.rb.tax.state.cents ?? sheet.taxRb?.state ?? sheet.tax.state,
    },
    taxHo: {
      federal: prepared?.ho.tax.federal.cents ?? sheet.taxHo?.federal ?? sheet.tax.federal,
      state: prepared?.ho.tax.state.cents ?? sheet.taxHo?.state ?? sheet.tax.state,
    },
  };
  return (
    <section className="mt-8" data-testid="worksheet">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Override strip</h2>
          <p className="mt-1 text-sm text-black/55">
            {terminal.city} · {tcnLabel(terminal)} · {terminal.operator}. Empty stays blank. Freight
            is typed tariff only — miles are labels, not cents.
          </p>
        </div>
        <div className="flex gap-2 text-xs print:hidden">
          <a
            href={`/wholesale?area=${areaId}&terminal=${terminal.id}&unit=cent`}
            className={unit === "cent" ? "underline" : "text-black/45"}
          >
            ¢/gal
          </a>
          <a
            href={`/wholesale?area=${areaId}&terminal=${terminal.id}&unit=dollar`}
            className={unit === "dollar" ? "underline" : "text-black/45"}
          >
            $/gal
          </a>
          <a
            href={`/wholesale/print?area=${areaId}`}
            className="text-black/55 underline-offset-2 hover:underline"
          >
            Investor print
          </a>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-[#8a2c12]">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-black/55">Saved for this terminal.</p> : null}
      {draft ? (
        <p className="mt-3 text-sm text-black/55" data-testid="compute-draft">
          Showing computed figures. Inputs below are the same book. Not written until you save.
        </p>
      ) : null}

      <form className="mt-4 print:hidden">
        <input type="hidden" name="area" value={areaId} />
        <input type="hidden" name="terminal" value={terminal.id} />
        <input type="hidden" name="unit" value={unit} />
        <WorksheetFields
          sheet={display}
          prepared={prepared}
          unit={unit}
          unitLabel={unitLabel}
          screens={screens}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            formAction={computeWholesaleWorksheet}
            className="h-9 border border-black/20 bg-white px-3 text-sm"
            data-testid="compute-worksheet"
          >
            Compute
          </button>
          <button
            type="submit"
            formAction={saveWholesaleWorksheet}
            className="h-9 border border-black bg-black px-3 text-sm text-white"
            data-testid="save-worksheet"
          >
            Save terminal
          </button>
        </div>
      </form>

      <DiffEditor areaId={areaId} terminalId={terminal.id} unit={unit} diffs={diffs} sheet={sheet} />
    </section>
  );
}

function yahooHint(cents: number | null, unit: InputUnit): string {
  if (cents == null) return "";
  return `${displayInputValue(cents, unit)} yahoo`;
}

function WorksheetFields({
  sheet,
  prepared,
  unit,
  unitLabel,
  screens,
}: {
  sheet: TerminalWorksheet;
  prepared?: PreparedWorksheet;
  unit: InputUnit;
  unitLabel: string;
  screens: NymexScreenPull;
}) {
  return (
    <div className="overflow-x-auto border border-black/15 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-black/45">
            <th className="px-3 py-2 font-medium">Override · {unitLabel}</th>
            <th className="px-3 py-2 font-medium">{PRODUCT_LABEL.RB}</th>
            <th className="px-3 py-2 font-medium">{PRODUCT_LABEL.HO}</th>
          </tr>
        </thead>
        <tbody>
          <FieldRow
            label="NYMEX screen"
            name="nymex"
            rb={sheet.rb.nymexScreen}
            ho={sheet.ho.nymexScreen}
            unit={unit}
            rbPlaceholder={yahooHint(screens.RB.cents, unit)}
            hoPlaceholder={yahooHint(screens.HO.cents, unit)}
          />
          <FieldRow label="Terminal differential vs screen" name="diff" rb={sheet.rb.terminalDiff} ho={sheet.ho.terminalDiff} unit={unit} />
          <FieldRow label="Inbound freight / pipeline / truck" name="freight" rb={sheet.rb.inboundFreight} ho={sheet.ho.inboundFreight} unit={unit} />
          <FieldRow label="Posted rack" name="rack" rb={sheet.rb.postedRack} ho={sheet.ho.postedRack} unit={unit} />
          <FieldRow label="Jobber sell" name="jobber" rb={sheet.rb.jobberSell} ho={sheet.ho.jobberSell} unit={unit} />
          <FieldRow
            label="Dock / retail posted"
            name="dock"
            rb={sheet.rb.dockPosted}
            ho={sheet.ho.dockPosted}
            unit={unit}
            rbHint={prepared?.rb.labels.dockPosted ?? null}
            hoHint={prepared?.ho.labels.dockPosted ?? null}
          />
          <FieldRow
            label="Tax · federal"
            name="tax_federal"
            rb={sheet.taxRb?.federal ?? null}
            ho={sheet.taxHo?.federal ?? null}
            unit={unit}
            rbHint={prepared?.rb.tax.federal.sourceLabel ?? null}
            hoHint={prepared?.ho.tax.federal.sourceLabel ?? null}
          />
          <FieldRow
            label="Tax · state"
            name="tax_state"
            rb={sheet.taxRb?.state ?? null}
            ho={sheet.taxHo?.state ?? null}
            unit={unit}
            rbHint={prepared?.rb.tax.state.sourceLabel ?? null}
            hoHint={prepared?.ho.tax.state.sourceLabel ?? null}
          />
        </tbody>
      </table>
      <div className="grid gap-3 border-t border-black/10 p-3 sm:grid-cols-2">
        <TaxField label="Tax · other / local" name="tax_other" value={sheet.tax.other} unit={unit} />
        <TaxField label="Tax · one line (replaces the split)" name="tax_one" value={sheet.tax.oneLine} unit={unit} />
      </div>
      <p className="px-3 pb-3 text-xs text-black/45">
        {MARINE_TAX_NOTE} Federal and state are the strip. A missing federal or state leaves dock
        ex-tax and remaining blank. One tax line overrides the split. Empty stays — , never $0.00.
      </p>
    </div>
  );
}

function FieldRow({
  label,
  name,
  rb,
  ho,
  unit,
  rbHint,
  hoHint,
  rbPlaceholder,
  hoPlaceholder,
}: {
  label: string;
  name: string;
  rb: number | null;
  ho: number | null;
  unit: InputUnit;
  rbHint?: string | null;
  hoHint?: string | null;
  rbPlaceholder?: string;
  hoPlaceholder?: string;
}) {
  return (
    <tr className="border-t border-black/10">
      <th className="px-3 py-2 text-left text-xs font-medium text-black/60">{label}</th>
      <td className="px-3 py-2">
        <input
          name={`${name}_rb`}
          inputMode="decimal"
          defaultValue={displayInputValue(rb, unit)}
          placeholder={rbPlaceholder}
          className="h-9 w-full border border-black/15 px-2 font-mono text-sm"
        />
        {rbHint ? <p className="mt-1 text-[11px] text-black/40">{rbHint}</p> : null}
      </td>
      <td className="px-3 py-2">
        <input
          name={`${name}_ho`}
          inputMode="decimal"
          defaultValue={displayInputValue(ho, unit)}
          placeholder={hoPlaceholder}
          className="h-9 w-full border border-black/15 px-2 font-mono text-sm"
        />
        {hoHint ? <p className="mt-1 text-[11px] text-black/40">{hoHint}</p> : null}
      </td>
    </tr>
  );
}

function TaxField({
  label,
  name,
  value,
  unit,
}: {
  label: string;
  name: string;
  value: number | null;
  unit: InputUnit;
}) {
  return (
    <label className="block text-xs text-black/60">
      {label}
      <input
        name={name}
        inputMode="decimal"
        defaultValue={displayInputValue(value, unit)}
        className="mt-1 h-9 w-full border border-black/15 px-2 font-mono text-sm"
      />
    </label>
  );
}

function DiffEditor({
  areaId,
  terminalId,
  unit,
  diffs,
  sheet,
}: {
  areaId: WholesaleAreaId;
  terminalId: string;
  unit: InputUnit;
  diffs: DiffRow[];
  sheet: TerminalWorksheet;
}) {
  return (
    <div className="mt-6 border border-black/15 bg-white p-4 print:hidden">
      <h3 className="text-sm font-medium">Differentials for this terminal</h3>
      <p className="mt-1 text-xs text-black/45">
        Named rows are a separate book from the worksheet Δ. Apply writes that ¢ into this
        terminal&apos;s Δ and saves it. Until you apply, they are not the same number. Empty cents
        stay blank. Not copied from a neighbor hub.
      </p>
      {diffs.length === 0 ? (
        <p className="mt-3 text-sm text-black/50">No saved rows. Add one.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {diffs.map((row) => {
            const live = row.product === "RB" ? sheet.rb.terminalDiff : sheet.ho.terminalDiff;
            const matches = row.centsVsScreen != null && live === row.centsVsScreen;
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {row.name} · {row.product} · {formatBoth(row.centsVsScreen)}
                  <span className="text-black/45">
                    {matches ? " · in worksheet Δ" : " · not in worksheet Δ"}
                  </span>
                </span>
                <span className="flex gap-3">
                  <form action={applyTerminalDiff}>
                    <input type="hidden" name="area" value={areaId} />
                    <input type="hidden" name="terminal" value={terminalId} />
                    <input type="hidden" name="diffId" value={row.id} />
                    <button
                      type="submit"
                      className="text-xs text-black/55 underline-offset-2 hover:underline"
                      data-testid={`apply-diff-${row.id}`}
                    >
                      Apply to worksheet Δ
                    </button>
                  </form>
                  <form action={removeTerminalDiff}>
                    <input type="hidden" name="area" value={areaId} />
                    <input type="hidden" name="terminal" value={terminalId} />
                    <input type="hidden" name="diffId" value={row.id} />
                    <button type="submit" className="text-xs text-black/45 underline-offset-2 hover:underline">
                      Remove
                    </button>
                  </form>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <form action={addTerminalDiff} className="mt-4 grid gap-2 sm:grid-cols-4">
        <input type="hidden" name="area" value={areaId} />
        <input type="hidden" name="terminal" value={terminalId} />
        <input type="hidden" name="unit" value={unit} />
        <input
          name="diffName"
          placeholder="Name (no number required)"
          className="h-9 border border-black/15 px-2 text-sm sm:col-span-2"
        />
        <select name="diffProduct" className="h-9 border border-black/15 px-2 text-sm">
          <option value="RB">RB</option>
          <option value="HO">HO</option>
        </select>
        <input
          name="diffCents"
          inputMode="decimal"
          placeholder={unit === "dollar" ? "$/gal vs screen" : "¢/gal vs screen"}
          className="h-9 border border-black/15 px-2 font-mono text-sm"
        />
        <button
          type="submit"
          className="h-9 border border-black/20 bg-white px-3 text-sm sm:col-span-4 sm:w-auto"
          data-testid="add-diff"
        >
          Add row
        </button>
      </form>
    </div>
  );
}

export function Waterfall({
  rb,
  ho,
}: {
  rb: ProductNetback;
  ho: ProductNetback;
}) {
  const scale = fattestTakeAcross([rb, ho]);
  return (
    <section className="mt-8" data-testid="waterfall">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Terminal → retail</p>
        <h2 className="mt-1 text-sm font-medium">Which take is hacking the gallon</h2>
        <p className="mt-1 max-w-3xl text-xs text-black/45">
          Each cut is a take. The longest bar is the fattest bite. Negative takes go left — they are
          not painted as a fake-positive slice. Empty rungs stay Call / — , never $0. Tax is a
          first-class take — federal, state, and other when present — not folded into leftover. Source
          is per product.
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {WHOLESALE_PRODUCTS.map((product) => {
          const book = product === "RB" ? rb : ho;
          return (
            <WaterfallColumn
              key={product}
              product={product}
              book={book}
              scale={scale}
            />
          );
        })}
      </div>
      <p className="mt-3 text-xs text-black/45">{MARINE_TAX_NOTE}</p>
    </section>
  );
}

function WaterfallColumn({
  product,
  book,
  scale,
}: {
  product: WholesaleProduct;
  book: ProductNetback;
  scale: number;
}) {
  const winner = book.fattestTake;
  return (
    <div
      className="border border-black/15 bg-white p-4"
      data-testid={`waterfall-${product.toLowerCase()}`}
      data-nymex-source={book.nymexSource ?? ""}
      data-tax-incomplete={book.taxIncomplete ? "1" : "0"}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{PRODUCT_LABEL[product]}</h3>
        {winner ? (
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a2c12]" data-testid={`fattest-${product.toLowerCase()}`}>
            Fattest · {book.takes[0]?.label} {formatCents(book.takes[0]?.cents ?? null)}
          </p>
        ) : (
          <p className="text-[11px] text-black/40">No takes yet</p>
        )}
      </div>
      <ol className="mt-4 space-y-2.5">
        {book.rungs.map((rung) => (
          <WaterfallRungRow key={rung.key} rung={rung} scale={scale} winner={winner === rung.takeKey} product={product} />
        ))}
      </ol>
      {book.taxIncomplete ? (
        <p className="mt-3 text-xs text-[#8a2c12]" data-testid={`tax-incomplete-${product.toLowerCase()}`}>
          Tax strip incomplete. Federal and state stay visible. Dock remaining stays —.
        </p>
      ) : null}
      <p className="mt-4 text-[11px] text-black/45" data-testid={`implied-${product.toLowerCase()}`}>
        Implied Δ {formatBoth(book.impliedDiff)}
        {book.typedDiff != null ? ` · typed Δ ${formatBoth(book.typedDiff)}` : ""}
        {book.edgeVsTyped != null ? ` · edge ${formatBoth(book.edgeVsTyped)}` : ""}
        {book.nymexSource ? ` · NYMEX source ${book.nymexSource}` : ""}
      </p>
    </div>
  );
}

function WaterfallRungRow({
  rung,
  scale,
  winner,
  product,
}: {
  rung: WaterfallRung;
  scale: number;
  winner: boolean;
  product: WholesaleProduct;
}) {
  const cents = rung.cents;
  const empty = cents == null;
  const width = cents == null || scale === 0 ? 0 : Math.max(6, (Math.abs(cents) / scale) * 50);
  const negative = cents != null && cents < 0;
  const isTake = rung.role === "take" || rung.role === "leftover";
  const isTax = rung.takeKey === "tax" || rung.takeKey === "taxFederal" || rung.takeKey === "taxState" || rung.takeKey === "taxOther";
  const origin = rung.origin === "incomplete" ? "incomplete" : rung.sourceLabel || rung.origin;
  return (
    <li
      data-testid={`rung-${product.toLowerCase()}-${rung.key}`}
      data-empty={empty ? "1" : "0"}
      data-winner={winner ? "1" : "0"}
      data-signed={empty ? "" : negative ? "negative" : "positive"}
      data-source={rung.origin ?? ""}
      className={rung.role === "start" || rung.role === "level" ? "pt-1" : ""}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-xs ${isTax ? "font-medium text-black" : "font-medium text-black/70"}`}>
          {rung.role === "level" || rung.role === "start" ? `= ${rung.label}` : rung.label}
        </span>
        <span className="font-mono text-xs tabular-nums">
          {empty ? "Call / —" : formatBoth(rung.cents)}
        </span>
      </div>
      {isTake ? (
          empty ? (
          <div className="mt-1 h-3 border border-dashed border-black/20 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(11,31,51,0.06)_6px,rgba(11,31,51,0.06)_7px)]" />
        ) : (
          <div className="relative mt-1 h-3 w-full bg-black/[0.04]">
            <div className="absolute top-0 left-1/2 h-full w-px bg-black/25" />
            <div
              style={{
                width: `${width}%`,
                left: negative ? `${50 - width}%` : "50%",
              }}
              className={
                negative
                  ? winner
                    ? "absolute top-0 h-full border border-dashed border-[#8a2c12] bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(138,44,18,0.35)_3px,rgba(138,44,18,0.35)_6px)]"
                    : "absolute top-0 h-full border border-dashed border-black/55 bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,rgba(0,0,0,0.12)_3px,rgba(0,0,0,0.12)_6px)]"
                  : winner
                    ? isTax
                      ? "absolute top-0 h-full bg-[#8a2c12]"
                      : "absolute top-0 h-full bg-black"
                    : isTax
                      ? "absolute top-0 h-full bg-[#8a2c12]/55"
                      : rung.role === "leftover"
                        ? "absolute top-0 h-full bg-black/25"
                        : "absolute top-0 h-full bg-black/45"
              }
            />
          </div>
        )
      ) : (
        <div className="mt-1 border-b border-black/10" />
      )}
      {origin ? (
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.06em] text-black/40">{origin}</p>
      ) : empty && isTake ? (
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.06em] text-black/35">Call / —</p>
      ) : null}
    </li>
  );
}

export function LoginPanel({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16">
      <h1 className="text-2xl font-medium tracking-tight">Wholesale</h1>
      <p className="mt-2 text-sm text-black/55">Password. Not a public board.</p>
      <form action={loginWholesale} className="mt-8 space-y-4" autoComplete="off">
        {error ? <p className="text-sm text-[#8a2c12]">{error}</p> : null}
        <label className="block text-sm">
          <span className="text-black/60">Password</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="mt-1 h-10 w-full border border-black/20 bg-white px-3 text-sm"
          />
        </label>
        <button type="submit" className="h-10 border border-black bg-black px-4 text-sm text-white">
          Enter
        </button>
      </form>
    </main>
  );
}
