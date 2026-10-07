import assert from "node:assert/strict";
import { mkdtemp, readFileSync, writeFile } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import seed from "../data/docks.seed.json";
import WeeklyFuelPreviewPage from "../src/app/review/fuel/[slug]/page";
import sitemap from "../src/app/sitemap";
import { WeeklyFuelPreview } from "../src/components/weekly-fuel-preview";
import {
  AREA_EMPTY_PRICES,
  AREA_PRICES_HEADING,
  buildAreaPage,
} from "../src/lib/area";
import { DOCK_ORIGIN } from "../src/lib/dock-page";
import { HOME_AREAS, homeArea } from "../src/lib/posted";
import { writeReviewFile } from "../src/lib/persist";
import type { Dock, FuelQuote } from "../src/lib/types";
import {
  WEEKLY_FUEL_PREVIEW_GATE,
  WEEKLY_FUEL_PREVIEW_NOTE,
  WEEKLY_FUEL_PREVIEW_TITLE,
  WEEKLY_FUEL_SUBJECT_LEAD,
  WEEKLY_FUEL_TAGLINE,
  WEEKLY_FUEL_UNSUBSCRIBE_HREF,
  WEEKLY_FUEL_UNSUBSCRIBE_LABEL,
  buildWeeklyFuelMail,
  buildWeeklyFuelMails,
  readWeeklyFuelRecipients,
  weeklyAreaHref,
  weeklyDockHref,
  weeklyFuelIntro,
  weeklyFuelPreviewLinks,
  weeklyFuelRecipients,
  weeklyFuelSubject,
} from "../src/lib/weekly-fuel";

const docks = seed.docks as Dock[];
const readOn = Date.parse("2026-10-07T21:00:00Z");
const eightDays = Date.parse("2026-10-15T00:00:00Z");
const octTen = Date.parse("2026-10-22T00:00:00Z");
const beforeArlingtonRead = Date.parse("2026-10-03T21:00:00Z");

const LEAK = /\brack\b|\binvoice\b|should-be|\bnymex\b|\bTCN\b|\bplatts\b|\bRIN\b|\bwholesale\b/i;
const SEND = /sendMail|api\.resend\.com|nodemailer|RESEND_|readIncomeFile|readWholesaleFile|readIncomeStore|readWholesaleStore/;

function dockById(id: string): Dock {
  const dock = docks.find((item) => item.id === id);
  assert.ok(dock, `missing ${id}`);
  return dock;
}

function quote(partial: Partial<FuelQuote> & Pick<FuelQuote, "product" | "pricePerGallon" | "status">): FuelQuote {
  return { ethanol: "unknown", taxIncluded: null, ...partial };
}

function isNotFound(error: unknown): boolean {
  return String(error).includes("404");
}

assert.equal(DOCK_ORIGIN, "https://www.dockposted.com");
assert.equal(weeklyDockHref("galveston-yacht-marina"), "https://www.dockposted.com/docks/galveston-yacht-marina");
assert.equal(weeklyAreaHref("galveston-bay"), "/area/galveston-bay");
assert.equal(weeklyAreaHref("tampa-bay"), "/area/tampa-bay");
assert.equal(weeklyAreaHref("northeast-florida"), "/area/northeast-florida");
assert.equal(weeklyFuelSubject("Galveston Bay / Clear Lake"), "Cheapest posted fuel, Galveston Bay / Clear Lake");
assert.equal(
  weeklyFuelIntro("Galveston Bay / Clear Lake"),
  "Fuel docks in Galveston Bay / Clear Lake, cheapest posted price first. Call before you go.",
);
assert.equal(WEEKLY_FUEL_UNSUBSCRIBE_HREF, "{{unsubscribe_url}}");
assert.equal(WEEKLY_FUEL_UNSUBSCRIBE_LABEL, "Unsubscribe");

const titles = ["Galveston Bay / Clear Lake", "Tampa Bay", "Northeast Florida"] as const;
const mails = buildWeeklyFuelMails(docks, readOn);
assert.deepEqual(
  mails.map((mail) => mail.title),
  [...titles],
);
assert.deepEqual(
  mails.map((mail) => mail.id),
  HOME_AREAS.map((area) => area.id),
);

