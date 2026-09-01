import {
  PIN_SEASON_DOLLARS,
  WATCH_YEAR_DOLLARS,
  isoDate,
  waterLabel as labelWater,
  type DeskCall,
  type PinClaim,
  type WaterWatch,
} from "./income";
import { briefCoastsFor } from "./sister";

export const DESK_BASE_ID = "apppoBWAzJi7lVVKv";
export const DESK_BASE_URL = "https://airtable.com/apppoBWAzJi7lVVKv";

const PINS = {
  table: "tbluM5UUqYxuEA8uh",
  pin: "fldm0TnqdgQfZCM79",
  dockId: "fldMKJa6NZRpdIKkS",
  contact: "fldt4Qec0TPcOqKhK",
  email: "fldf8VQDYQuioYbDo",
  phone: "fld0PAzpuH0OGyDj9",
  role: "fldLihACUkX3lOCZ8",
  status: "flddvHToEzda5NW2P",
  fee: "fld4G5PGlIXmChsZ8",
  filedOn: "fldqU9PewVbZzt5Gb",
  paidOn: "flde26S1KLr1OrM1b",
  notes: "fldwg1j5pL1IsUs4Y",
} as const;

const WATCHES = {
  table: "tblR6H6weLulz1qUV",
  email: "fldLeVtJSgGIRpV2D",
  name: "fld5m2MTG0macXc0z",
  water: "fldVt23E2gS5OJkKi",
  status: "fldHb6SzZWtyJoQGm",
  fee: "fldXHYsrnBMQ6pa2W",
  gallons: "fldBv4QxD3wGTzLGG",
  joinedOn: "fldkwcoUrjEXpyIWx",
  notes: "fldhAfmYmdUrYzLIn",
} as const;

const CALLS = {
  table: "tblAPwV1Ru2bI4GR6",
  dock: "fldyLzMqjkKHcZfhi",
  dockId: "fldFKxon832j8mG2W",
  phone: "fldBJ5Qh62iyvDUvi",
  water: "fldw2xghMIN6kBfnB",
  weekOf: "fldocCyW8U29W5c1z",
  status: "fldaazakV9Z1N7VO5",
  notes: "fldWOzllr6R0pcNlN",
} as const;

const BRIEF = {
  base: "app3GRvkkpJdnVIKy",
  table: "tblqoCAVvAvEFYMe6",
  email: "fldxbuLSA1abol1QD",
  coasts: "fldfp7bhxDuVsvLDs",
  status: "fldNvuox5pwxbDc9i",
  joinedHow: "fldCrpEUBV2t9a5oh",
  joinedOn: "fldTQcD4XDpVsdy6f",
  notes: "fldYDuwwxmogAbDvl",
  receive: "fldedcanNXcoKuOnM",
  name: "fld3dNtADK32TeRYD",
} as const;

const PIN_STATUS: Record<PinClaim["status"], string> = {
  filed: "Filed",
  billed: "Billed",
  paid: "Paid",
  dead: "Dead",
};

const WATCH_STATUS: Record<WaterWatch["status"], string> = {
  filed: "Filed",
  paid: "Paid",
  stopped: "Stopped",
};

const CALL_STATUS: Record<DeskCall["status"], string> = {
  queued: "Queued",
  called: "Called",
  "left-message": "Left message",
  filed: "Filed",
  skip: "Skip",
};

function token(): string | null {
  return process.env.AIRTABLE_API_KEY?.trim() || null;
}

async function airtableCreate(
  baseId: string,
  tableId: string,
  fields: Record<string, unknown>,
): Promise<string | null> {
  const key = token();
  if (!key) return null;
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    console.warn("Airtable create failed", baseId, tableId, res.status, await res.text());
    return null;
  }
  const body = (await res.json()) as { id?: string };
  return body.id ?? null;
}

