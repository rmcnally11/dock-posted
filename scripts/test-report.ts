import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  MAX_PHOTO_BYTES,
  PRICE_ALERT_CONSENT,
  calendarDay,
  chicagoToday,
  detectPhotoKind,
  gradeLabel,
  inspectPhoto,
  isFutureChicagoDate,
  planAlertIntake,
  planReportIntake,
  reportGrades,
  type ReportFormFields,
} from "../src/lib/price-report";
import { saveReportPhoto } from "../src/lib/persist";
import { commitPriceAlert, commitQueuedReport, readDocks, readReports, readReviewQueue } from "../src/lib/store";
import type { Dock, FuelQuote } from "../src/lib/types";
import seed from "../data/docks.seed.json";

const docks = seed.docks as Dock[];
const foundGym = docks.find((dock) => dock.id === "galveston-yacht-marina");
if (!foundGym) throw new Error("missing Galveston Yacht Marina");
const gym: Dock = foundGym;

const labels = reportGrades(gym).map((grade) => grade.label);
assert.deepEqual(labels, ["87", "93 E0", "Diesel"]);
for (const label of labels) {
  assert.doesNotMatch(label, /regular/i, label);
}
assert.equal(gradeLabel({ product: "gasoline", ethanol: "E0" }), "E0");
assert.equal(gradeLabel({ product: "90", ethanol: "E0" }), "90 E0");
assert.equal(gradeLabel({ product: "87", ethanol: "E0" }), "87 E0");
assert.doesNotMatch(gradeLabel({ product: "87", ethanol: "E0" }), /regular/i);
assert.doesNotMatch(gradeLabel({ product: "gasoline", ethanol: "E0" }), /regular/i);

const notSold: FuelQuote[] = [
  { product: "gasoline", pricePerGallon: null, ethanol: "E0", status: "call", taxIncluded: null },
  { product: "diesel", pricePerGallon: null, ethanol: "unknown", status: "not-sold", taxIncluded: null },
];
assert.deepEqual(
  reportGrades({ ...gym, quotes: notSold }).map((grade) => grade.label),
  ["E0"],
);

const afternoon = new Date("2026-10-06T18:00:00Z");
assert.equal(chicagoToday(afternoon), "2026-10-06");
assert.equal(isFutureChicagoDate("2026-10-06", afternoon), false);
assert.equal(isFutureChicagoDate("2026-10-07", afternoon), true);
assert.equal(isFutureChicagoDate("2026-10-05", afternoon), false);

const stillYesterdayInChicago = new Date("2026-10-07T02:30:00Z");
assert.equal(chicagoToday(stillYesterdayInChicago), "2026-10-06");
assert.equal(calendarDay("2026-10-06T23:00:00Z"), "2026-10-06");
assert.equal(isFutureChicagoDate("2026-10-07", stillYesterdayInChicago), true);
assert.equal(isFutureChicagoDate("2026-10-06", stillYesterdayInChicago), false);

function fields(overrides: Partial<ReportFormFields> = {}): ReportFormFields {
  return {
    websiteUrl: "",
    dockId: gym.id,
    grade: "93:E0",
    price: "8.771",
    seenAt: "2026-10-06",
    note: "",
    who: "boater",
    hours: "",
    pay: "",
    closed: false,
    dieselOnly: false,
    ...overrides,
  };
}

const future = planReportIntake(fields({ seenAt: "2026-10-07" }), gym, afternoon);
assert.equal(future.kind, "reject");
if (future.kind === "reject") assert.match(future.error, /hasn't happened yet/);

const todayPlan = planReportIntake(fields(), gym, afternoon);
assert.equal(todayPlan.kind, "accept");
if (todayPlan.kind === "accept") {
  assert.equal(todayPlan.value.product, "93");
  assert.equal(todayPlan.value.ethanol, "E0");
  assert.equal(todayPlan.value.pricePerGallon, 8.771);
}

const wrongHose = planReportIntake(fields({ grade: "90:E0" }), gym, afternoon);
assert.equal(wrongHose.kind, "reject");

const spam = planReportIntake(fields({ websiteUrl: "https://spam.example" }), gym, afternoon);
assert.equal(spam.kind, "drop");

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
assert.equal(detectPhotoKind(jpeg), "jpeg");
assert.equal(inspectPhoto(jpeg).ok, true);
assert.equal(inspectPhoto(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c])).ok, false);
const huge = new Uint8Array(MAX_PHOTO_BYTES + 1);
huge[0] = 0xff;
huge[1] = 0xd8;
huge[2] = 0xff;
const tooBig = inspectPhoto(huge);
assert.equal(tooBig.ok, false);
if (!tooBig.ok) assert.match(tooBig.error, /too big/);

const heic = new Uint8Array(12);
for (const [index, char] of [..."ftypheic"].entries()) heic[4 + index] = char.charCodeAt(0);
assert.equal(detectPhotoKind(heic), "heic");