for (const now of [readOn, eightDays, octTen, beforeArlingtonRead]) {
  for (const area of HOME_AREAS) {
    const page = buildAreaPage(docks, area.id, now);
    const mail = buildWeeklyFuelMail(docks, area.id, now);
    assert.equal(mail.subject, `${WEEKLY_FUEL_SUBJECT_LEAD}, ${page.title}`);
    assert.equal(mail.intro, weeklyFuelIntro(page.title));
    assert.match(mail.html, new RegExp(`href="${weeklyAreaHref(area.id)}"`));
    assert.match(mail.text, new RegExp(`^${weeklyAreaHref(area.id)}$`, "m"));
    assert.ok(mail.html.includes(AREA_PRICES_HEADING));
    assert.ok(mail.html.includes(mail.intro));
    assert.ok(mail.text.includes(mail.intro));
    assert.ok(mail.html.includes(WEEKLY_FUEL_UNSUBSCRIBE_HREF));
    assert.ok(mail.html.includes(WEEKLY_FUEL_UNSUBSCRIBE_LABEL));
    assert.match(mail.text, new RegExp(`^${WEEKLY_FUEL_UNSUBSCRIBE_LABEL}$`, "m"));
    assert.ok(mail.text.includes(WEEKLY_FUEL_UNSUBSCRIBE_HREF));
    assert.ok(mail.html.includes(WEEKLY_FUEL_TAGLINE));
    assert.ok(mail.text.includes(WEEKLY_FUEL_TAGLINE));
    assert.doesNotMatch(mail.html, LEAK);
    assert.doesNotMatch(mail.text, LEAK);
    assert.doesNotMatch(mail.html, /Date unknown|your weekly digest|>Regular/i);
    assert.doesNotMatch(mail.text, /Date unknown|\bRegular\b|your weekly digest/i);

    if (page.priced.length === 0) {
      assert.match(mail.html, new RegExp(AREA_EMPTY_PRICES));
      assert.match(mail.text, new RegExp(AREA_EMPTY_PRICES));
    }

    let last = -1;
    for (const dock of page.priced) {
      const href = weeklyDockHref(dock.id);
      const at = mail.html.indexOf(`href="${href}"`);
      assert.ok(at > last, `${dock.id} left the area order`);
      last = at;
      assert.ok(mail.html.includes(`data-testid="weekly-dock-${dock.id}"`));
      assert.ok(mail.html.includes(`data-stale="${dock.stale ? "true" : "false"}"`));
      assert.ok(mail.text.includes(href));
      assert.ok(mail.text.includes(dock.name));
      for (const line of dock.lines) {
        assert.ok(mail.html.includes(line.figure));
        assert.ok(mail.text.includes(`${line.label} ${line.figure}`));
      }
      if (dock.stale) {
        assert.ok(mail.html.includes(`data-testid="weekly-stale-${dock.id}"`));
        assert.match(mail.html, />Stale</);
        assert.match(mail.text, /^Stale$/m);
      }
      if (dock.asOf) {
        assert.ok(mail.html.includes(`As of ${dock.asOf}`));
        assert.ok(mail.text.includes(`As of ${dock.asOf}`));
      }
      if (dock.source) {
        assert.ok(mail.html.includes(dock.source));
        assert.ok(mail.text.includes(dock.source));
      }
      assert.equal(dock.source === "Marina's website" || dock.source === "Marina staff report, not checked", true);
    }
    for (const dock of page.callAhead) {
      assert.equal(mail.html.includes(`/docks/${dock.id}`), false, `${dock.id} has no posted price`);
      assert.equal(mail.text.includes(dock.name), false, `${dock.name} has no posted price`);
    }
  }
}

