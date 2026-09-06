import {
  MARINE_TAX_NOTE,
  PRESSURE_LADDER_KEYS,
  PRODUCT_LABEL,
  RIN_STACK_NOTE,
  WHOLESALE_PRODUCTS,
  displayInputValue,
  formatBoth,
  jobberOnStack,
  postedLeftoverCents,
  type Cents,
  type InputUnit,
  type PreparedWorksheet,
  type ProductNetback,
  type TerminalWorksheet,
  type WholesaleProduct,
} from "@/lib/wholesale";
import type { NymexScreenPull } from "@/lib/wholesale-nymex";
import { computeWholesaleWorksheet, saveWholesaleWorksheet } from "./actions";

export function ShortPathForm({
  areaId,
  terminalId,
  sheet,
  prepared,
  rb,
  ho,
  unit,
  unitLabel,
  screens,
}: {
  areaId: string;
  terminalId: string;
  sheet: TerminalWorksheet;
  prepared?: PreparedWorksheet;
  rb: ProductNetback;
  ho: ProductNetback;
  unit: InputUnit;
  unitLabel: string;
  screens: NymexScreenPull;
}) {
  const books = { RB: rb, HO: ho };

  return (
    <form
      className="mt-4 print:hidden [&:has([data-ui-product=ho]:checked)_[data-panel=rb]]:hidden [&:has([data-ui-product=rb]:checked)_[data-panel=ho]]:hidden [&:has([data-ui-product=ho]:checked)_[data-testid=ho-collapsed]]:hidden [&:has([data-ui-product=rb]:checked)_[data-testid=product-ho]]:bg-[#161616] [&:has([data-ui-product=rb]:checked)_[data-testid=product-ho]]:text-white/40 [&:has([data-ui-product=ho]:checked)_[data-testid=product-ho]]:bg-black [&:has([data-ui-product=ho]:checked)_[data-testid=product-ho]]:text-white [&:has([data-ui-product=rb]:checked)_[data-testid=product-rb]]:bg-black [&:has([data-ui-product=rb]:checked)_[data-testid=product-rb]]:text-white [&:has([data-ui-product=ho]:checked)_[data-testid=product-rb]]:bg-white [&:has([data-ui-product=ho]:checked)_[data-testid=product-rb]]:text-black/60"
      data-testid="short-path"
      data-product="RB"
    >
      <input type="hidden" name="area" value={areaId} />
      <input type="hidden" name="terminal" value={terminalId} />
      <input type="hidden" name="unit" value={unit} />
      <input
        id="ui-product-rb"
        type="radio"
        name="ui_product"
        value="RB"
        data-ui-product="rb"
        defaultChecked
        className="sr-only"
      />
      <input
        id="ui-product-ho"
        type="radio"
        name="ui_product"
        value="HO"
        data-ui-product="ho"
        className="sr-only"
      />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Product">
        <label
          htmlFor="ui-product-rb"
          role="tab"
          data-testid="product-rb"
          className="cursor-pointer border border-black bg-black px-3 py-1.5 text-xs text-white"
        >
          {PRODUCT_LABEL.RB}
        </label>
        <label
          htmlFor="ui-product-ho"
          role="tab"
          data-testid="product-ho"
          data-collapsed="1"
          className="cursor-pointer border border-black bg-[#161616] px-3 py-1.5 text-xs text-white/40"
        >
          Diesel · {PRODUCT_LABEL.HO}
        </label>
      </div>

      {WHOLESALE_PRODUCTS.map((item) => (
        <ProductShortPath
          key={item}
          product={item}
          sheet={sheet}
          prepared={prepared}
          book={books[item]}
          unit={unit}
          unitLabel={unitLabel}
          screens={screens}
        />
      ))}

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

      <details className="mt-6 border border-black/15 bg-white" data-testid="full-stack">
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">Full stack</summary>
        <div className="border-t border-black/10 px-3 pb-4 pt-3">
          <p className="text-xs text-black/50">
            Netback to retail from pipe barrels at this spoke. Fat take stays invoice − posted rack
            on the short path. Incomplete tax stays —, never $0.00.
          </p>
          {WHOLESALE_PRODUCTS.map((item) => (
            <PressureLadder
              key={item}
              product={item}
              sheet={sheet}
              prepared={prepared}
              book={books[item]}
              unit={unit}
            />
          ))}
          <div
            data-testid="ho-collapsed"
            className="mt-3 flex min-h-[4.5rem] items-center justify-center border border-black bg-[#111] px-4 text-center text-sm text-white/40"
          >
            Diesel stays dark until you open it.
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TaxField label="Other tax" name="tax_other" value={sheet.tax.other} unit={unit} />
            <TaxField
              label="One line (replaces federal tax and state tax)"
              name="tax_one"
              value={sheet.tax.oneLine}
              unit={unit}
            />
          </div>
        </div>
      </details>

      <p className="mt-3 text-xs text-black/45">
        {MARINE_TAX_NOTE} Published federal and state defaults come from the IRS / EIA table on this
        desk on first load only. Clearing federal, state, or the one-line tax leaves that product
        incomplete — DAP, should-be, dock ex-tax, and remaining stay —, never $0.00, and the published
        default is not written back in. One tax line overrides the split. Fair hose and invoice stay
        blank until typed. Fat take is invoice versus posted rack, not posted pump.
      </p>
      <p className="mt-2 text-[11px] text-black/40" data-testid="rin-footnote">
        {RIN_STACK_NOTE}
      </p>
    </form>
  );
}

