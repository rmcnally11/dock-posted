import { hasPostedPrice } from "./freshness";
import {
  DESK_BATCH,
  deskScore,
  dockWaterLabel,
  type DeskCall,
  type PinClaim,
  weekOfIso,
} from "./income";
import type { Dock } from "./types";

export function isDeskCandidate(dock: Dock, pins: PinClaim[]): boolean {
  if (dock.access !== "public") return false;
  if (!dock.phone) return false;
  if (dock.closed) return false;
  if (hasPostedPrice(dock)) return false;
  const pin = pins.find((row) => row.dockId === dock.id);
  if (pin && (pin.status === "paid" || pin.status === "dead")) return false;
  return true;
}

export function recentlyCalled(calls: DeskCall[], dockId: string, weekOf: string): boolean {
  return calls.some((call) => call.dockId === dockId && call.weekOf === weekOf);
}

export function pickDeskDocks(
  docks: Dock[],
  pins: PinClaim[],
  calls: DeskCall[],
  now = new Date(),
  limit = DESK_BATCH,
): Dock[] {
  const weekOf = weekOfIso(now);
  return docks
    .filter((dock) => isDeskCandidate(dock, pins))
    .filter((dock) => !recentlyCalled(calls, dock.id, weekOf))
    .sort((left, right) => {
      const byScore = deskScore(right) - deskScore(left);
      if (byScore !== 0) return byScore;
      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

export function deskCallFromDock(dock: Dock, now = new Date()): Omit<DeskCall, "id" | "createdAt"> {
  return {
    dockId: dock.id,
    dockName: dock.name,
    phone: dock.phone,
    water: dockWaterLabel(dock),
    weekOf: weekOfIso(now),
    status: "queued",
    note: null,
  };
}
