import {
  PRODUCT_LABEL,
  WHOLESALE_AREA_ORDER,
  WHOLESALE_PRODUCTS,
  areaLabel,
  displayInputValue,
  formatBoth,
  sourceLabel,
  tcnLabel,
  type AreaTerminalRef,
  type DiffRow,
  type InputUnit,
  type ProductNetback,
  type TerminalWorksheet,
  type WholesaleArea,
  type WholesaleAreaId,
  type WholesaleProduct,
  type WholesaleTerminal,
} from "@/lib/wholesale";
import { addTerminalDiff, loginWholesale, logoutWholesale, removeTerminalDiff, saveWholesaleWorksheet } from "./actions";

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
              <th className="px-3 py-2 font-medium">RB rack</th>
              <th className="px-3 py-2 font-medium">HO rack</th>
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
      {area.footnotes.length > 0 ? (
        <ul className="mt-3 max-w-3xl space-y-1 text-xs leading-5 text-black/45">
          {area.footnotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function Worksheet({
  areaId,
  terminal,
  sheet,
  unit,
  diffs,
  error,
  saved,
}: {
  areaId: WholesaleAreaId;
  terminal: WholesaleTerminal;
  sheet: TerminalWorksheet;
  unit: InputUnit;
  diffs: DiffRow[];
  error?: string;
  saved?: boolean;
}) {
  const unitLabel = unit === "dollar" ? "$/gal" : "¢/gal";
  return (
    <section className="mt-10" data-testid="worksheet">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Worksheet</h2>
          <p className="mt-1 text-sm text-black/55">
            {terminal.city} · {tcnLabel(terminal)} · {terminal.operator}. Figures are typed, not market.
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

      <form action="" method="get" className="mt-4 print:hidden">
        <input type="hidden" name="area" value={areaId} />
        <input type="hidden" name="terminal" value={terminal.id} />
        <input type="hidden" name="unit" value={unit} />
        <WorksheetFields sheet={sheet} unit={unit} unitLabel={unitLabel} />
        <button type="submit" className="mt-4 h-9 border border-black/20 bg-white px-3 text-sm">
          Compute
        </button>
      </form>

      <form action={saveWholesaleWorksheet} className="mt-3 print:hidden">
        <input type="hidden" name="area" value={areaId} />
        <input type="hidden" name="terminal" value={terminal.id} />
        <input type="hidden" name="unit" value="cent" />
        <HiddenSheet sheet={sheet} />
        <button type="submit" className="h-9 border border-black bg-black px-3 text-sm text-white">
          Save terminal
        </button>
      </form>

      <DiffEditor areaId={areaId} terminalId={terminal.id} unit={unit} diffs={diffs} />
    </section>
  );
}

function HiddenSheet({ sheet }: { sheet: TerminalWorksheet }) {
  const pairs: Array<[string, number | null]> = [
    ["nymex_rb", sheet.rb.nymexScreen],
    ["diff_rb", sheet.rb.terminalDiff],
    ["freight_rb", sheet.rb.inboundFreight],
    ["rack_rb", sheet.rb.postedRack],
    ["jobber_rb", sheet.rb.jobberSell],
    ["dock_rb", sheet.rb.dockPosted],
    ["nymex_ho", sheet.ho.nymexScreen],
    ["diff_ho", sheet.ho.terminalDiff],
    ["freight_ho", sheet.ho.inboundFreight],
    ["rack_ho", sheet.ho.postedRack],
    ["jobber_ho", sheet.ho.jobberSell],
    ["dock_ho", sheet.ho.dockPosted],
    ["tax_federal", sheet.tax.federal],
    ["tax_state", sheet.tax.state],
    ["tax_other", sheet.tax.other],
    ["tax_one", sheet.tax.oneLine],
  ];
  return (
    <>
      {pairs.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value == null ? "" : String(value)} />
      ))}
    </>
  );
}

