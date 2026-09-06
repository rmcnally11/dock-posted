import { PrintButton } from "@/components/print-button";
import {
  deskFootnotes,
  formatBoth,
  netbackHasFigures,
  tcnLabel,
  type AreaTerminalRef,
  type ProductNetback,
  type WholesaleArea,
  type WholesaleTerminal,
} from "@/lib/wholesale";
import { DeskLogout } from "../desk";

export function FullBook({
  area,
  rows,
  deskHref,
}: {
  area: WholesaleArea;
  rows: Array<{
    terminal: WholesaleTerminal;
    ref: AreaTerminalRef;
    rb: ProductNetback;
    ho: ProductNetback;
  }>;
  deskHref: string;
}) {
  const footnotes = deskFootnotes(area);
  const anyBook = rows.some((row) => netbackHasFigures(row.rb) || netbackHasFigures(row.ho));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:px-0 print:py-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Wholesale · {area.label}</h1>
          <p className="mt-2 text-xs text-black/45">{area.note}</p>
          {anyBook ? (
            <p className="mt-2 text-xs text-black/50">
              Computed or saved books fill those terminals. Blank rows have not been computed or
              saved.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#8a2c12]" data-testid="print-empty">
              No computed or saved book for this region yet. Compute or Save on the desk — this
              matrix stays — until then. Print cannot invent a book.
            </p>
          )}
          {footnotes.length > 0 ? (
            <ul className="mt-2 max-w-3xl space-y-1 text-xs text-black/45">
              {footnotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <DeskLogout />
      </div>

      <div className="mt-6 overflow-x-auto border border-black/15 bg-white">
        <table className="min-w-full text-left text-xs" data-testid="print-matrix">
          <thead className="border-b border-black/10 bg-black/[0.03] text-[11px] uppercase tracking-[0.08em] text-black/45">
            <tr>
              <th className="px-2 py-2 font-medium">Terminal</th>
              <th className="px-2 py-2 font-medium">TCN</th>
              <th className="px-2 py-2 font-medium">Product</th>
              <th className="px-2 py-2 font-medium">NYMEX</th>
              <th className="px-2 py-2 font-medium">Typed Δ</th>
              <th className="px-2 py-2 font-medium">Spot</th>
              <th className="px-2 py-2 font-medium">Freight</th>
              <th className="px-2 py-2 font-medium">Inbound rack</th>
              <th className="px-2 py-2 font-medium">Posted rack</th>
              <th className="px-2 py-2 font-medium">Rack margin</th>
              <th className="px-2 py-2 font-medium">Jobber</th>
              <th className="px-2 py-2 font-medium">Jobber margin</th>
              <th className="px-2 py-2 font-medium">Posted pump</th>
              <th className="px-2 py-2 font-medium">Federal tax</th>
              <th className="px-2 py-2 font-medium">State tax</th>
              <th className="px-2 py-2 font-medium">Tax</th>
              <th className="px-2 py-2 font-medium">DAP</th>
              <th className="px-2 py-2 font-medium">Fair hose</th>
              <th className="px-2 py-2 font-medium">Should-be</th>
              <th className="px-2 py-2 font-medium">Invoice</th>
              <th className="px-2 py-2 font-medium">Fat take</th>
              <th className="px-2 py-2 font-medium">Ex-tax</th>
              <th className="px-2 py-2 font-medium">Remaining</th>
              <th className="px-2 py-2 font-medium">Implied Δ</th>
              <th className="px-2 py-2 font-medium">Edge</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap(({ terminal, ref, rb, ho }) =>
              [rb, ho].map((book) => (
                <tr key={`${terminal.id}-${book.product}`} className="border-t border-black/10">
                  <td className="px-2 py-2">
                    <div className="font-medium">
                      {terminal.city}
                      {ref.inArea ? "" : " · nearest"}
                    </div>
                    <div className="text-black/40">{terminal.operator}</div>
                  </td>
                  <td className="px-2 py-2 font-mono">{tcnLabel(terminal)}</td>
                  <td className="px-2 py-2">{book.product}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.steps.find((s) => s.key === "nymex")?.cents ?? null)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.typedDiff)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.terminalSpot)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.steps.find((s) => s.key === "freight")?.cents ?? null)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.inboundRack)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.steps.find((s) => s.key === "posted")?.cents ?? null)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.rackMargin)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.steps.find((s) => s.key === "jobber")?.cents ?? null)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.jobberMargin)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.steps.find((s) => s.key === "dock")?.cents ?? null)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.taxMode === "oneline" ? null : book.taxFederal)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.taxMode === "oneline" ? null : book.taxState)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.tax)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.dap)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.fairHose)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.shouldBe)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.invoiceDelivered)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.fatTake)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.dockExTax)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.dockRemaining)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.impliedDiff)}</td>
                  <td className="px-2 py-2 font-mono">{formatBoth(book.edgeVsTyped)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4 print:hidden">
        <PrintButton />
        <a href={deskHref} className="text-sm text-black/55 underline-offset-2 hover:underline">
          Back to desk
        </a>
      </div>
    </main>
  );
}
