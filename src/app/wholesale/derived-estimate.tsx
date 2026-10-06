import {
  derivedLegBlankText,
  formatDerivedCents,
  type DerivedLandedCostBook,
  type DerivedLeg,
  type DerivedProductEstimate,
} from "@/lib/wholesale";

const LEG_KEYS = [
  "spot",
  "marinePipelineFreight",
  "terminalThroughput",
  "truckFreight",
  "federalTax",
  "stateTax",
  "localTax",
] as const;

export function DerivedEstimate({ book }: { book: DerivedLandedCostBook }) {
  return (
    <section className="mt-10" data-testid="derived-landed-cost">
      <h2 className="text-sm font-medium">Derived landed cost to the marina</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-black/70" data-testid="derived-estimate-label">
        DERIVED ESTIMATE. Not an invoice, not a rack, and not a buy signal. It does not change fat take,
        should-be, Fair hose, or the NO CALL rule on the worksheet.
      </p>
      <p className="mt-2 text-sm text-black/70" data-testid="platts-date-key">
        Platts Daily {book.dateKey}
        {book.stale ? (
          <span className="ml-2 border border-[#8a2c12] px-1.5 py-0.5 text-xs font-medium text-[#8a2c12]" data-testid="platts-stale">
            STALE
          </span>
        ) : null}
        <span className="text-black/50"> · {book.rowSource === "airtable" ? "Airtable" : "seed"}</span>
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-5 text-black/50">{book.rowNote}</p>

      <div className="mt-4 space-y-8">
        {book.docks.map((dock) => (
          <article key={dock.dockId} data-testid={`derived-dock-${dock.dockId}`}>
            <h3 className="text-sm font-medium">{dock.dockName}</h3>
            <div className="mt-1 max-w-3xl text-xs leading-5 text-black/60" data-testid={`derived-gaps-${dock.dockId}`}>
              <p className="font-medium text-black/70">Gaps</p>
              {dock.gaps.length === 0 ? (
                <p>None.</p>
              ) : (
                <ul className="mt-1 list-disc pl-4">
                  {dock.gaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-3 overflow-x-auto border border-black/15 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-black/10 bg-black/[0.03] text-[11px] uppercase tracking-[0.08em] text-black/45">
                  <tr>
                    <th className="px-3 py-2 font-medium">Product</th>
                    <th className="px-3 py-2 font-medium">Spot</th>
                    <th className="px-3 py-2 font-medium">Marine / pipeline</th>
                    <th className="px-3 py-2 font-medium">Throughput</th>
                    <th className="px-3 py-2 font-medium">Truck</th>
                    <th className="px-3 py-2 font-medium">Federal</th>
                    <th className="px-3 py-2 font-medium">State</th>
                    <th className="px-3 py-2 font-medium">Local</th>
                    <th className="px-3 py-2 font-medium">Derived DAP</th>
                    <th className="px-3 py-2 font-medium">Posted pump</th>
                    <th className="px-3 py-2 font-medium">Implied margin</th>
                    <th className="px-3 py-2 font-medium">Invoice</th>
                    <th className="px-3 py-2 font-medium">Posted rack</th>
                    <th className="px-3 py-2 font-medium">Fat take</th>
                  </tr>
                </thead>
                <tbody>
                  {dock.products.map((product) => (
                    <ProductRow key={product.product} product={product} />
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductRow({ product }: { product: DerivedProductEstimate }) {
  const invoice = legBy(product, "invoice");
  const rack = legBy(product, "rack");
  return (
    <>
      <tr className="border-t border-black/10 align-top" data-testid={`derived-product-${product.dockId}-${product.product}`}>
        <td className="px-3 py-2">
          <div className="font-medium">{product.productLabel}</div>
          {product.approximate ? <div className="text-[#8a2c12]">Approximate match</div> : null}
          <p className="mt-1 max-w-[16rem] text-[11px] leading-4 text-black/45">{product.matchNote}</p>
        </td>
        {LEG_KEYS.map((key) => (
          <td key={key} className="px-3 py-2">
            <LegCell leg={legBy(product, key)} />
          </td>
        ))}
        <td className="px-3 py-2 font-mono" data-testid={`derived-dap-${product.dockId}-${product.product}`}>
          {product.dapComplete ? formatDerivedCents(product.dapCents) : "Incomplete"}
        </td>
        <td className="px-3 py-2 font-mono">
          {formatDerivedCents(product.postedPumpCents)}
          <p className="mt-1 max-w-[14rem] font-sans text-[11px] leading-4 text-black/45">{product.postedPumpNote}</p>
        </td>
        <td className="px-3 py-2 font-mono" data-testid={`derived-margin-${product.dockId}-${product.product}`}>
          {product.dapComplete ? formatDerivedCents(product.impliedMarginCents) : "—"}
        </td>
        <td className="px-3 py-2">
          <LegCell leg={invoice} />
        </td>
        <td className="px-3 py-2">
          <LegCell leg={rack} />
        </td>
        <td className="px-3 py-2 font-mono" data-testid={`derived-fat-take-${product.dockId}-${product.product}`}>
          {product.fatTakeStatus === "NO CALL" ? "NO CALL" : formatDerivedCents(product.fatTakeCents)}
        </td>
      </tr>
      {product.dieselFlag ? (
        <tr className="border-t border-black/10 bg-black/[0.02]">
          <td colSpan={14} className="px-3 py-2 text-[11px] leading-5 text-black/70">
            <p className="font-medium">{product.dieselFlag.headline}</p>
            <p className="mt-1">{product.dieselFlag.notApplied}</p>
            <ul className="mt-1 list-disc pl-4">
              {product.dieselFlag.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} className="underline-offset-2 hover:underline">
                    {source.title}
                  </a>
                  <span className="text-black/45"> · as of {source.asOf}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function LegCell({ leg }: { leg: DerivedLeg }) {
  const blank = derivedLegBlankText(leg);
  return (
    <div data-testid={`derived-leg-${leg.key}`}>
      {blank ? (
        <p className="font-medium text-black/70">{blank}</p>
      ) : leg.disposition === "embedded" ? (
        <p className="font-medium">Included in Tampa DDP basis</p>
      ) : leg.disposition === "not_on_path" ? (
        <p className="font-medium">Marine / pipeline freight — not on path</p>
      ) : (
        <p className="font-mono">{formatDerivedCents(leg.cents)}</p>
      )}
      {leg.note ? <p className="mt-1 max-w-[16rem] text-[11px] leading-4 text-black/45">{leg.note}</p> : null}
      {leg.sourceUrl ? (
        <p className="mt-1 max-w-[16rem] text-[11px] leading-4">
          <a href={leg.sourceUrl} className="underline-offset-2 hover:underline">
            {leg.sourceTitle ?? leg.sourceUrl}
          </a>
          {leg.asOf ? <span className="text-black/45"> · as of {leg.asOf}</span> : null}
        </p>
      ) : leg.asOf ? (
        <p className="mt-1 text-[11px] text-black/45">as of {leg.asOf}</p>
      ) : null}
    </div>
  );
}

function legBy(product: DerivedProductEstimate, key: DerivedLeg["key"]): DerivedLeg {
  const leg = product.legs.find((item) => item.key === key);
  if (!leg) {
    return {
      key,
      label: key,
      cents: null,
      blank: "not sourced",
      disposition: "add",
      sourceUrl: null,
      asOf: null,
      sourceTitle: null,
      note: "",
    };
  }
  return leg;
}