function ProductShortPath({
  product,
  sheet,
  prepared,
  book,
  unit,
  unitLabel,
  screens,
}: {
  product: WholesaleProduct;
  sheet: TerminalWorksheet;
  prepared?: PreparedWorksheet;
  book: ProductNetback;
  unit: InputUnit;
  unitLabel: string;
  screens: NymexScreenPull;
}) {
  const p = product.toLowerCase() as "rb" | "ho";
  const inputs = product === "RB" ? sheet.rb : sheet.ho;
  const preparedProduct = product === "RB" ? prepared?.rb : prepared?.ho;
  const quote = screens[product];
  const hoseOpen = inputs.fairHose != null;
  const loud = book.fatTake != null && book.fatTake > 0;

  return (
    <div
      data-panel={p}
      data-testid={`short-path-${p}`}
      className="mt-4 max-w-xl space-y-4"
    >
      <p className="text-[11px] uppercase tracking-[0.08em] text-black/40">
        Short path · {PRODUCT_LABEL[product]} · {unitLabel}
      </p>

      <ProductField
        label="NYMEX screen"
        name={`nymex_${p}`}
        value={inputs.nymexScreen}
        unit={unit}
        placeholder={yahooHint(quote.cents, unit)}
        typed={inputs.nymexScreen != null}
        hint={
          inputs.nymexScreen != null
            ? "typed — not the Yahoo pull"
            : quote.status === "ok"
              ? `Yahoo ${quote.asOfLabel ? `as of ${quote.asOfLabel}` : "screen"} · used if this box stays blank`
              : quote.note ?? "Yahoo screen blank"
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ProductField
          label="Federal tax"
          name={`tax_federal_${p}`}
          value={sheet[product === "RB" ? "taxRb" : "taxHo"]?.federal ?? null}
          unit={unit}
          hint={preparedProduct?.tax.federal.sourceLabel ?? null}
          quiet
        />
        <ProductField
          label="State tax"
          name={`tax_state_${p}`}
          value={sheet[product === "RB" ? "taxRb" : "taxHo"]?.state ?? null}
          unit={unit}
          hint={preparedProduct?.tax.state.sourceLabel ?? null}
          quiet
        />
      </div>

      <div className="space-y-3 border border-black/20 bg-white p-3">
        <ProductField
          label="Posted rack"
          name={`rack_${p}`}
          value={inputs.postedRack}
          unit={unit}
          typed={inputs.postedRack != null}
          primary
        />
        <ProductField
          label="Invoice / delivered"
          name={`invoice_${p}`}
          value={inputs.invoiceDelivered}
          unit={unit}
          typed={inputs.invoiceDelivered != null}
          hint="Typed only. Never from the board or posted pump."
          primary
        />
        <details data-testid={`fair-hose-${p}`} open={hoseOpen}>
          <summary className="cursor-pointer text-xs font-medium text-black/55">
            Fair hose.{hoseOpen ? "" : " Optional — blank until typed."}
          </summary>
          <div className="mt-2">
            <ProductField
              label="Fair hose."
              name={`hose_${p}`}
              value={inputs.fairHose}
              unit={unit}
              typed={inputs.fairHose != null}
              hint="Typed cost-to-cost. Blank until you type it."
            />
          </div>
        </details>
      </div>

      <div
        data-testid={`fat-take-${p}`}
        data-empty={book.fatTake == null ? "1" : "0"}
        className={
          loud
            ? "border-2 border-black bg-[#f7f4ee] px-4 py-4"
            : "border border-black/20 bg-white px-4 py-4"
        }
      >
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a2c12]">Fat take</p>
        <p className="mt-1 font-mono text-2xl tabular-nums leading-none">
          {book.fatTake == null ? "—" : formatBoth(book.fatTake)}
        </p>
        <p className="mt-2 text-xs text-black/50">invoice − posted rack</p>
      </div>

      <div data-testid={`terminal-settings-${p}`}>
        <ProductField
          label="Terminal differential vs screen"
          name={`diff_${p}`}
          value={inputs.terminalDiff}
          unit={unit}
          quiet
        />
      </div>

      {book.taxIncomplete ? (
        <p className="text-xs text-[#8a2c12]" data-testid={`tax-incomplete-${p}`}>
          Tax strip incomplete. Federal and state stay visible. DAP, should-be, and dock remaining stay —.
        </p>
      ) : null}
    </div>
  );
}

