import {
  PRODUCT_DOCK_LABEL,
  TEAR_SHEET_NEED,
  WHOLESALE_AREA_ORDER,
  WHOLESALE_PRODUCTS,
  areaLabel,
  deskFootnotes,
  formatBoth,
  marinaPitchReady,
  netbackHasFigures,
  tcnLabel,
  tearSheetPath,
  type AreaTerminalRef,
  type Cents,
  type DiffRow,
  type InputUnit,
  type PreparedWorksheet,
  type ProductNetback,
  type ProductTaxSlice,
  type TerminalWorksheet,
  type WholesaleArea,
  type WholesaleAreaId,
  type WholesaleTerminal,
} from "@/lib/wholesale";
import type { NymexScreenPull } from "@/lib/wholesale-nymex";
import {
  addTerminalDiff,
  applyTerminalDiff,
  loginWholesale,
  logoutWholesale,
  removeTerminalDiff,
} from "./actions";
import { ShortPathForm } from "./short-path";

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
  const selected = rows.find((row) => row.terminal.id === selectedId);
  const selectedFilled = Boolean(
    selected && (netbackHasFigures(selected.rb) || netbackHasFigures(selected.ho)),
  );
  const anyFilled = rows.some((row) => netbackHasFigures(row.rb) || netbackHasFigures(row.ho));
  const regionNote = !anyFilled
    ? "Region rack / remaining / implied Δ stay — until you Compute or Save a worksheet on a terminal. Compute writes the same book this table and investor print read."
    : selected && !selectedFilled
      ? "This terminal’s row stays — until you Compute or Save its worksheet. Other rows fill only after that terminal’s book is computed or saved."
      : "A computed or saved book fills that terminal’s row. Other terminals stay — until you Compute or Save them.";
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">Terminals for this region</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-black/55">{area.note}</p>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-black/50" data-testid="region-empty-note">
        {regionNote}
      </p>
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
        OPIS, DTN, or a paid vendor. Typed screen wins — a typed cell is your number, not the live
        pull. Failed or stale quotes stay —.
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

export function TearSheetControl({
  areaId,
  terminalId,
  rb,
  ho,
}: {
  areaId: WholesaleAreaId;
  terminalId: string;
  rb: ProductNetback;
  ho: ProductNetback;
}) {
  const ready = WHOLESALE_PRODUCTS.filter((product) =>
    marinaPitchReady(product === "RB" ? rb : ho),
  );
  if (ready.length === 0) {
    return (
      <div className="print:hidden" data-testid="tear-sheet-disabled">
        <button
          type="button"
          disabled
          aria-describedby="tear-sheet-reason"
          className="h-9 cursor-not-allowed border border-black/15 bg-white px-3 text-sm text-black/35"
        >
          Tear sheet
        </button>
        <p
          id="tear-sheet-reason"
          className="mt-1 max-w-xs text-[11px] leading-4 text-black/45"
          data-testid="tear-sheet-reason"
        >
          {TEAR_SHEET_NEED}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden" data-testid="tear-sheet-control">
      {ready.map((product) => (
        <a
          key={product}
          href={tearSheetPath(areaId, terminalId, product)}
          data-testid={`tear-sheet-${product.toLowerCase()}`}
          className="inline-flex h-9 items-center border border-black bg-black px-3 text-sm text-white hover:bg-black/90"
        >
          Tear sheet
          {ready.length > 1 ? ` · ${PRODUCT_DOCK_LABEL[product]}` : ""}
        </a>
      ))}
    </div>
  );
}

export function Worksheet({
  areaId,
  terminal,
  sheet,
  prepared,
  rb,
  ho,
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
  rb: ProductNetback;
  ho: ProductNetback;
  unit: InputUnit;
  diffs: DiffRow[];
  screens: NymexScreenPull;
  draft?: boolean;
  error?: string;
  saved?: boolean;
}) {
  const unitLabel = unit === "dollar" ? "$/gal" : "¢/gal";
  const display: TerminalWorksheet = {
    rb: sheet.rb,
    ho: sheet.ho,
    tax: sheet.tax,
    taxRb: {
      federal: displayTaxBox(sheet.taxRb, "federal", sheet.tax.federal, prepared?.rb.tax.federal.cents ?? null),
      state: displayTaxBox(sheet.taxRb, "state", sheet.tax.state, prepared?.rb.tax.state.cents ?? null),
      ...(sheet.taxRb?.touched ? { touched: true } : {}),
    },
    taxHo: {
      federal: displayTaxBox(sheet.taxHo, "federal", sheet.tax.federal, prepared?.ho.tax.federal.cents ?? null),
      state: displayTaxBox(sheet.taxHo, "state", sheet.tax.state, prepared?.ho.tax.state.cents ?? null),
      ...(sheet.taxHo?.touched ? { touched: true } : {}),
    },
  };
  const formKey = JSON.stringify({
    terminal: terminal.id,
    unit,
    rb: display.rb,
    ho: display.ho,
    tax: display.tax,
    taxRb: display.taxRb,
    taxHo: display.taxHo,
  });
  return (
    <section className="mt-8" data-testid="worksheet">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">This terminal</h2>
          <p className="mt-1 text-sm text-black/55">
            {terminal.city} · {tcnLabel(terminal)} · {terminal.operator}. Posted rack and invoice
            first. Empty stays blank. Freight is typed tariff only — miles are labels, not cents.
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
        </div>
        <TearSheetControl areaId={areaId} terminalId={terminal.id} rb={rb} ho={ho} />
      </div>

      {error ? <p className="mt-3 text-sm text-[#8a2c12]">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm text-black/55">Saved for this terminal.</p> : null}
      {draft ? (
        <p className="mt-3 text-sm text-black/55" data-testid="compute-draft">
          Computed book for this terminal. The boxes below are the same figures — still editable.
        </p>
      ) : null}

      <ShortPathForm
        key={formKey}
        areaId={areaId}
        terminalId={terminal.id}
        sheet={display}
        prepared={prepared}
        rb={rb}
        ho={ho}
        unit={unit}
        unitLabel={unitLabel}
        screens={screens}
      />

      <details className="mt-6 border border-black/15 bg-white print:hidden" data-testid="named-diffs">
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-black/70">
          Named differentials
        </summary>
        <div className="border-t border-black/10">
          <DiffEditor areaId={areaId} terminalId={terminal.id} unit={unit} diffs={diffs} sheet={sheet} />
        </div>
      </details>
    </section>
  );
}

function displayTaxBox(
  slice: ProductTaxSlice | undefined,
  part: "federal" | "state",
  shared: Cents,
  prepared: Cents,
): Cents {
  const value = slice?.[part] ?? null;
  if (slice?.touched && value == null) return null;
  return value ?? shared ?? prepared ?? null;
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
    <div className="p-4 print:hidden">
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

export function LoginPanel({ error }: { error?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16">
      <h1 className="font-heading text-2xl text-[color:var(--navy)]">Wholesale</h1>
      <p className="mt-2 text-sm text-[color:var(--ink)]/70">
        What it cost. What they posted. Locked door.
      </p>
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
          Continue
        </button>
      </form>
    </main>
  );
}