function WorksheetFields({
  sheet,
  unit,
  unitLabel,
}: {
  sheet: TerminalWorksheet;
  unit: InputUnit;
  unitLabel: string;
}) {
  return (
    <div className="overflow-x-auto border border-black/15 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-black/45">
            <th className="px-3 py-2 font-medium">Input · {unitLabel}</th>
            <th className="px-3 py-2 font-medium">{PRODUCT_LABEL.RB}</th>
            <th className="px-3 py-2 font-medium">{PRODUCT_LABEL.HO}</th>
          </tr>
        </thead>
        <tbody>
          <FieldRow label="NYMEX screen" name="nymex" rb={sheet.rb.nymexScreen} ho={sheet.ho.nymexScreen} unit={unit} />
          <FieldRow label="Terminal differential vs screen" name="diff" rb={sheet.rb.terminalDiff} ho={sheet.ho.terminalDiff} unit={unit} />
          <FieldRow label="Inbound freight / pipeline / truck" name="freight" rb={sheet.rb.inboundFreight} ho={sheet.ho.inboundFreight} unit={unit} />
          <FieldRow label="Posted rack" name="rack" rb={sheet.rb.postedRack} ho={sheet.ho.postedRack} unit={unit} />
          <FieldRow label="Jobber sell" name="jobber" rb={sheet.rb.jobberSell} ho={sheet.ho.jobberSell} unit={unit} />
          <FieldRow label="Dock / retail posted" name="dock" rb={sheet.rb.dockPosted} ho={sheet.ho.dockPosted} unit={unit} />
        </tbody>
      </table>
      <div className="grid gap-3 border-t border-black/10 p-3 sm:grid-cols-4">
        <TaxField label="Tax · federal" name="tax_federal" value={sheet.tax.federal} unit={unit} />
        <TaxField label="Tax · state" name="tax_state" value={sheet.tax.state} unit={unit} />
        <TaxField label="Tax · other" name="tax_other" value={sheet.tax.other} unit={unit} />
        <TaxField label="Tax · one line" name="tax_one" value={sheet.tax.oneLine} unit={unit} />
      </div>
      <p className="px-3 pb-3 text-xs text-black/45">
        One tax line overrides the split. Empty stays blank — never filled as zero.
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
}: {
  label: string;
  name: string;
  rb: number | null;
  ho: number | null;
  unit: InputUnit;
}) {
  return (
    <tr className="border-t border-black/10">
      <th className="px-3 py-2 text-left text-xs font-medium text-black/60">{label}</th>
      <td className="px-3 py-2">
        <input
          name={`${name}_rb`}
          inputMode="decimal"
          defaultValue={displayInputValue(rb, unit)}
          className="h-9 w-full border border-black/15 px-2 font-mono text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          name={`${name}_ho`}
          inputMode="decimal"
          defaultValue={displayInputValue(ho, unit)}
          className="h-9 w-full border border-black/15 px-2 font-mono text-sm"
        />
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
}: {
  areaId: WholesaleAreaId;
  terminalId: string;
  unit: InputUnit;
  diffs: DiffRow[];
}) {
  return (
    <div className="mt-6 border border-black/15 bg-white p-4 print:hidden">
      <h3 className="text-sm font-medium">Differentials for this terminal</h3>
      <p className="mt-1 text-xs text-black/45">
        Named ¢/gal vs the screen. Empty cents stay blank. Not copied from a neighbor hub.
      </p>
      {diffs.length === 0 ? (
        <p className="mt-3 text-sm text-black/50">No saved rows. Add one.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {diffs.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {row.name} · {row.product} · {formatBoth(row.centsVsScreen)}
              </span>
              <form action={removeTerminalDiff}>
                <input type="hidden" name="area" value={areaId} />
                <input type="hidden" name="terminal" value={terminalId} />
                <input type="hidden" name="diffId" value={row.id} />
                <button type="submit" className="text-xs text-black/45 underline-offset-2 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
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
        <button type="submit" className="h-9 border border-black/20 bg-white px-3 text-sm sm:col-span-4 sm:w-auto">
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
  return (
    <section className="mt-8" data-testid="waterfall">
      <h2 className="text-sm font-medium">Margin available by step</h2>
      <p className="mt-1 text-xs text-black/45">Source = typed or derived. Blank is — , not $0.00.</p>
      <div className="mt-3 overflow-x-auto border border-black/15 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-black/45">
              <th className="px-3 py-2 font-medium">Step</th>
              <th className="px-3 py-2 font-medium">RB</th>
              <th className="px-3 py-2 font-medium">HO</th>
              <th className="px-3 py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {rb.steps.map((step, index) => {
              const other = ho.steps[index];
              return (
                <tr key={step.key} className="border-t border-black/10">
                  <th className="px-3 py-2 text-left text-xs font-medium text-black/65">{step.label}</th>
                  <td className="px-3 py-2 font-mono text-xs">{formatBoth(step.cents)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{formatBoth(other.cents)}</td>
                  <td className="px-3 py-2 text-xs text-black/45">{sourceLabel(step)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ReverseTable rb={rb} ho={ho} />
      <StackBars rb={rb} ho={ho} />
    </section>
  );
}

function ReverseTable({ rb, ho }: { rb: ProductNetback; ho: ProductNetback }) {
  const rows = [
    ["Dock posted − tax = rack-equivalent netback", rb.rackEquivalent, ho.rackEquivalent],
    ["Rack-equivalent − inbound freight = terminal-equivalent", rb.terminalEquivalent, ho.terminalEquivalent],
    ["Terminal-equivalent − NYMEX = implied differential", rb.impliedDiff, ho.impliedDiff],
    ["Implied Δ vs typed Δ (edge)", rb.edgeVsTyped, ho.edgeVsTyped],
  ] as const;
  return (
    <div className="mt-4 overflow-x-auto border border-black/15 bg-white">
      <table className="min-w-full text-sm" data-testid="reverse-netback">
        <thead>
          <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-[0.08em] text-black/45">
            <th className="px-3 py-2 font-medium">Reverse netback</th>
            <th className="px-3 py-2 font-medium">RB</th>
            <th className="px-3 py-2 font-medium">HO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, r, h]) => (
            <tr key={label} className="border-t border-black/10">
              <th className="px-3 py-2 text-left text-xs font-medium text-black/65">{label}</th>
              <td className="px-3 py-2 font-mono text-xs">{formatBoth(r)}</td>
              <td className="px-3 py-2 font-mono text-xs">{formatBoth(h)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StackBars({ rb, ho }: { rb: ProductNetback; ho: ProductNetback }) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 print:grid-cols-2">
      {WHOLESALE_PRODUCTS.map((product) => {
        const book = product === "RB" ? rb : ho;
        const parts = [
          { label: "Rack", value: book.rackMargin },
          { label: "Jobber", value: book.jobberMargin },
          { label: "Dock remaining", value: book.dockRemaining },
        ];
        const known = parts.filter((part) => part.value != null);
        const total = known.reduce((sum, part) => sum + Math.abs(part.value as number), 0);
        return (
          <div key={product} className="border border-black/15 bg-white p-3">
            <p className="text-xs font-medium">{PRODUCT_LABEL[product as WholesaleProduct]} · stack</p>
            {known.length === 0 ? (
              <p className="mt-3 text-sm text-black/45">—</p>
            ) : (
              <div className="mt-3 flex h-8 w-full overflow-hidden border border-black/15">
                {parts.map((part) => {
                  if (part.value == null || total === 0) return null;
                  const width = `${(Math.abs(part.value) / total) * 100}%`;
                  return (
                    <div
                      key={part.label}
                      title={`${part.label} ${formatBoth(part.value)}`}
                      style={{ width }}
                      className={
                        part.label === "Rack"
                          ? "bg-black/70"
                          : part.label === "Jobber"
                            ? "bg-black/40"
                            : "bg-black/20"
                      }
                    />
                  );
                })}
              </div>
            )}
            <ul className="mt-2 space-y-0.5 text-[11px] text-black/55">
              {parts.map((part) => (
                <li key={part.label}>
                  {part.label}: {formatBoth(part.value)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
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