function PressureLadder({
  product,
  sheet,
  prepared,
  book,
  unit,
}: {
  product: WholesaleProduct;
  sheet: TerminalWorksheet;
  prepared?: PreparedWorksheet;
  book: ProductNetback;
  unit: InputUnit;
}) {
  const p = product.toLowerCase() as "rb" | "ho";
  const inputs = product === "RB" ? sheet.rb : sheet.ho;
  const taxSlice = product === "RB" ? sheet.taxRb : sheet.taxHo;
  const preparedProduct = product === "RB" ? prepared?.rb : prepared?.ho;
  const leftover = postedLeftoverCents(inputs.dockPosted, book.shouldBe);
  const jobber = jobberOnStack(inputs.invoiceDelivered, inputs.jobberSell);
  const invoiceTyped = inputs.invoiceDelivered != null;
  const taxIncomplete = book.taxIncomplete;
  const taxValue = taxIncomplete ? null : book.tax;
  const nymexStep = book.steps.find((step) => step.key === "nymex");

  return (
    <ol
      data-panel={p}
      data-testid={`pressure-ladder-${p}`}
      data-ladder={PRESSURE_LADDER_KEYS.join(" ")}
      className="mt-4 max-w-xl space-y-3"
    >
      <li data-rung="pipe" className="border border-black/10 bg-white p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">1 · Terminal / pipe</p>
        <p className="mt-1 font-mono text-sm tabular-nums">{formatBoth(book.terminalSpot)}</p>
        <p className="mt-1 text-xs text-black/50">
          Pipe bbls at this spoke. Spot, or NYMEX+Δ when the screen is filled.{" "}
          {nymexStep?.source === "yahoo" ? "Yahoo screen · typed Δ wins if you type it." : null}
          {nymexStep?.source === "typed" ? "Typed screen." : null}
        </p>
        <p className="mt-1 font-mono text-[11px] text-black/40">
          Δ {formatBoth(inputs.terminalDiff)}
        </p>
      </li>
      <li data-rung="freight" className="border border-black/10 bg-white p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">2 · Inbound freight</p>
        <p className="mt-0.5 text-xs text-black/50">
          Pipeline / truck, terminal → marina tank. Real tariff only. Empty stays —.
        </p>
        <div className="mt-2">
          <ProductField
            label="Inbound freight / pipeline / truck"
            name={`freight_${p}`}
            value={inputs.inboundFreight}
            unit={unit}
          />
        </div>
      </li>
      <LadderRung
        n={3}
        rung="inbound"
        label="Inbound rack cost"
        value={book.inboundRack}
        note="Terminal / pipe + typed freight. Empty freight stays —."
      />
      <li data-rung="postedRack" className="border border-black/10 bg-white p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">4 · Posted rack</p>
        <p className="mt-1 font-mono text-sm tabular-nums">{formatBoth(inputs.postedRack)}</p>
        <p className="mt-1 text-xs text-black/50">
          Rack margin {formatBoth(book.rackMargin)} · posted rack − inbound rack.
        </p>
      </li>
      <li
        data-rung="jobber"
        data-omitted={invoiceTyped || jobber == null ? "1" : "0"}
        className="border border-black/10 bg-white p-3"
      >
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">5 · Jobber</p>
        <p className="mt-1 font-mono text-sm tabular-nums">{formatBoth(jobber)}</p>
        <p className="mt-1 text-xs text-black/50">
          Only if used, and not already inside the invoice. Else —.
        </p>
        <details className="mt-2" open={!invoiceTyped && inputs.jobberSell != null}>
          <summary className="cursor-pointer text-[11px] text-black/45">
            {invoiceTyped
              ? "Invoice already carries delivered. Jobber stays off the stack."
              : "Type jobber only when it is not inside the invoice."}
          </summary>
          <div className="mt-2">
            <ProductField label="Jobber sell" name={`jobber_${p}`} value={inputs.jobberSell} unit={unit} />
          </div>
        </details>
      </li>
      <li data-rung="tax" className="border border-black/10 bg-white p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">6 · Federal / state tax</p>
        <p className="mt-1 font-mono text-sm tabular-nums">{formatBoth(taxValue)}</p>
        <p className="mt-1 text-xs text-black/50">
          Federal {formatBoth(taxSlice?.federal ?? null)} · State {formatBoth(taxSlice?.state ?? null)}.
          Incomplete = —, never $0. Cleared boxes stay blank.
        </p>
      </li>
      <LadderRung
        n={7}
        rung="dap"
        label="DAP"
        value={book.dap}
        note="Delivered cost. Pipe + freight + tax, or posted rack + freight + tax. No vendor feed."
      />
      <li data-rung="fairHose" className="border border-black/10 bg-white p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">8 · Fair hose. → should-be</p>
        <p className="mt-1 font-mono text-sm tabular-nums">
          {formatBoth(inputs.fairHose)} → {formatBoth(book.shouldBe)}
        </p>
        <p className="mt-1 text-xs text-black/50">
          Fair hose typed only. What it should have been. = DAP + Fair hose when both complete. Else —.
        </p>
      </li>
      <li data-rung="invoice" className="border border-black/10 bg-white p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/45">9 · Invoice → fat take</p>
        <p className="mt-1 font-mono text-sm tabular-nums">
          {formatBoth(inputs.invoiceDelivered)} → {formatBoth(book.fatTake)}
        </p>
        <p className="mt-1 text-xs text-black/50">
          Typed cost-to-cost. Fat take = invoice − posted rack. The pitch stays on the short path.
        </p>
      </li>
      <li data-rung="leftover" className="border border-black/10 bg-black/[0.02] p-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-black/40">10 · Posted leftover</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-black/70">{formatBoth(leftover)}</p>
        <p className="mt-1 text-xs text-black/45">
          posted vs should-be. Dock remaining {formatBoth(book.dockRemaining)}. Quiet end of the
          stack — not the pitch.
        </p>
        <div className="mt-2">
          <ProductField
            label="Posted pump"
            name={`dock_${p}`}
            value={inputs.dockPosted}
            unit={unit}
            hint={preparedProduct?.labels.dockPosted ?? "Boater's number. Not the cost sheet."}
            quiet
          />
        </div>
      </li>
    </ol>
  );
}

