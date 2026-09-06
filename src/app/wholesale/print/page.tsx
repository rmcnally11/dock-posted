import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDocks, readWholesaleStore } from "@/lib/store";
import {
  boardDockDefault,
  computeWorksheet,
  emptyWorksheet,
  findArea,
  findTerminal,
  marinaPitchReady,
  parseAreaId,
  parsePrintView,
  parseProductId,
  pickMarinaPitchProduct,
  terminalsForArea,
  worksheetHasInputs,
  type ProductNetback,
  type WholesaleProduct,
} from "@/lib/wholesale";
import { WHOLESALE_DRAFT_COOKIE, parseWholesaleDraft } from "@/lib/wholesale-draft";
import { fetchYahooNymexScreens, nymexFallbackMap } from "@/lib/wholesale-nymex";
import { isWholesaleAuthed } from "../gate";
import { FullBook } from "./full-book";
import { TearSheet, TearSheetEmpty } from "./tear-sheet";

export const dynamic = "force-dynamic";

export default async function WholesalePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; terminal?: string; product?: string; view?: string }>;
}) {
  if (!(await isWholesaleAuthed())) redirect("/wholesale");

  const params = await searchParams;
  const areaId = parseAreaId(params.area);
  const area = findArea(areaId);
  const store = await readWholesaleStore();
  const docks = await readDocks();
  const screens = await fetchYahooNymexScreens();
  const fallback = nymexFallbackMap(screens);
  const draft = parseWholesaleDraft((await cookies()).get(WHOLESALE_DRAFT_COOKIE)?.value);
  const attached = terminalsForArea(areaId);
  const rows = attached.map(({ terminal, ref }) => {
    const stored = store.worksheets[terminal.id] ?? emptyWorksheet();
    const computed = draft && draft.terminalId === terminal.id ? draft.sheet : stored;
    const rowDraft = Boolean(draft && draft.terminalId === terminal.id);
    const hasBook = rowDraft || worksheetHasInputs(computed);
    const books = computeWorksheet(computed, {
      state: terminal.state,
      areaId,
      docks: hasBook ? docks : undefined,
      saved: computed,
      nymexFallback: hasBook ? fallback : undefined,
      applyTaxDefaults: hasBook,
    });
    return { terminal, ref, rb: books.RB, ho: books.HO };
  });

  const view = parsePrintView(params.view);
  const deskHref = params.terminal
    ? `/wholesale?area=${areaId}&terminal=${encodeURIComponent(params.terminal)}`
    : `/wholesale?area=${areaId}`;

  if (view === "book") {
    return <FullBook area={area} rows={rows} deskHref={deskHref} />;
  }

  const selected =
    (params.terminal && rows.find((row) => row.terminal.id === params.terminal)) ||
    rows.find((row) => marinaPitchReady(row.rb) || marinaPitchReady(row.ho)) ||
    null;

  if (!selected) {
    return <TearSheetEmpty areaId={areaId} terminalId={params.terminal ?? attached[0]?.terminal.id} />;
  }

  const books: Record<WholesaleProduct, ProductNetback> = { RB: selected.rb, HO: selected.ho };
  const preferred = parseProductId(params.product);
  const product = pickMarinaPitchProduct(books, preferred);
  const book = books[product];

  if (!marinaPitchReady(book)) {
    return <TearSheetEmpty areaId={areaId} terminalId={selected.terminal.id} />;
  }

  const board = boardDockDefault(docks, areaId, product);
  const marinaName = board?.dockName ?? `${selected.terminal.city} dock`;
  const other = product === "RB" ? "HO" : "RB";
  const otherReady = marinaPitchReady(books[other]) ? other : null;
  const terminal = findTerminal(selected.terminal.id) ?? selected.terminal;

  return (
    <TearSheet
      area={area}
      terminal={terminal}
      product={product}
      book={book}
      marinaName={marinaName}
      asOf={board?.asOf ?? null}
      otherReady={otherReady}
    />
  );
}
