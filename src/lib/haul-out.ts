export type YardArea = "clear-lake" | "kemah" | "upper-keys";

export type BoatBerth = "in-water" | "trailer";

export const YARD_AREA_LABEL: Record<YardArea, string> = {
  "clear-lake": "Clear Lake",
  kemah: "Kemah",
  "upper-keys": "Upper Keys",
};

export const YARD_AREAS: YardArea[] = ["clear-lake", "kemah", "upper-keys"];

export const BERTHS: BoatBerth[] = ["in-water", "trailer"];

export const EMPTY_LEFTOVER_NOTE = "Yards have not posted leftover seats yet.";

export const NAMED_STORM_PLAN_PRICE = "$99–$199 a season";

export interface HaulYard {
  id: string;
  name: string;
  area: YardArea;
  city: string;
  state: "TX" | "FL";
  indoorLeftover: number | null;
  lotLeftover: number | null;
  maxLengthFt: number | null;
  phone: string | null;
  leftoverPostedAt: string | null;
}

export interface NamedStormPlan {
  id: string;
  ownerName: string;
  phone: string;
  email: string;
  homeDock: string;
  lengthFt: number;
  beamFt: number;
  insuranceCarrier: string;
  berth: BoatBerth;
  primaryYardId: string | null;
  backupYardId: string | null;
  createdAt: string;
}

export interface HaulOutStoreFile {
  generatedAt: string;
  yards: HaulYard[];
  plans: NamedStormPlan[];
}

export interface YardSeedRow {
  id: string;
  name: string;
  area: YardArea;
  city: string;
  state: "TX" | "FL";
}

export interface OwnerPlanInput {
  ownerName: string;
  phone: string;
  email: string;
  homeDock: string;
  lengthFt: number;
  beamFt: number;
  insuranceCarrier: string;
  berth: BoatBerth;
}

export interface YardLeftoverInput {
  name: string;
  indoorLeftover: number | null;
  lotLeftover: number | null;
  maxLengthFt: number | null;
  phone: string | null;
}

export function leftoverLabel(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(value);
}

export function callOrText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function remainingKnown(yard: HaulYard): number | null {
  if (yard.indoorLeftover == null && yard.lotLeftover == null) return null;
  return (yard.indoorLeftover ?? 0) + (yard.lotLeftover ?? 0);
}

export function remainingLabel(yard: HaulYard): string {
  return leftoverLabel(remainingKnown(yard));
}

export function maxLengthLabel(yard: HaulYard): string {
  if (yard.maxLengthFt == null) return "—";
  return `${yard.maxLengthFt} ft`;
}

export function seedYardFromRow(row: YardSeedRow): HaulYard {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    city: row.city,
    state: row.state,
    indoorLeftover: null,
    lotLeftover: null,
    maxLengthFt: null,
    phone: null,
    leftoverPostedAt: null,
  };
}

export function yardsAreAllCall(yards: HaulYard[]): boolean {
  return yards.every((yard) => remainingKnown(yard) == null);
}

export function yardFits(yard: HaulYard, lengthFt: number): boolean {
  const remaining = remainingKnown(yard);
  if (remaining == null || remaining <= 0) return false;
  if (yard.maxLengthFt != null && lengthFt > yard.maxLengthFt) return false;
  return true;
}

export function assignYards(
  yards: HaulYard[],
  lengthFt: number,
): { primary: HaulYard | null; backup: HaulYard | null } {
  const fit = yards.filter((yard) => yardFits(yard, lengthFt));
  return { primary: fit[0] ?? null, backup: fit[1] ?? null };
}

export function planLeftoverNote(primary: HaulYard | null): string {
  if (!primary) return EMPTY_LEFTOVER_NOTE;
  return "Primary and backup are yards that posted leftover seats.";
}

export function parseOptionalCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 999) {
    throw new Error("Leftover seats must be a number, or blank.");
  }
  return value;
}

export function parseOptionalLength(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > 200) {
    throw new Error("Max length must be feet, or blank.");
  }
  return value;
}

export function parseOwnerPlanInput(form: {
  ownerName: string;
  phone: string;
  email: string;
  homeDock: string;
  length: string;
  beam: string;
  insuranceCarrier: string;
  berth: string;
}): { ok: true; value: OwnerPlanInput } | { ok: false; error: string } {
  const ownerName = form.ownerName.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();
  const homeDock = form.homeDock.trim();
  const insuranceCarrier = form.insuranceCarrier.trim();
  const lengthFt = Number(form.length);
  const beamFt = Number(form.beam);
  const berth = form.berth as BoatBerth;

  if (!ownerName) return { ok: false, error: "Add the owner name." };
  if (!phone) return { ok: false, error: "Add a phone number." };
  if (!email || !email.includes("@")) return { ok: false, error: "Add an email." };
  if (!homeDock) return { ok: false, error: "Add the home dock." };
  if (!Number.isFinite(lengthFt) || lengthFt <= 0 || lengthFt > 200) {
    return { ok: false, error: "Add length in feet." };
  }
  if (!Number.isFinite(beamFt) || beamFt <= 0 || beamFt > 40) {
    return { ok: false, error: "Add beam in feet." };
  }
  if (!insuranceCarrier) return { ok: false, error: "Add the insurance carrier." };
  if (!BERTHS.includes(berth)) return { ok: false, error: "Pick in-water or trailer." };

  return {
    ok: true,
    value: {
      ownerName,
      phone,
      email,
      homeDock,
      lengthFt,
      beamFt,
      insuranceCarrier,
      berth,
    },
  };
}

export function parseYardLeftoverInput(form: {
  name: string;
  indoorLeftover: string;
  lotLeftover: string;
  maxLength: string;
  phone: string;
}): { ok: true; value: YardLeftoverInput } | { ok: false; error: string } {
  const name = form.name.trim();
  if (!name) return { ok: false, error: "Add the yard name." };

  try {
    return {
      ok: true,
      value: {
        name,
        indoorLeftover: parseOptionalCount(form.indoorLeftover),
        lotLeftover: parseOptionalCount(form.lotLeftover),
        maxLengthFt: parseOptionalLength(form.maxLength),
        phone: form.phone.trim() || null,
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Check the leftover numbers." };
  }
}

export function slugYardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function yardDisplayName(yard: HaulYard | null): string {
  return yard?.name ?? "—";
}
