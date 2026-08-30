import { readDocks, readWholesaleStore } from "@/lib/store";
import {
  applyWorksheetDefaults,
  computeWorksheet,
  emptyWorksheet,
  findArea,
  findTerminal,
  parseAreaId,
  parseUnit,
  terminalsForArea,
  worksheetFromFields,
} from "@/lib/wholesale";
import { isWholesaleAuthed } from "./gate";
import { AreaChips, DeskLogout, LoginPanel, TerminalTable, Waterfall, Worksheet } from "./desk";

export const dynamic = "force-dynamic";

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const authed = await isWholesaleAuthed();
  const params = await searchParams;
  if (!authed) {
    return <LoginPanel error={params.error} />;
  }

  const areaId = parseAreaId(params.area);
  const unit = parseUnit(params.unit);
  const area = findArea(areaId);
  const store = await readWholesaleStore();
  const docks = await readDocks();
  const attached = terminalsForArea(areaId);
  const selectedId =
    params.terminal && attached.some((row) => row.terminal.id === params.terminal)
      ? params.terminal
      : (attached[0]?.terminal.id ?? null);
  const selected = selectedId ? findTerminal(selectedId) : null;

  const saved = selectedId ? (store.worksheets[selectedId] ?? emptyWorksheet()) : emptyWorksheet();
  const sheet = hasTypedFields(params) ? worksheetFromFields(params, unit) : saved;
  const context = {
    state: selected?.state,
    areaId,
    docks,
    saved,
  };
  const live = computeWorksheet(sheet, context);
  const prepared = applyWorksheetDefaults(sheet, context);

  const tableRows = attached.map(({ terminal, ref }) => {
    const stored = store.worksheets[terminal.id] ?? emptyWorksheet();
    const books = computeWorksheet(stored, { state: terminal.state, areaId, docks, saved: stored });
    return { terminal, ref, rb: books.RB, ho: books.HO };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">The take</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight">Terminal to the hose</h1>
          <p className="mt-2 text-sm text-black/55">
            From the rack to the dock. Taxes stay on the page. The fat cut lights up.
          </p>
        </div>
        <DeskLogout />
      </div>

      <div className="mt-6">
        <AreaChips areaId={areaId} />
      </div>
      <p className="mt-3 text-sm text-black/60" data-testid="area-heading">
        {area.label}
        {selected ? ` · ${selected.city} · ${selected.state}` : ""}
      </p>

      {selected && selectedId ? (
        <>
          <Waterfall rb={live.RB} ho={live.HO} />
          <Worksheet
            areaId={areaId}
            terminal={selected}
            sheet={sheet}
            prepared={prepared}
            unit={unit}
            diffs={store.differentials.filter((row) => row.terminalId === selectedId)}
            error={params.error}
            saved={params.saved === "1"}
          />
        </>
      ) : null}

      <TerminalTable area={area} rows={tableRows} selectedId={selectedId} unit={unit} />
    </main>
  );
}

function hasTypedFields(params: Record<string, string | undefined>): boolean {
  return [
    "nymex_rb",
    "nymex_ho",
    "diff_rb",
    "diff_ho",
    "freight_rb",
    "freight_ho",
    "rack_rb",
    "rack_ho",
    "jobber_rb",
    "jobber_ho",
    "dock_rb",
    "dock_ho",
    "tax_federal",
    "tax_state",
    "tax_federal_rb",
    "tax_federal_ho",
    "tax_state_rb",
    "tax_state_ho",
    "tax_other",
    "tax_one",
  ].some((key) => (params[key] ?? "").trim() !== "");
}
