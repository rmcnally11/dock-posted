import { redirect } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { readDocks, readWholesaleStore } from "@/lib/store";
import {
  computeWorksheet,
  emptyWorksheet,
  findArea,
  formatBoth,
  parseAreaId,
  tcnLabel,
  terminalsForArea,
} from "@/lib/wholesale";
import { DeskLogout } from "../desk";
import { isWholesaleAuthed } from "../gate";

export const dynamic = "force-dynamic";

export default async function WholesalePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  if (!(await isWholesaleAuthed())) redirect("/wholesale");

  const params = await searchParams;
  const areaId = parseAreaId(params.area);
  const area = findArea(areaId);
  const store = await readWholesaleStore();
  const docks = await readDocks();
  const rows = terminalsForArea(areaId).map(({ terminal, ref }) => {
    const stored = store.worksheets[terminal.id] ?? emptyWorksheet();
    const books = computeWorksheet(stored, { state: terminal.state, areaId, docks, saved: stored });
    return { terminal, ref, rb: books.RB, ho: books.HO };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 print:px-0 print:py-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Wholesale · {area.label}</h1>
          <p className="mt-2 text-xs text-black/45">{area.note}</p>
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
              <th className="px-2 py-2 font-medium">Dock posted</th>
              <th className="px-2 py-2 font-medium">Federal tax</th>
              <th className="px-2 py-2 font-medium">State tax</th>
              <th className="px-2 py-2 font-medium">Tax</th>
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

      <p className="mt-4 text-xs text-black/45">Every figure is typed or derived from typed. No live NYMEX or Platts feed.</p>

      <div className="mt-6 flex gap-4 print:hidden">
        <PrintButton />
        <a href={`/wholesale?area=${areaId}`} className="text-sm text-black/55 underline-offset-2 hover:underline">
          Back to desk
        </a>
      </div>
    </main>
  );
}