function LadderRung({
  n,
  rung,
  label,
  value,
  note,
  loud,
  quiet,
}: {
  n: number;
  rung: (typeof PRESSURE_LADDER_KEYS)[number];
  label: string;
  value: Cents;
  note: string;
  loud?: boolean;
  quiet?: boolean;
}) {
  return (
    <li
      data-rung={rung}
      data-empty={value == null ? "1" : "0"}
      className={
        loud
          ? "border border-black bg-[#f7f4ee] p-3"
          : quiet
            ? "border border-black/10 bg-black/[0.02] p-3"
            : "border border-black/10 bg-white p-3"
      }
    >
      <p className={`text-[11px] uppercase tracking-[0.08em] ${quiet ? "text-black/40" : "text-black/45"}`}>
        {n} · {label}
      </p>
      <p className="mt-1 font-mono text-sm tabular-nums">{formatBoth(value)}</p>
      <p className="mt-1 text-xs text-black/50">{note}</p>
    </li>
  );
}

function ProductField({
  label,
  name,
  value,
  unit,
  hint,
  placeholder,
  typed,
  primary,
  quiet,
}: {
  label: string;
  name: string;
  value: Cents;
  unit: InputUnit;
  hint?: string | null;
  placeholder?: string;
  typed?: boolean;
  primary?: boolean;
  quiet?: boolean;
}) {
  return (
    <label className={`block ${quiet ? "text-[11px] text-black/50" : "text-xs text-black/70"}`}>
      <span className={primary ? "font-medium text-black" : undefined}>{label}</span>
      <input
        name={name}
        inputMode="decimal"
        defaultValue={displayInputValue(value, unit)}
        placeholder={placeholder}
        data-typed={typed ? "1" : "0"}
        className={
          primary
            ? typed
              ? "mt-1 h-11 w-full border border-black/40 bg-[#f7f4ee] px-2 font-mono text-base"
              : "mt-1 h-11 w-full border border-black/25 px-2 font-mono text-base"
            : typed
              ? "mt-1 h-9 w-full border border-black/40 bg-[#f7f4ee] px-2 font-mono text-sm"
              : "mt-1 h-9 w-full border border-black/15 px-2 font-mono text-sm"
        }
      />
      {hint ? <span className="mt-1 block text-[11px] text-black/40">{hint}</span> : null}
    </label>
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

function yahooHint(cents: number | null, unit: InputUnit): string {
  if (cents == null) return "";
  return `${displayInputValue(cents, unit)} yahoo`;
}
