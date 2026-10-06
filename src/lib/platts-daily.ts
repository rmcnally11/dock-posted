/** Desk-only. Never import this module from a public page. */

export const PLATTS_AIRTABLE_BASE_ID = "appokfrHKXUhGXjVo";
export const PLATTS_AIRTABLE_TABLE_ID = "tbl5y8ORe6aOumuJn";
export const AIRTABLE_PLATTS_TOKEN_ENV = "AIRTABLE_PLATTS_TOKEN";

/** Flag when |Out − (Implied + Diff)| is greater than this many ¢/gal. */
export const OUTRIGHT_MISMATCH_CENTS = 0.05;

/**
 * Exact field names on the Platts Daily table (base appokfrHKXUhGXjVo,
 * table tbl5y8ORe6aOumuJn). DateKey is singleLineText. Spot is the *_Out
 * field. A missing or non-numeric field stays null and is never treated as 0.
 */
export const PLATTS_AIRTABLE_FIELDS = {
  dateKey: "DateKey",
  nymexRbImplied: "NYMEX_RB_Implied",
  nymexHoImplied: "NYMEX_HO_Implied",
  gcCbobDiff: "GC_CBOB_Diff",
  gcCbob93Diff: "GC_CBOB93_Diff",
  gcUlsdDiff: "GC_ULSD_Diff",
  tpaCbobDiff: "TPA_CBOB_Diff",
  tpaUlsdDiff: "TPA_ULSD_Diff",
  tpaPreDiff: "TPA_PRE_Diff",
  gcCbobOut: "GC_CBOB_Out",
  gcCbob93Out: "GC_CBOB93_Out",
  gcUlsdOut: "GC_ULSD_Out",
  tpaCbobOut: "TPA_CBOB_Out",
  tpaPreOut: "TPA_PRE_Out",
  tpaUlsdOut: "TPA_ULSD_Out",
} as const;

export type PlattsAssessmentKey = "gcCbob" | "gcCbob93" | "gcUlsd" | "tpaCbob" | "tpaPre" | "tpaUlsd";

export interface PlattsAssessment {
  out: number | null;
  implied: number | null;
  diff: number | null;
  /** Absolute gap when out, implied, and diff are all numeric. Otherwise null. */
  gap: number | null;
  /** True only when gap > 0.05. A missing input does not flag and is not 0. */
  flagged: boolean;
}

export interface PlattsDailyRow {
  dateKey: string;
  gcCbob: PlattsAssessment;
  gcCbob93: PlattsAssessment;
  gcUlsd: PlattsAssessment;
  tpaCbob: PlattsAssessment;
  tpaPre: PlattsAssessment;
  tpaUlsd: PlattsAssessment;
}

export interface PlattsDailyLoad {
  row: PlattsDailyRow | null;
  source: "airtable" | "unavailable";
  stale: boolean;
  todayKey: string;
  note: string;
  outrightFlag: boolean;
}

type AirtableRecord = { id?: string; fields?: Record<string, unknown> };
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const ASSESSMENT_KEYS: PlattsAssessmentKey[] = ["gcCbob", "gcCbob93", "gcUlsd", "tpaCbob", "tpaPre", "tpaUlsd"];

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

export function roundAssessmentCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function outrightGap(out: number, implied: number, diff: number): number {
  return roundAssessmentCents(Math.abs(out - (implied + diff)));
}

export function plattsRowOutrightFlag(row: PlattsDailyRow | null): boolean {
  if (!row) return false;
  return ASSESSMENT_KEYS.some((key) => row[key].flagged);
}

export function plattsRowFromAirtableFields(fields: Record<string, unknown>): PlattsDailyRow | null {
  const dateKey = dateKeyOf(readExact(fields, PLATTS_AIRTABLE_FIELDS.dateKey));
  if (!dateKey) return null;
  const rb = PLATTS_AIRTABLE_FIELDS.nymexRbImplied;
  const ho = PLATTS_AIRTABLE_FIELDS.nymexHoImplied;
  return {
    dateKey,
    gcCbob: assessment(fields, PLATTS_AIRTABLE_FIELDS.gcCbobOut, rb, PLATTS_AIRTABLE_FIELDS.gcCbobDiff),
    gcCbob93: assessment(fields, PLATTS_AIRTABLE_FIELDS.gcCbob93Out, rb, PLATTS_AIRTABLE_FIELDS.gcCbob93Diff),
    gcUlsd: assessment(fields, PLATTS_AIRTABLE_FIELDS.gcUlsdOut, ho, PLATTS_AIRTABLE_FIELDS.gcUlsdDiff),
    tpaCbob: assessment(fields, PLATTS_AIRTABLE_FIELDS.tpaCbobOut, rb, PLATTS_AIRTABLE_FIELDS.tpaCbobDiff),
    tpaPre: assessment(fields, PLATTS_AIRTABLE_FIELDS.tpaPreOut, rb, PLATTS_AIRTABLE_FIELDS.tpaPreDiff),
    tpaUlsd: assessment(fields, PLATTS_AIRTABLE_FIELDS.tpaUlsdOut, ho, PLATTS_AIRTABLE_FIELDS.tpaUlsdDiff),
  };
}

/** Latest DateKey wins. The first record wins when two share that date. */
export function latestPlattsRecord(records: AirtableRecord[]): PlattsDailyRow | null {
  let best: PlattsDailyRow | null = null;
  for (const record of records) {
    const row = plattsRowFromAirtableFields(record.fields ?? {});
    if (!row) continue;
    if (!best || row.dateKey > best.dateKey) best = row;
  }
  return best;
}

export async function loadPlattsDailyRow(
  options: { fetch?: FetchLike; token?: string | null; today?: Date; todayKey?: string } = {},
): Promise<PlattsDailyLoad> {
  const todayKey = options.todayKey ?? gulfCoastDateKey(options.today ?? new Date());
  const unavailable = (note: string): PlattsDailyLoad => ({
    row: null,
    source: "unavailable",
    stale: false,
    todayKey,
    note,
    outrightFlag: false,
  });

  const token = (options.token !== undefined ? options.token : process.env[AIRTABLE_PLATTS_TOKEN_ENV])?.trim() ?? "";
  if (!token) {
    return unavailable(`Platts Daily feed did not run (${AIRTABLE_PLATTS_TOKEN_ENV} unset).`);
  }

  const fetchImpl = options.fetch ?? fetch;
  try {
    const records = await fetchAirtableRecords(fetchImpl, token);
    const row = records ? latestPlattsRecord(records) : null;
    if (!row) {
      return unavailable("Platts Daily fetch did not return a DateKey row.");
    }
    return {
      row,
      source: "airtable",
      stale: plattsRowIsStale(row.dateKey, todayKey),
      todayKey,
      note: `Airtable Platts Daily latest DateKey ${row.dateKey}.`,
      outrightFlag: plattsRowOutrightFlag(row),
    };
  } catch {
    return unavailable("Platts Daily fetch failed.");
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

function assessment(fields: Record<string, unknown>, outName: string, impliedName: string, diffName: string): PlattsAssessment {
  const out = finiteNumber(readExact(fields, outName));
  const implied = finiteNumber(readExact(fields, impliedName));
  const diff = finiteNumber(readExact(fields, diffName));
  const gap = out != null && implied != null && diff != null ? outrightGap(out, implied, diff) : null;
  return {
    out,
    implied,
    diff,
    gap,
    flagged: gap != null && gap > OUTRIGHT_MISMATCH_CENTS,
  };
}

function readExact(fields: Record<string, unknown>, name: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(fields, name)) return undefined;
  return fields[name];
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
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
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