async function airtablePatch(
  baseId: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const key = token();
  if (!key) return;
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!res.ok) {
    console.warn("Airtable patch failed", tableId, recordId, res.status, await res.text());
  }
}

export async function writePinToAirtable(pin: PinClaim): Promise<string | null> {
  return airtableCreate(DESK_BASE_ID, PINS.table, {
    [PINS.pin]: `${pin.dockName} \u00b7 ${pin.contactName}`,
    [PINS.dockId]: pin.dockId,
    [PINS.contact]: pin.contactName,
    [PINS.email]: pin.email,
    [PINS.phone]: pin.phone,
    [PINS.role]: pin.role,
    [PINS.status]: PIN_STATUS[pin.status],
    [PINS.fee]: PIN_SEASON_DOLLARS,
    [PINS.filedOn]: isoDate(new Date(pin.createdAt)),
    [PINS.notes]: pin.note,
  });
}

export async function markPinPaidInAirtable(recordId: string, paidAt: string): Promise<void> {
  await airtablePatch(DESK_BASE_ID, PINS.table, recordId, {
    [PINS.status]: "Paid",
    [PINS.paidOn]: isoDate(new Date(paidAt)),
  });
}

export async function markPinDeadInAirtable(recordId: string): Promise<void> {
  await airtablePatch(DESK_BASE_ID, PINS.table, recordId, {
    [PINS.status]: "Dead",
  });
}

export async function writeWatchToAirtable(watch: WaterWatch): Promise<string | null> {
  return airtableCreate(DESK_BASE_ID, WATCHES.table, {
    [WATCHES.email]: watch.email,
    [WATCHES.name]: watch.name,
    [WATCHES.water]: labelWater(watch.corridor, watch.region),
    [WATCHES.status]: WATCH_STATUS[watch.status],
    [WATCHES.fee]: WATCH_YEAR_DOLLARS,
    [WATCHES.gallons]: watch.gallons,
    [WATCHES.joinedOn]: isoDate(new Date(watch.createdAt)),
    [WATCHES.notes]: watch.note,
  });
}

export async function markWatchPaidInAirtable(recordId: string): Promise<void> {
  await airtablePatch(DESK_BASE_ID, WATCHES.table, recordId, {
    [WATCHES.status]: "Paid",
  });
}

export async function writeCallToAirtable(call: DeskCall): Promise<string | null> {
  return airtableCreate(DESK_BASE_ID, CALLS.table, {
    [CALLS.dock]: call.dockName,
    [CALLS.dockId]: call.dockId,
    [CALLS.phone]: call.phone,
    [CALLS.water]: call.water,
    [CALLS.weekOf]: call.weekOf,
    [CALLS.status]: CALL_STATUS[call.status],
    [CALLS.notes]: call.note,
  });
}

export function briefCoastFor(watch: WaterWatch): string | null {
  return briefCoastsFor({ corridor: watch.corridor, region: watch.region })[0] ?? null;
}

export function briefCoastsForWatch(watch: WaterWatch): string[] {
  return briefCoastsFor({ corridor: watch.corridor, region: watch.region });
}

export async function writeWatchToFieldBrief(watch: WaterWatch): Promise<void> {
  const coasts = briefCoastsForWatch(watch);
  await airtableCreate(BRIEF.base, BRIEF.table, {
    [BRIEF.email]: watch.email,
    [BRIEF.name]: watch.name,
    [BRIEF.status]: watch.status === "paid" ? "Paid" : "Active",
    [BRIEF.joinedHow]: "Brief",
    [BRIEF.joinedOn]: isoDate(new Date(watch.createdAt)),
    [BRIEF.receive]: ["Weekly"],
    [BRIEF.notes]: `Dock Posted run watch. ${labelWater(watch.corridor, watch.region)}.`,
    ...(coasts.length > 0 ? { [BRIEF.coasts]: coasts } : {}),
  });
}

export function airtableConfigured(): boolean {
  return Boolean(token());
}
