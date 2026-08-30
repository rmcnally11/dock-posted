import { cookies } from "next/headers";
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
  worksheetHasInputs,
} from "@/lib/wholesale";
import { WHOLESALE_DRAFT_COOKIE, parseWholesaleDraft } from "@/lib/wholesale-draft";
import { fetchYahooNymexScreens, nymexFallbackMap } from "@/lib/wholesale-nymex";
import { isWholesaleAuthed } from "./gate";
import { AreaChips, DeskLogout, LoginPanel, NymexBanner, TerminalTable, Waterfall, Worksheet } from "./desk";

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
  const screens = await fetchYahooNymexScreens();
  const fallback = nymexFallbackMap(screens);

  const jar = await cookies();
  const draft = parseWholesaleDraft(jar.get(WHOLESALE_DRAFT_COOKIE)?.value);
  const saved = selectedId ? (store.worksheets[selectedId] ?? emptyWorksheet()) : emptyWorksheet();
  const usingDraft = Boolean(draft && selectedId && draft.terminalId === selectedId);
  const sheet = usingDraft && draft ? draft.sheet : saved;
  const context = {
    state: selected?.state,
    areaId,
    docks,
    saved: usingDraft ? sheet : saved,
    nymexFallback: fallback,
    applyTaxDefaults: !usingDraft,
  };
  const live = computeWorksheet(sheet, context);
  const prepared = applyWorksheetDefaults(sheet, context);

  const tableRows = attached.map(({ terminal, ref }) => {
    const stored = store.worksheets[terminal.id] ?? emptyWorksheet();
    const rowDraft = Boolean(draft && draft.terminalId === terminal.id);
    const computed = rowDraft && draft ? draft.sheet : stored;
    const hasBook = rowDraft || worksheetHasInputs(computed);
    const books = computeWorksheet(computed, {
      state: terminal.state,
      areaId,
      docks: hasBook ? docks : undefined,
      saved: computed,
      nymexFallback: hasBook ? fallback : undefined,
      applyTaxDefaults: hasBook && !rowDraft,
    });
    return { terminal, ref, rb: books.RB, ho: books.HO };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Not a public board</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight">Wholesale</h1>
          <p className="mt-2 text-sm text-black/55">
            Terminal to retail. The fattest take is the one hacking the gallon.
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

      <NymexBanner screens={screens} />

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
            screens={screens}
            draft={usingDraft}
            error={params.error}
            saved={params.saved === "1"}
          />
        </>
      ) : null}

      <TerminalTable area={area} rows={tableRows} selectedId={selectedId} unit={unit} />

      <p className="mt-8 text-xs text-black/45" data-testid="desk-feed-footer">
        Yahoo Finance public screen (RB=F / HO=F) when the pull succeeds, with as-of on the quote.
        Platts is not used. Typed NYMEX cells are the desk&apos;s number, not a live market tile.
      </p>
    </main>
  );
}
