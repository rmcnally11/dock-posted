import {
  callOrText,
  leftoverLabel,
  maxLengthLabel,
  remainingLabel,
  YARD_AREA_LABEL,
  type HaulYard,
} from "@/lib/haul-out";

export function YardBoard({ yards }: { yards: HaulYard[] }) {
  return (
    <div className="overflow-x-auto" data-testid="yard-board">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-harbor/10 text-[11px] uppercase tracking-[0.14em] text-harbor/50">
            <th className="py-2 pr-3 font-medium">Yard</th>
            <th className="py-2 pr-3 font-medium">Area</th>
            <th className="py-2 pr-3 font-medium">Indoor</th>
            <th className="py-2 pr-3 font-medium">Lot</th>
            <th className="py-2 pr-3 font-medium">Max length</th>
            <th className="py-2 pr-3 font-medium">Phone</th>
            <th className="py-2 font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {yards.map((yard) => (
            <tr key={yard.id} className="border-b border-harbor/8" data-testid={`yard-row-${yard.id}`}>
              <td className="py-2.5 pr-3 font-medium text-harbor">{yard.name}</td>
              <td className="py-2.5 pr-3 text-harbor/70">
                {yard.city ? YARD_AREA_LABEL[yard.area] : "Call"}
              </td>
              <td className="py-2.5 pr-3" data-testid={`yard-indoor-${yard.id}`}>
                {leftoverLabel(yard.indoorLeftover)}
              </td>
              <td className="py-2.5 pr-3">{leftoverLabel(yard.lotLeftover)}</td>
              <td className="py-2.5 pr-3">{maxLengthLabel(yard)}</td>
              <td className="py-2.5 pr-3">{callOrText(yard.phone)}</td>
              <td className="py-2.5" data-testid={`yard-remaining-${yard.id}`}>
                {remainingLabel(yard)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