const galveston = buildWeeklyFuelMail(docks, "galveston-bay", readOn);
assert.match(galveston.html, /href="https:\/\/www\.dockposted\.com\/docks\/galveston-yacht-marina"/);
assert.match(galveston.html, /href="\/area\/galveston-bay"/);
assert.match(galveston.html, /\$4\.83/);
assert.match(galveston.html, /\$6\.27/);
assert.match(galveston.html, /\$6\.33/);
assert.match(galveston.html, /As of Oct 7, 2026/);
assert.match(galveston.html, /Marina(?:'|&#x27;)s website/);
assert.doesNotMatch(galveston.html, />Stale</);
assert.match(galveston.text, /87 \$4\.83/);
assert.match(galveston.text, /93 E0 \$6\.27/);
assert.match(galveston.text, /Diesel \$6\.33/);
assert.doesNotMatch(galveston.text, /^Stale$/m);
assert.doesNotMatch(galveston.html, /9AM|fuel dock Daily/);

const galvestonLater = buildWeeklyFuelMail(docks, "galveston-bay", eightDays);
assert.match(galvestonLater.html, /data-testid="weekly-stale-galveston-yacht-marina"/);
assert.match(galvestonLater.html, />Stale</);
assert.match(galvestonLater.text, /^Stale$/m);
assert.match(galvestonLater.html, /\$4\.83/);
assert.equal(
  galvestonLater.html.includes("Stale"),
  buildAreaPage(docks, "galveston-bay", eightDays).priced[0]?.stale,
);

const earlyNorth = buildWeeklyFuelMail(docks, "northeast-florida", beforeArlingtonRead);
assert.match(earlyNorth.html, /data-testid="weekly-stale-arlington-marina"/);
assert.match(earlyNorth.html, /\$6\.399/);
const arlingtonAt = earlyNorth.html.indexOf('data-testid="weekly-dock-arlington-marina"');
const arlingtonHtml = earlyNorth.html.slice(arlingtonAt, earlyNorth.html.indexOf("weekly-dock-", arlingtonAt + 10));
assert.doesNotMatch(arlingtonHtml, /As of /);
assert.match(earlyNorth.text, /Arlington Marina\nJacksonville, FL\nhttps:\/\/www\.dockposted\.com\/docks\/arlington-marina\nStale\n/);
assert.doesNotMatch(
  earlyNorth.text.slice(earlyNorth.text.indexOf("Arlington Marina"), earlyNorth.text.indexOf("St. Augustine")),
  /As of /,
);

const emptyMail = buildWeeklyFuelMail([], "tampa-bay", readOn);
assert.ok(emptyMail.html.includes(AREA_EMPTY_PRICES));
assert.ok(emptyMail.text.includes(AREA_EMPTY_PRICES));
assert.equal(emptyMail.html.includes("/docks/"), false);
assert.ok(emptyMail.html.includes('href="/area/tampa-bay"'));
assert.ok(emptyMail.html.includes(WEEKLY_FUEL_UNSUBSCRIBE_HREF));
assert.doesNotMatch(emptyMail.html, />Stale</);

const tampaLater = buildWeeklyFuelMail(docks, "tampa-bay", eightDays);
assert.equal(tampaLater.html.includes("weekly-stale-madeira-beach-municipal-marina"), false);
assert.equal(buildAreaPage(docks, "tampa-bay", eightDays).priced[0]?.stale, false);

const leaked: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "leaky-area-notes",
  name: "Leaky Notes Dock",
  notes: "NYMEX rack invoice should-be TCN Platts RIN wholesale",
};
const guide: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "guide-priced",
  name: "Guide Priced Dock",
  lastVerifiedSource: "Waterway Guide",
  quotes: [quote({ product: "87", pricePerGallon: 1.11, status: "posted" })],
};
const boater: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "boater-priced",
  name: "Boater Priced Dock",
  lastVerifiedSource: "boater report (reviewed)",
  quotes: [quote({ product: "87", pricePerGallon: 1.22, status: "posted" })],
};
const rawUser: Dock = {
  ...dockById("blue-marlin-seabrook"),
  id: "user-priced",
  name: "User Priced Dock",
  lastVerifiedSource: "user report",
  quotes: [quote({ product: "87", pricePerGallon: 1.33, status: "posted" })],
};
const nasty: Dock = {
  ...dockById("galveston-yacht-marina"),
  id: "nasty-name",
  name: `</iframe><script>alert(1)</script>`,
  quotes: [quote({ product: "87", pricePerGallon: 4.5, status: "posted" })],
};
const mixed = buildWeeklyFuelMail(
  [...docks, leaked, guide, boater, rawUser, nasty],
  "galveston-bay",
  readOn,
);
assert.match(mixed.html, /Leaky Notes Dock/);
assert.doesNotMatch(`${mixed.html}\n${mixed.text}`, LEAK);
assert.doesNotMatch(`${mixed.html}\n${mixed.text}`, /\$1\.11|\$1\.22|\$1\.33|Guide Priced Dock|Boater Priced Dock|User Priced Dock/);
assert.match(mixed.html, /&lt;\/iframe&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(mixed.html, /<script>alert\(1\)<\/script>/);
assert.equal(mixed.html.includes("/docks/guide-priced"), false);
assert.equal(mixed.html.includes("/docks/boater-priced"), false);
assert.equal(mixed.html.includes("/docks/user-priced"), false);

const outside = docks.find((dock) => homeArea(dock) == null);
assert.ok(outside, "need a dock outside the three areas");
const recipients = weeklyFuelRecipients(
  [
    { dockId: "galveston-yacht-marina", email: " Boater@Example.com " },
    { dockId: "bayland-marina", email: "boater@example.com" },
    { dockId: "bayland-marina", email: "second@example.com" },
    { dockId: "madeira-beach-municipal-marina", email: "tampa@example.com" },
    { dockId: "arlington-marina", email: "north@example.com" },
    { dockId: outside.id, email: "outside@example.com" },
    { dockId: "missing-dock", email: "ghost@example.com" },
    { dockId: "galveston-yacht-marina", email: "   " },
  ],
  docks,
  "galveston-bay",
);
assert.deepEqual(recipients, ["boater@example.com", "second@example.com"]);
assert.deepEqual(weeklyFuelRecipients(
  [{ dockId: "madeira-beach-municipal-marina", email: "tampa@example.com" }],
  docks,
  "tampa-bay",
), ["tampa@example.com"]);
assert.deepEqual(weeklyFuelRecipients(
  [{ dockId: "galveston-yacht-marina", email: "boater@example.com" }],
  docks,
  "northeast-florida",
), []);
assert.equal(galveston.html.includes("boater@example.com"), false);
assert.equal(galveston.text.includes("@"), false);

const links = weeklyFuelPreviewLinks("galveston-bay");
assert.deepEqual(
  links.map((link) => link.href),
  ["/review/fuel/galveston-bay", "/review/fuel/tampa-bay", "/review/fuel/northeast-florida"],
);
assert.equal(links[0]?.current, true);
assert.equal(links[1]?.title, "Tampa Bay");

const gateHtml = renderToStaticMarkup(
  createElement(WeeklyFuelPreview, { authed: false, slug: "galveston-bay", error: "Wrong password." }),
);
assert.match(gateHtml, new RegExp(WEEKLY_FUEL_PREVIEW_TITLE));
assert.match(gateHtml, new RegExp(WEEKLY_FUEL_PREVIEW_GATE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(gateHtml, /Wrong password\./);
assert.match(gateHtml, /type="password"/);
assert.match(gateHtml, /name="slug" value="galveston-bay"/);
assert.doesNotMatch(gateHtml, /\$4\.83|Galveston Yacht Marina|api\.resend\.com|sendMail/);

const previewHtml = renderToStaticMarkup(
  createElement(WeeklyFuelPreview, {
    authed: true,
    mail: galveston,
    links,
  }),
);
assert.match(previewHtml, new RegExp(WEEKLY_FUEL_PREVIEW_NOTE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(previewHtml, /Cheapest posted fuel, Galveston Bay \/ Clear Lake/);
assert.match(previewHtml, /srcDoc=|srcdoc=/);
assert.match(previewHtml, /\$4\.83/);
assert.match(previewHtml, /https:\/\/www\.dockposted\.com\/docks\/galveston-yacht-marina/);
assert.match(previewHtml, /\/area\/galveston-bay/);
assert.match(previewHtml, /unsubscribe_url/);
assert.match(previewHtml, /Plain text/);
assert.doesNotMatch(previewHtml, /<script>alert\(1\)<\/script>|api\.resend\.com|sendMail/);

const mailFiles = [
  "src/lib/weekly-fuel.ts",
  "src/components/weekly-fuel-preview.tsx",
  "src/components/weekly-fuel-frame.tsx",
  "src/app/review/fuel/actions.ts",
  "src/app/review/fuel/[slug]/page.tsx",
];
for (const file of mailFiles) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, SEND, file);
  assert.doesNotMatch(text, LEAK, file);
  assert.doesNotMatch(text, /cron|schedule/i, file);
}
const pageSource = readFileSync(path.join(process.cwd(), "src/app/review/fuel/[slug]/page.tsx"), "utf8");
assert.match(pageSource, /reviewPasswordConfigured\(\)/);
assert.match(pageSource, /notFound\(\)/);
assert.match(pageSource, /buildWeeklyFuelMail/);
assert.doesNotMatch(pageSource, /readWeeklyFuelRecipients/);
const actionSource = readFileSync(path.join(process.cwd(), "src/app/review/fuel/actions.ts"), "utf8");
assert.match(actionSource, /reviewPasswordConfigured\(\)/);
assert.match(actionSource, /notFound\(\)/);
assert.match(actionSource, /REVIEW_COOKIE/);
const vercel = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")) as {
  crons: Array<{ path: string }>;
};
assert.deepEqual(
  vercel.crons.map((cron) => cron.path).sort(),
  ["/api/cron/desk", "/api/cron/watch"],
);
for (const file of ["src/components/site-header.tsx", "src/components/site-footer.tsx", "src/app/wholesale/page.tsx"]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.equal(text.includes("review/fuel"), false, file);
  assert.equal(text.includes("Cheapest posted fuel"), false, file);
  assert.doesNotMatch(text, /weekly-fuel/);
}
const robotsSource = readFileSync(path.join(process.cwd(), "src/app/robots.ts"), "utf8");
assert.match(robotsSource, /\/review/);
const sitemapSource = readFileSync(path.join(process.cwd(), "src/app/sitemap.ts"), "utf8");
assert.doesNotMatch(sitemapSource, /\/review/);

const previousReviewPassword = process.env.REVIEW_PASSWORD;
const previousResend = process.env.RESEND_API_KEY;
const previousBlob = process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.REVIEW_PASSWORD;
delete process.env.BLOB_READ_WRITE_TOKEN;
process.env.RESEND_API_KEY = "re_test_do_not_send";

const sendCalls: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  sendCalls.push(`${init?.method ?? "GET"} ${url}`);
  return new Response("blocked", { status: 599 });
};

async function expectNotFound(run: () => Promise<unknown>): Promise<void> {
  let caught: unknown;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  assert.equal(isNotFound(caught), true);
}

async function runSendProof() {
  buildWeeklyFuelMails(docks, readOn);
  buildWeeklyFuelMail([...docks, leaked, guide, boater, rawUser, nasty], "galveston-bay", readOn);
  weeklyFuelRecipients(
    [{ dockId: "galveston-yacht-marina", email: "boater@example.com" }],
    docks,
    "galveston-bay",
  );
  renderToStaticMarkup(
    createElement(WeeklyFuelPreview, { authed: true, mail: galveston, links }),
  );
  renderToStaticMarkup(
    createElement(WeeklyFuelPreview, { authed: false, slug: "tampa-bay" }),
  );

  await expectNotFound(() =>
    WeeklyFuelPreviewPage({
      params: Promise.resolve({ slug: "galveston-bay" }),
      searchParams: Promise.resolve({}),
    }),
  );

  process.env.REVIEW_PASSWORD = "preview-only";
  await expectNotFound(() =>
    WeeklyFuelPreviewPage({
      params: Promise.resolve({ slug: "not-an-area" }),
      searchParams: Promise.resolve({}),
    }),
  );
  delete process.env.REVIEW_PASSWORD;

  process.env.DATA_DIR = await new Promise<string>((resolve, reject) => {
    mkdtemp(path.join(tmpdir(), "dock-posted-weekly-"), (error, dir) => {
      if (error) reject(error);
      else resolve(dir);
    });
  });
  await writeReviewFile({
    submissions: [],
    alerts: [
      {
        id: "a1",
        dockId: "galveston-yacht-marina",
        email: "Boater@Example.com",
        consent: "Yes. Keep my email and tell me when this dock's price changes.",
        createdAt: "2026-10-07T12:00:00.000Z",
      },
      {
        id: "a2",
        dockId: "madeira-beach-municipal-marina",
        email: "tampa@example.com",
        consent: "Yes. Keep my email and tell me when this dock's price changes.",
        createdAt: "2026-10-07T12:00:00.000Z",
      },
    ],
  });
  await new Promise<void>((resolve, reject) => {
    writeFile(
      path.join(process.env.DATA_DIR ?? "", "income.json"),
      JSON.stringify({ pins: [{ email: "pin-only@example.com" }], watches: [{ email: "watch-only@example.com" }] }),
      (error) => (error ? reject(error) : resolve()),
    );
  });
  assert.deepEqual(await readWeeklyFuelRecipients("galveston-bay"), ["boater@example.com"]);
  assert.deepEqual(await readWeeklyFuelRecipients("tampa-bay"), ["tampa@example.com"]);
  assert.deepEqual(await readWeeklyFuelRecipients("northeast-florida"), []);
  const listed = (await readWeeklyFuelRecipients("galveston-bay")).join(",");
  assert.equal(listed.includes("pin-only@example.com"), false);
  assert.equal(listed.includes("watch-only@example.com"), false);
  assert.equal(listed.includes("tampa@example.com"), false);

  const entries = await sitemap();
  assert.equal(entries.some((entry) => entry.url.includes("/review")), false);

  assert.deepEqual(sendCalls, [], "no send call");
}

runSendProof()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    globalThis.fetch = originalFetch;
    if (previousReviewPassword) process.env.REVIEW_PASSWORD = previousReviewPassword;
    else delete process.env.REVIEW_PASSWORD;
    if (previousResend) process.env.RESEND_API_KEY = previousResend;
    else delete process.env.RESEND_API_KEY;
    if (previousBlob) process.env.BLOB_READ_WRITE_TOKEN = previousBlob;
    else delete process.env.BLOB_READ_WRITE_TOKEN;
  });
