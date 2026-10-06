import { readFileSync } from "node:fs";
import path from "node:path";

/** Desk-only. Never import this module from a public page. */
export const PLATTS_AIRTABLE_BASE_ID = "appokfrHKXUhGXjVo";
export const PLATTS_AIRTABLE_TABLE_ID = "tbl5y8ORe6aOumuJn";
export const AIRTABLE_PLATTS_TOKEN_ENV = "AIRTABLE_PLATTS_TOKEN";

/**
 * Field names on the Platts Daily table. The live base was not readable from
 * this environment (Airtable returned 403), so this is the explicit contract.
 * Lookup is case-insensitive. A missing field fails the row; it is never treated as 0.
 */
export const PLATTS_AIRTABLE_FIELDS = {
  dateKey: "DateKey",
  rbCents: "RB",
  hoCents: "HO",
  gcCbobDiffCents: "GC CBOB diff",
  gcCbob93DiffCents: "GC CBOB93 diff",
  gcUlsdDiffCents: "GC ULSD diff",
  tampaCbobDiffCents: "Tampa CBOB diff",
} as const;

export interface PlattsDailyRow {
  dateKey: string;
  rbCents: number;
  hoCents: number;
  gcCbobDiffCents: number;
  gcCbob93DiffCents: number;
  gcUlsdDiffCents: number;
  tampaCbobDiffCents: number;
}

export interface PlattsDailyLoad {
  row: PlattsDailyRow;
  source: "airtable" | "seed";
  stale: boolean;
  todayKey: string;
  note: string;
}

type AirtableRecord = { id?: string; fields?: Record<string, unknown> };

const seedCache: { row: PlattsDailyRow | null } = { row: null };

export function loadPlattsDailySeed(): PlattsDailyRow {
  if (seedCache.row) return seedCache.row;
  const file = path.join(process.cwd(), "data", "platts-daily-seed.json");
  const parsed = JSON.parse(readFileSync(file, "utf8")) as PlattsDailyRow;
  const row = parsePlattsDailyRow(parsed);
  if (!row) throw new Error("Platts Daily seed row is incomplete.");
  seedCache.row = row;
  return row;
}

