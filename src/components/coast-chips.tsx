import { boardHref, type BoardQuery } from "@/lib/board-query";
import { CORRIDOR_ORDER, CORRIDORS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CoastChips({ query }: { query: BoardQuery }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <a
        href={boardHref({ ...query, corridor: null, dock: null })}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
          query.corridor == null
            ? "bg-[color:var(--cream)] text-white"
            : "bg-white text-[color:var(--cream)] ring-1 ring-[color:var(--line)]",
        )}
      >
        All water
      </a>
      {CORRIDOR_ORDER.map((id) => (
        <a
          key={id}
          href={boardHref({ ...query, corridor: id, dock: null })}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
            query.corridor === id
              ? "bg-[color:var(--cream)] text-white"
              : "bg-white text-[color:var(--cream)] ring-1 ring-[color:var(--line)]",
          )}
        >
          {CORRIDORS[id].short}
        </a>
      ))}
    </div>
  );
}
