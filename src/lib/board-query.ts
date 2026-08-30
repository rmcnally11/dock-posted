import { freshness } from "@/lib/freshness";
import {
  CORRIDORS,
  REGIONS,
  STATE_CODES,
  STATE_VIEWS,
  type CorridorId,
  type Dock,
  type RegionId,
  type StateCode,
} from "@/lib/types";

export type BoardQuery = {
  corridor: CorridorId | null;
  state: StateCode | null;
  region: RegionId | null;
  q: string;
  e0Only: boolean;
  freshOnly: boolean;
  dock: string | null;
  reported: string | null;
};

const CORRIDOR_IDS = new Set<string>(Object.keys(CORRIDORS));
const REGION_IDS = new Set<string>(Object.keys(REGIONS));
const STATE_SET = new Set<string>(STATE_CODES);

function asCorridor(value: string | undefined): CorridorId | null {
  if (!value) return null;
  return CORRIDOR_IDS.has(value) ? (value as CorridorId) : null;
}

function asRegion(value: string | undefined): RegionId | null {
  if (!value) return null;
  return REGION_IDS.has(value) ? (value as RegionId) : null;
}

function asState(value: string | undefined): StateCode | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return STATE_SET.has(upper) ? (upper as StateCode) : null;
}

export function parseBoardQuery(params: {
  corridor?: string;
  state?: string;
  region?: string;
  q?: string;
  e0?: string;
  fresh?: string;
  dock?: string;
  reported?: string;
}): BoardQuery {
  const state = asState(params.state);
  const region = asRegion(params.region);
  const corridor = asCorridor(params.corridor);
  const q = (params.q ?? "").trim();

  return {
    corridor,
    state,
    region,
    q,
    e0Only: params.e0 === "1",
    freshOnly: params.fresh === "1",
    dock: params.dock ?? null,
    reported: params.reported ?? null,
  };
}

export type BoardHref = "/#board" | `/?${string}#board`;

export type DockHref = `/docks/${string}`;

export function dockPath(id: string): DockHref {
  return `/docks/${id}`;
}

export function boardHref(query: BoardQuery): BoardHref {
  const params = new URLSearchParams();
  if (query.corridor) params.set("corridor", query.corridor);
  if (query.state) params.set("state", query.state);
  if (query.region) params.set("region", query.region);
  if (query.q) params.set("q", query.q);
  if (query.e0Only) params.set("e0", "1");
  if (query.freshOnly) params.set("fresh", "1");
  if (query.dock) params.set("dock", query.dock);
  if (query.reported) params.set("reported", query.reported);
  const qs = params.toString();
  return qs ? `/?${qs}#board` : "/#board";
}

export function matchesSearch(dock: Dock, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return true;
  const hay = `${dock.name} ${dock.city} ${dock.state}`.toLowerCase();
  return hay.includes(needle);
}

export function geographicSet(docks: Dock[], query: BoardQuery): Dock[] {
  if (query.q.length >= 2) {
    return docks.filter((dock) => matchesSearch(dock, query.q));
  }
  if (query.state) {
    return docks.filter((dock) => dock.state === query.state);
  }
  if (query.region) {
    return docks.filter((dock) => dock.region === query.region);
  }
  if (query.corridor) {
    return docks.filter((dock) => dock.corridor === query.corridor);
  }
  return docks;
}

function leadRank(dock: Dock): number {
  return dock.lead ?? Number.POSITIVE_INFINITY;
}

export function sortDocks(docks: Dock[]): Dock[] {
  return [...docks].sort((left, right) => {
    const byLead = leadRank(left) - leadRank(right);
    if (byLead !== 0) return byLead;
    return left.name.localeCompare(right.name);
  });
}

export function filterDocks(
  docks: Dock[],
  query: BoardQuery,
): { inCorridor: Dock[]; visible: Dock[] } {
  const inCorridor = sortDocks(geographicSet(docks, query));
  const visible = sortDocks(
    inCorridor
      .filter((dock) => (query.e0Only ? dock.ethanol === "E0" : true))
      .filter((dock) => (query.freshOnly ? freshness(dock) === "fresh" : true)),
  );
  return { inCorridor, visible };
}

export function viewLabel(query: BoardQuery): string {
  if (query.q.length >= 2) return `Search · ${query.q}`;
  if (query.state) return STATE_VIEWS[query.state].label;
  if (query.region) return REGIONS[query.region].label;
  if (query.corridor) return CORRIDORS[query.corridor].label;
  return "Sabine to Maine";
}

export function isHomeView(query: BoardQuery): boolean {
  return query.q.length < 2 && !query.state && !query.region && !query.corridor;
}
