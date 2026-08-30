import { freshness } from "@/lib/freshness";
import { type CorridorId, type Dock } from "@/lib/types";

export type BoardQuery = {
  corridor: CorridorId;
  e0Only: boolean;
  freshOnly: boolean;
  dock: string | null;
  reported: string | null;
};

export function parseBoardQuery(params: {
  corridor?: string;
  e0?: string;
  fresh?: string;
  dock?: string;
  reported?: string;
}): BoardQuery {
  return {
    corridor: params.corridor === "upper-keys" ? "upper-keys" : "galveston-bay",
    e0Only: params.e0 === "1",
    freshOnly: params.fresh === "1",
    dock: params.dock ?? null,
    reported: params.reported ?? null,
  };
}

export function boardHref(query: BoardQuery): "/" | `/?${string}` {
  const params = new URLSearchParams();
  if (query.corridor === "upper-keys") params.set("corridor", "upper-keys");
  if (query.e0Only) params.set("e0", "1");
  if (query.freshOnly) params.set("fresh", "1");
  if (query.dock) params.set("dock", query.dock);
  if (query.reported) params.set("reported", query.reported);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function filterDocks(docks: Dock[], query: BoardQuery): { inCorridor: Dock[]; visible: Dock[] } {
  const inCorridor = docks.filter((dock) => dock.corridor === query.corridor);
  const visible = inCorridor
    .filter((dock) => (query.e0Only ? dock.ethanol === "E0" : true))
    .filter((dock) => (query.freshOnly ? freshness(dock) === "fresh" : true));
  return { inCorridor, visible };
}
