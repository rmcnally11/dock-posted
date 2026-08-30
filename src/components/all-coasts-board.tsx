import { Waterline } from "@/components/waterline";
import { boardHref } from "@/lib/board-query";
import { freshness } from "@/lib/freshness";
import { formatQuote } from "@/lib/format";
import { displayDiesel, displayGas } from "@/lib/freshness";
import { CORRIDOR_ORDER, CORRIDORS, type Dock } from "@/lib/types";

export function AllCoastsBoard({ docks }: { docks: Dock[] }) {
  const live = docks.filter((dock) => freshness(dock) === "fresh").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]">
          All water · {live} posted this week · {docks.length} docks Sabine to Key West
        </p>
        <h1 className="mt-1 font-heading text-4xl text-[color:var(--cream)] md:text-5xl">
          What the dock last posted
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--cream)]/65">
          Texas down the Gulf to Florida. No gaps. We never invent a price. Same
          instrument family as{" "}
          <a className="text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40" href="https://onthiswater.com">
            On This Water
          </a>
          .
        </p>
        <Waterline className="mt-3" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CORRIDOR_ORDER.map((id) => {
          const stretch = docks.filter((dock) => dock.corridor === id);
          const posted = stretch.filter((dock) => freshness(dock) === "fresh");
          const sample = posted[0] ?? stretch[0];
          const meta = CORRIDORS[id];
          return (
            <a
              key={id}
              href={boardHref({
                corridor: id,
                e0Only: false,
                freshOnly: false,
                dock: null,
                reported: null,
              })}
              className="flex flex-col rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]">
                {meta.state}
              </p>
              <h2 className="mt-1 font-heading text-2xl text-[color:var(--cream)]">{meta.label}</h2>
              <p className="text-xs text-[color:var(--cream)]/45">
                {stretch.length} dock{stretch.length === 1 ? "" : "s"}
                {posted.length ? ` · ${posted.length} posted this week` : " · Call ahead"}
              </p>
              {sample ? (
                <p className="mt-4 font-heading text-lg leading-snug text-[color:var(--cream)]">
                  {sample.name}
                </p>
              ) : (
                <p className="mt-4 text-sm text-[color:var(--cream)]/55">No docks loaded.</p>
              )}
              {sample ? (
                <p className="mt-2 text-sm text-[color:var(--cream)]/65">
                  {formatQuote(displayGas(sample))} · diesel {formatQuote(displayDiesel(sample))}
                </p>
              ) : null}
              <span className="mt-5 text-sm text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40">
                Open {meta.short}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