const actions = readFileSync(path.join(process.cwd(), "src/app/report/actions.ts"), "utf8");
const dropAt = actions.indexOf('plan.kind === "drop"');
const commitAt = actions.indexOf("await commitQueuedReport");
assert.ok(dropAt > 0 && commitAt > dropAt, "honeypot drops the report before it is stored");
assert.doesNotMatch(actions, /addPriceReport/);
assert.doesNotMatch(actions, /resend|sendEmail|notify\(|nodemailer/i);
assert.match(actions, /redirect\(`\/\?reported=\$\{dockId\}#board`\)/);

const dockPage = readFileSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx"), "utf8");
assert.match(dockPage, /data-testid="report-a-price"/);
assert.match(dockPage, /Report a price/);
assert.match(dockPage, /\/report\?dock=\$\{dock\.id\}/);

delete process.env.BLOB_READ_WRITE_TOKEN;

async function runStoreChecks() {
  process.env.DATA_DIR = await mkdtemp(path.join(tmpdir(), "dock-posted-report-"));

const before = await readDocks();
const beforeGym = before.find((dock) => dock.id === gym.id);
if (!beforeGym) throw new Error("missing dock");
const beforeBoard = JSON.stringify({
  quotes: beforeGym.quotes,
  ethanol: beforeGym.ethanol,
  lastVerifiedAt: beforeGym.lastVerifiedAt,
  lastVerifiedSource: beforeGym.lastVerifiedSource,
  notes: beforeGym.notes,
  hours: beforeGym.hours,
});
assert.equal(
  before.some((dock) => dock.quotes.some((quote) => quote.pricePerGallon === 8.771)),
  false,
);

const dropped = await commitQueuedReport(spam, { id: "spam-1", photoPath: null });
assert.equal(dropped.stored, false);
assert.equal((await readReviewQueue()).submissions.length, 0);

const blocked = await commitQueuedReport(future, { id: "future-1", photoPath: null });
assert.equal(blocked.stored, false);
assert.equal((await readReviewQueue()).submissions.length, 0);

const stored = await commitQueuedReport(todayPlan, { id: "price-1", photoPath: null });
assert.equal(stored.stored, true);
if (stored.stored) {
  assert.equal(stored.report.status, "pending");
  assert.equal(stored.report.dockId, gym.id);
  assert.equal(stored.report.pricePerGallon, 8.771);
}

const after = await readDocks();
const afterGym = after.find((dock) => dock.id === gym.id);
if (!afterGym) throw new Error("missing dock");
assert.equal(
  JSON.stringify({
    quotes: afterGym.quotes,
    ethanol: afterGym.ethanol,
    lastVerifiedAt: afterGym.lastVerifiedAt,
    lastVerifiedSource: afterGym.lastVerifiedSource,
    notes: afterGym.notes,
    hours: afterGym.hours,
  }),
  beforeBoard,
);
assert.equal(
  after.some((dock) => dock.quotes.some((quote) => quote.pricePerGallon === 8.771)),
  false,
);
const reports = await readReports();
assert.equal(
  reports.some((report) => report.pricePerGallon === 8.771),
  false,
);
const queued = await readReviewQueue();
assert.equal(queued.submissions.length, 1);
assert.equal(queued.submissions[0]?.status, "pending");

const photoPath = await saveReportPhoto("shot-1", jpeg, "jpg", "image/jpeg");
assert.equal(existsSync(photoPath), true);
assert.match(photoPath, /report-photos/);

const alertSpam = planAlertIntake(
  { websiteUrl: "http://spam.example", dockId: gym.id, email: "a@b.co", consent: true },
  gym,
);
assert.equal(alertSpam.kind, "drop");
const alertDrop = await commitPriceAlert(alertSpam);
assert.equal(alertDrop.stored, false);

const alertPlan = planAlertIntake(
  { websiteUrl: "", dockId: gym.id, email: "Boater@Example.com", consent: true },
  gym,
);
assert.equal(alertPlan.kind, "accept");
const alertSaved = await commitPriceAlert(alertPlan);
assert.equal(alertSaved.stored, true);
if (alertSaved.stored) {
  assert.equal(alertSaved.alert.dockId, gym.id);
  assert.equal(alertSaved.alert.email, "boater@example.com");
  assert.equal(alertSaved.alert.consent, PRICE_ALERT_CONSENT);
}
const withAlert = await readReviewQueue();
assert.equal(withAlert.alerts.length, 1);
assert.equal(withAlert.submissions.length, 1);
assert.equal(
  after.some((dock) => dock.quotes.some((quote) => quote.pricePerGallon === 8.771)),
  false,
);

console.log("report checks passed");
}

runStoreChecks().catch((error) => {
  console.error(error);
  process.exit(1);
});
