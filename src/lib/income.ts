import { CORRIDORS, REGIONS, type CorridorId, type Dock, type RegionId } from "./types";

export const PIN_SEASON_DOLLARS = 299;
export const WATCH_YEAR_DOLLARS = 29;
export const PIN_PRICE_LABEL = "$299 a season";
export const WATCH_PRICE_LABEL = "$29 a year";
export const DESK_BATCH = 8;
export const DESK_NOTIFY_DEFAULT = "rmcnally11@gmail.com";

export type PinStatus = "filed" | "billed" | "paid" | "dead";
export type WatchStatus = "filed" | "paid" | "stopped";
export type CallStatus = "queued" | "called" | "left-message" | "filed" | "skip";

export interface PinClaim {
  id: string;
  dockId: string;
  dockName: string;
  contactName: string;
  email: string;
  phone: string;
  role: string;
  status: PinStatus;
  createdAt: string;
  paidAt: string | null;
  lastContactedAt: string | null;
  note: string | null;
  airtableId?: string;
}

export interface WaterWatch {
  id: string;
  email: string;
  name: string;
  corridor: CorridorId | null;
  region: RegionId | null;
  gallons: number | null;
  status: WatchStatus;
  createdAt: string;
  paidAt: string | null;
  note: string | null;
  airtableId?: string;
}

export interface DeskCall {
  id: string;
  dockId: string;
  dockName: string;
  phone: string | null;
  water: string;
  weekOf: string;
  status: CallStatus;
  createdAt: string;
  note: string | null;
  airtableId?: string;
}

export interface IncomeStoreFile {
  generatedAt: string;
  pins: PinClaim[];
  watches: WaterWatch[];
  calls: DeskCall[];
}

export interface PinInput {
  dockId: string;
  contactName: string;
  email: string;
  phone: string;
  role: string;
  note: string | null;
}

export interface WatchInput {
  email: string;
  name: string;
  corridor: CorridorId | null;
  region: RegionId | null;
  gallons: number | null;
}

export function emptyIncomeStore(): IncomeStoreFile {
  return {
    generatedAt: new Date().toISOString(),
    pins: [],
    watches: [],
    calls: [],
  };
}

export function waterLabel(corridor: CorridorId | null, region: RegionId | null): string {
  if (corridor) return CORRIDORS[corridor].label;
  if (region) return REGIONS[region].label;
  return "Sabine to Maine";
}

export function runWatchHref(input: {
  corridor?: string | null;
  region?: string | null;
  gallons?: number | string | null;
  watched?: boolean;
  paid?: boolean;
}): string {
  const params = new URLSearchParams();
  if (input.corridor) params.set("corridor", input.corridor);
  else if (input.region) params.set("region", input.region);
  if (input.gallons != null && String(input.gallons) !== "") {
    params.set("gallons", String(input.gallons));
  }
  if (input.watched) params.set("watched", "1");
  if (input.paid) params.set("paid", "1");
  const qs = params.toString();
  return qs ? `/run?${qs}` : "/run";
}

export function parsePositive(raw: string, max: number): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > max) return null;
  return value;
}

export function parsePinInput(form: {
  dockId: string;
  contactName: string;
  email: string;
  phone: string;
  role: string;
  note: string;
}): { ok: true; value: PinInput } | { ok: false; error: string } {
  const dockId = form.dockId.trim();
  const contactName = form.contactName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const role = form.role.trim();
  const note = form.note.trim();

  if (!dockId) return { ok: false, error: "Pick the dock." };
  if (!contactName) return { ok: false, error: "Add the name that runs the hose." };
  if (!email || !email.includes("@")) return { ok: false, error: "Add an email." };
  if (!phone) return { ok: false, error: "Add a phone number." };

  return {
    ok: true,
    value: {
      dockId,
      contactName,
      email,
      phone,
      role: role || "dock",
      note: note || null,
    },
  };
}

export function parseWatchInput(form: {
  email: string;
  name: string;
  corridor: string;
  region: string;
  gallons: string;
}): { ok: true; value: WatchInput } | { ok: false; error: string } {
  const email = form.email.trim();
  const name = form.name.trim();
  if (!email || !email.includes("@")) return { ok: false, error: "Add an email." };
  if (!name) return { ok: false, error: "Add a name." };

  const corridor = form.corridor.trim();
  const region = form.region.trim();
  const gallons = parsePositive(form.gallons, 2000);

  return {
    ok: true,
    value: {
      email,
      name,
      corridor: corridor && corridor in CORRIDORS ? (corridor as CorridorId) : null,
      region: region && region in REGIONS ? (region as RegionId) : null,
      gallons,
    },
  };
}

export function weekOfIso(now = new Date()): string {
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset));
  return monday.toISOString().slice(0, 10);
}

export function isoDate(value = new Date()): string {
  return value.toISOString().slice(0, 10);
}

export function dockWaterLabel(dock: Dock): string {
  if (dock.corridor) return CORRIDORS[dock.corridor].label;
  return REGIONS[dock.region].label;
}

const HOME_CORRIDORS: CorridorId[] = ["galveston-bay", "upper-keys"];

export function deskScore(dock: Dock): number {
  let score = 0;
  if (dock.corridor && HOME_CORRIDORS.includes(dock.corridor)) score += 100;
  if (dock.access === "public") score += 20;
  if (dock.phone) score += 20;
  if (dock.lead != null && dock.lead <= 5) score += 10;
  return score;
}

export function pinPitch(dockName: string): string {
  return `${dockName} has no number up. Boats that would stop are calling the next hose. ${PIN_PRICE_LABEL} and you write the number. Truck day, or when you change the board. We don’t invent a price. We don’t sell a gallon.`;
}

export const PIN_STATUSES: PinStatus[] = ["filed", "billed", "paid", "dead"];
export const WATCH_STATUSES: WatchStatus[] = ["filed", "paid", "stopped"];
export const CALL_STATUSES: CallStatus[] = ["queued", "called", "left-message", "filed", "skip"];

export function emailsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function isLivePin(pin: PinClaim): boolean {
  return pin.status === "filed" || pin.status === "billed" || pin.status === "paid";
}

export function livePinForDock(pins: PinClaim[], dockId: string): PinClaim | undefined {
  return pins.find((pin) => pin.dockId === dockId && isLivePin(pin));
}

export function paidPinForDock(pins: PinClaim[], dockId: string): PinClaim | undefined {
  return pins.find((pin) => pin.dockId === dockId && pin.status === "paid");
}

export function marinaEmailOwnsPin(pins: PinClaim[], dockId: string, email: string): boolean {
  const paid = paidPinForDock(pins, dockId);
  return Boolean(paid && emailsMatch(paid.email, email));
}