export function gulfCoastDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Weekdays strictly after `fromKey` through `toKey`. Weekends are not business days. */
export function weekdaySpan(fromKey: string, toKey: string): number {
  const start = dateUtc(fromKey);
  const end = dateUtc(toKey);
  if (!start || !end || end <= start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

/** Older than one business day. The previous business day is still current. */
export function plattsRowIsStale(dateKey: string, todayKey: string): boolean {
  return weekdaySpan(dateKey, todayKey) > 1;
}

export function parsePlattsDailyRow(input: unknown): PlattsDailyRow | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const dateKey = dateKeyOf(record.dateKey ?? record.DateKey);
  const rbCents = finiteNumber(record.rbCents ?? record.RB);
  const hoCents = finiteNumber(record.hoCents ?? record.HO);
  const gcCbobDiffCents = finiteNumber(record.gcCbobDiffCents ?? record["GC CBOB diff"]);
  const gcCbob93DiffCents = finiteNumber(record.gcCbob93DiffCents ?? record["GC CBOB93 diff"]);
  const gcUlsdDiffCents = finiteNumber(record.gcUlsdDiffCents ?? record["GC ULSD diff"]);
  const tampaCbobDiffCents = finiteNumber(record.tampaCbobDiffCents ?? record["Tampa CBOB diff"]);
  if (
    !dateKey ||
    rbCents == null ||
    hoCents == null ||
    gcCbobDiffCents == null ||
    gcCbob93DiffCents == null ||
    gcUlsdDiffCents == null ||
    tampaCbobDiffCents == null
  ) {
    return null;
  }
  return { dateKey, rbCents, hoCents, gcCbobDiffCents, gcCbob93DiffCents, gcUlsdDiffCents, tampaCbobDiffCents };
}

export function plattsRowFromAirtableFields(fields: Record<string, unknown>): PlattsDailyRow | null {
  const dateKey = dateKeyOf(readField(fields, PLATTS_AIRTABLE_FIELDS.dateKey));
  const rbCents = finiteNumber(readField(fields, PLATTS_AIRTABLE_FIELDS.rbCents));
  const hoCents = finiteNumber(readField(fields, PLATTS_AIRTABLE_FIELDS.hoCents));
  const gcCbobDiffCents = finiteNumber(readField(fields, PLATTS_AIRTABLE_FIELDS.gcCbobDiffCents));
  const gcCbob93DiffCents = finiteNumber(readField(fields, PLATTS_AIRTABLE_FIELDS.gcCbob93DiffCents));
  const gcUlsdDiffCents = finiteNumber(readField(fields, PLATTS_AIRTABLE_FIELDS.gcUlsdDiffCents));
  const tampaCbobDiffCents = finiteNumber(readField(fields, PLATTS_AIRTABLE_FIELDS.tampaCbobDiffCents));
  if (
    !dateKey ||
    rbCents == null ||
    hoCents == null ||
    gcCbobDiffCents == null ||
    gcCbob93DiffCents == null ||
    gcUlsdDiffCents == null ||
    tampaCbobDiffCents == null
  ) {
    return null;
  }
  return { dateKey, rbCents, hoCents, gcCbobDiffCents, gcCbob93DiffCents, gcUlsdDiffCents, tampaCbobDiffCents };
}

export function latestPlattsRecord(records: AirtableRecord[]): PlattsDailyRow | null {
  let best: PlattsDailyRow | null = null;
  for (const record of records) {
    const row = plattsRowFromAirtableFields(record.fields ?? {});
    if (!row) continue;
    if (!best || row.dateKey >= best.dateKey) best = row;
  }
  return best;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export async function loadPlattsDailyRow(
  options: { fetch?: FetchLike; token?: string | null; today?: Date; todayKey?: string } = {},
): Promise<PlattsDailyLoad> {
  const todayKey = options.todayKey ?? gulfCoastDateKey(options.today ?? new Date());
  const seed = loadPlattsDailySeed();
  const seeded = (note: string): PlattsDailyLoad => ({
    row: seed,
    source: "seed",
    stale: plattsRowIsStale(seed.dateKey, todayKey),
    todayKey,
    note,
  });

  const token = (options.token !== undefined ? options.token : process.env[AIRTABLE_PLATTS_TOKEN_ENV])?.trim() ?? "";
  if (!token) {
    return seeded(
      `Seeded Platts Daily row ${seed.dateKey}. Live fetch did not run (${AIRTABLE_PLATTS_TOKEN_ENV} unset).`,
    );
  }

  const fetchImpl = options.fetch ?? fetch;
  try {
    const records = await fetchAirtableRecords(fetchImpl, token);
    const row = records ? latestPlattsRecord(records) : null;
    if (!row) {
      return seeded(`Seeded Platts Daily row ${seed.dateKey}. Live fetch did not return a complete DateKey row.`);
    }
    return {
      row,
      source: "airtable",
      stale: plattsRowIsStale(row.dateKey, todayKey),
      todayKey,
      note: `Airtable Platts Daily latest DateKey ${row.dateKey}.`,
    };
  } catch {
    return seeded(`Seeded Platts Daily row ${seed.dateKey}. Live fetch failed.`);
  }
}

async function fetchAirtableRecords(fetchImpl: FetchLike, token: string): Promise<AirtableRecord[] | null> {
  const base = `https://api.airtable.com/v0/${PLATTS_AIRTABLE_BASE_ID}/${PLATTS_AIRTABLE_TABLE_ID}`;
  const headers = { Authorization: `Bearer ${token}` };
  const sorted = await fetchImpl(
    `${base}?pageSize=100&sort[0][field]=${encodeURIComponent(PLATTS_AIRTABLE_FIELDS.dateKey)}&sort[0][direction]=desc`,
    { headers },
  );
  if (sorted.ok) return readRecords(sorted);
  const plain = await fetchImpl(`${base}?pageSize=100`, { headers });
  if (!plain.ok) return null;
  return readRecords(plain);
}

async function readRecords(response: Response): Promise<AirtableRecord[] | null> {
  const body = (await response.json()) as { records?: AirtableRecord[] };
  return Array.isArray(body.records) ? body.records : null;
}

function readField(fields: Record<string, unknown>, name: string): unknown {
  if (Object.prototype.hasOwnProperty.call(fields, name)) return fields[name];
  const want = normalizeName(name);
  for (const [key, value] of Object.entries(fields)) {
    if (normalizeName(key) === want) return value;
  }
  return undefined;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function dateKeyOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  return dateUtc(match[1]) ? match[1] : null;
}

function dateUtc(key: string): Date | null {
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}
