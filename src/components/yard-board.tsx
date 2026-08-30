import { telHref } from "@/lib/format";
import {
  callOrText,
  leftoverLabel,
  maxLengthLabel,
  remainingLabel,
  YARD_AREA_LABEL,
  type HaulYard,
} from "@/lib/haul-out";

function YardPhone({ phone }: { phone: string | null }) {
  const text = callOrText(phone);
  const href = phone ? telHref(phone) : null;
  if (!href) return text;
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center text-[color:var(--sea)] underline-offset-2 hover:underline"
    >
      {text}
    </a>
  );
}

export function YardBoard({ yards }: { yards: HaulYard[] }) {
  return (
    <div className="min-w-0" data-testid="yard-board">
      <ul className="space-y-3 md:hidden">
        {yards.map((yard) => (
          <li
            key={yard.id}
            className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--ink)] px-3 py-3"
            data-testid={`yard-row-${yard.id}`}
          >
            <p className="font-medium text-[color:var(--cream)]">{yard.name}</p>
            <p className="mt-0.5 text-sm text-[color:var(--cream)]/70">
              {yard.city ? YARD_AREA_LABEL[yard.area] : "Call"}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--cream)]/50">
                  Indoor
                </dt>
                <dd data-testid={`yard-indoor-${yard.id}`}>{leftoverLabel(yard.indoorLeftover)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--cream)]/50">
                  Lot
                </dt>
                <dd>{leftoverLabel(yard.lotLeftover)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--cream)]/50">
                  Max length
                </dt>
                <dd>{maxLengthLabel(yard)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--cream)]/50">
                  Remaining
                </dt>
                <dd data-testid={`yard-remaining-${yard.id}`}>{remainingLabel(yard)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-sm">
              <YardPhone phone={yard.phone} />
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--line)] text-[11px] uppercase tracking-[0.14em] text-[color:var(--cream)]/50">
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
              <tr
                key={yard.id}
                className="border-b border-[color:var(--line)]"
                data-testid={`yard-row-table-${yard.id}`}
              >
                <td className="py-2.5 pr-3 font-medium text-[color:var(--cream)]">{yard.name}</td>
                <td className="py-2.5 pr-3 text-[color:var(--cream)]/70">
                  {yard.city ? YARD_AREA_LABEL[yard.area] : "Call"}
                </td>
                <td className="py-2.5 pr-3">{leftoverLabel(yard.indoorLeftover)}</td>
                <td className="py-2.5 pr-3">{leftoverLabel(yard.lotLeftover)}</td>
                <td className="py-2.5 pr-3">{maxLengthLabel(yard)}</td>
                <td className="py-2.5 pr-3">
                  <YardPhone phone={yard.phone} />
                </td>
                <td className="py-2.5">{remainingLabel(yard)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
