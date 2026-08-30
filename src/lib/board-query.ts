import { freshness } from "@/lib/freshness";
import { CORRIDOR_ORDER, type CorridorId, type Dock } from "@/lib/types";

export type BoardQuery = {
  corridor: CorridorId | null;
  e0Only: boolean;
  freshOnly: boolean;
  dock: string | null;
  reported: string | null;
};

function asCorridor(value?: string): CorridorId | null {
  if (!value) return null;
  return CORRIDOR_ORDER.includes(value as CorridorId) ? (value as CorridorId) : null;
}

export function parseBoardQuery(params: {
  corridor?: string;
  e0?: string;
  fresh?: string;
  dock?: string;
  reported?: string;
}): BoardQuery {
  return {
    corridor: asCorridor(params.corridor),
    e0Only: params.e0 === "1",
    freshOnly: params.fresh === "1",
    dock: params.dock ?? null,
    reported: params.reported ?? null,
  };
}

export function boardHref(query: BoardQuery): "/" | `/?${string}` {
  const params = new URLSearchParams();
  if (query.corridor) params.set("corridor", query.corridor);
  if (query.e0Only) params.set("e0", "1");
  if (query.freshOnly) params.set("fresh", "1");
  if (query.dock) params.set("dock", query.dock);
  if (query.reported) params.set("reported", query.reported);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function filterDocks(docks: Dock[], query: BoardQuery): { inCorridor: Dock[]; visible: Dock[] } {
  const inCorridor = query.corridor
    ? docks.filter((dock) => dock.corridor === query.corridor)
    : docks;
  const visible = inCorridor
    .filter((dock) => (query.e0Only ? dock.ethanol === "E0" : true))
    .filter((dock) => (query.freshOnly ? freshness(dock) === "fresh" : true));
  return { inCorridor, visible };
}
