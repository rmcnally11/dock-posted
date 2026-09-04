import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { deskCallFromDock, isDeskCandidate, pickDeskDocks } from "../src/lib/desk";
import {
  parsePinInput,
  parseWatchInput,
  PIN_PRICE_LABEL,
  pinPitch,
  runWatchHref,
  WATCH_PRICE_LABEL,
  waterLabel,
  weekOfIso,
} from "../src/lib/income";
import {
  applyCheckoutLineItem,
  catalogPriceId,
  checkoutCustomerEmail,
  parseCheckoutRef,
  STRIPE_PIN_LOOKUP_KEY,
  STRIPE_PIN_PRICE_ID,
  STRIPE_WATCH_LOOKUP_KEY,
  STRIPE_WATCH_PRICE_ID,
} from "../src/lib/pay";
import {
  escapeHtml,
  pinThankYouMail,
  PIN_THANK_YOU_SUBJECT,
  thankYouRecipient,
  watchThankYouMail,
  WATCH_THANK_YOU_SUBJECT,
} from "../src/lib/thank-you";
import { briefCoastFor, briefCoastsForWatch } from "../src/lib/airtable-desk";
import { conditionsMailLine } from "../src/lib/sister";
import { runRows, tankDollars, tankGallons } from "../src/lib/run-card";
import type { Dock } from "../src/lib/types";
import seed from "../data/docks.seed.json";

const docks = seed.docks as Dock[];

assert.equal(tankGallons({ gallons: 40, gph: null, hours: null }), 40);
assert.equal(tankGallons({ gallons: null, gph: 12, hours: 3 }), 36);
assert.equal(tankGallons({ gallons: null, gph: 12, hours: null }), null);
assert.equal(tankDollars(40, 5.28), 211.2);
assert.equal(PIN_PRICE_LABEL, "$299 a season");
assert.equal(WATCH_PRICE_LABEL, "$29 a year");
assert.equal(waterLabel("galveston-bay", null), "Galveston Bay / Clear Lake");
assert.match(weekOfIso(new Date("2026-08-31T12:00:00Z")), /^2026-08-31$/);

const posted = docks.find((dock) => dock.id === "galveston-yacht-marina");
assert.ok(posted);
const rows = runRows([posted], 40);
assert.equal(rows[0]?.dieselLabel.startsWith("$"), true);
assert.equal(rows[0]?.tankDieselLabel.startsWith("$"), true);

const callDock = docks.find((dock) => dock.id === "marina-bay-harbor");
assert.ok(callDock);
const callRows = runRows([callDock], 40);
assert.equal(callRows[0]?.gasLabel, "—");
assert.equal(callRows[0]?.tankGasLabel, "—");

const badPin = parsePinInput({
  dockId: "",
  contactName: "Pat",
  email: "pat@example.com",
  phone: "281-555-0100",
  role: "dock",
  note: "",
});
assert.equal(badPin.ok, false);

const okPin = parsePinInput({
  dockId: "marina-bay-harbor",
  contactName: "Pat",
  email: "pat@example.com",
  phone: "281-555-0100",
  role: "fuel dock",
  note: "",
});
assert.equal(okPin.ok, true);

const badWatch = parseWatchInput({
  email: "nope",
  name: "Pat",
  corridor: "galveston-bay",
  region: "",
  gallons: "40",
});
assert.equal(badWatch.ok, false);

const okWatch = parseWatchInput({
  email: "pat@example.com",
  name: "Pat",
  corridor: "galveston-bay",
  region: "",
  gallons: "40",
});
assert.equal(okWatch.ok, true);
if (okWatch.ok) {
  assert.equal(okWatch.value.corridor, "galveston-bay");
  assert.equal(okWatch.value.gallons, 40);
}

assert.equal(isDeskCandidate(callDock, []), true);
assert.equal(isDeskCandidate(posted, []), false);
assert.equal(isDeskCandidate(callDock, [{
  id: "x",
  dockId: callDock.id,
  dockName: callDock.name,
  contactName: "Pat",
  email: "pat@example.com",
  phone: "281-555-0100",
  role: "dock",
  status: "paid",
  createdAt: new Date().toISOString(),
  paidAt: new Date().toISOString(),
  lastContactedAt: null,
  note: null,
}]), false);

const picked = pickDeskDocks(docks, [], []);
assert.ok(picked.length > 0 && picked.length <= 8);
assert.ok(picked.every((dock) => dock.phone && dock.access === "public"));
assert.ok(picked.some((dock) => dock.corridor === "galveston-bay" || dock.corridor === "upper-keys"));
const first = picked[0];
assert.ok(first);
const drafted = deskCallFromDock(first, new Date("2026-08-31T12:00:00Z"));
assert.equal(drafted.status, "queued");
assert.equal(drafted.weekOf, "2026-08-31");

const pitch = pinPitch("Marina Bay Harbor");
assert.match(pitch, /\$299 a season/);
assert.doesNotMatch(pitch, /cheapest|savings|bargain/i);

assert.deepEqual(parseCheckoutRef("pin:abc"), { kind: "pin", recordId: "abc" });
assert.equal(parseCheckoutRef("nope"), null);
assert.equal(STRIPE_PIN_LOOKUP_KEY, "dock_posted_pin_season");
assert.equal(STRIPE_WATCH_LOOKUP_KEY, "dock_posted_watch_year");
assert.equal(STRIPE_PIN_PRICE_ID, "price_1UAg3MGW7cXXvgqvz72XMgTu");
assert.equal(STRIPE_WATCH_PRICE_ID, "price_1UAg63GW7cXXvgqvvlOgWIa4");

const pinPriceWas = process.env.STRIPE_PRICE_PIN;
const watchPriceWas = process.env.STRIPE_PRICE_WATCH;
delete process.env.STRIPE_PRICE_PIN;
delete process.env.STRIPE_PRICE_WATCH;
assert.equal(catalogPriceId("pin"), null);
assert.equal(catalogPriceId("watch"), null);
const pinInline = new URLSearchParams();
assert.equal(applyCheckoutLineItem(pinInline, "pin", "Marina Bay Harbor"), "price_data");
assert.equal(pinInline.get("line_items[0][price]"), null);
assert.equal(pinInline.get("line_items[0][price_data][unit_amount]"), "29900");
assert.equal(pinInline.get("line_items[0][price_data][product_data][name]"), "Dock Posted pin · one season");
const watchInline = new URLSearchParams();
assert.equal(applyCheckoutLineItem(watchInline, "watch", "Galveston Bay / Clear Lake"), "price_data");
assert.equal(watchInline.get("line_items[0][price]"), null);
assert.equal(watchInline.get("line_items[0][price_data][unit_amount]"), "2900");
process.env.STRIPE_PRICE_PIN = STRIPE_PIN_PRICE_ID;
process.env.STRIPE_PRICE_WATCH = STRIPE_WATCH_PRICE_ID;
assert.equal(catalogPriceId("pin"), STRIPE_PIN_PRICE_ID);
const pinCatalog = new URLSearchParams();
assert.equal(applyCheckoutLineItem(pinCatalog, "pin", "Marina Bay Harbor"), "price");
assert.equal(pinCatalog.get("line_items[0][price]"), STRIPE_PIN_PRICE_ID);
assert.equal(pinCatalog.get("line_items[0][price_data][unit_amount]"), null);
const watchCatalog = new URLSearchParams();
assert.equal(applyCheckoutLineItem(watchCatalog, "watch", "Galveston Bay / Clear Lake"), "price");
assert.equal(watchCatalog.get("line_items[0][price]"), STRIPE_WATCH_PRICE_ID);
assert.equal(watchCatalog.get("line_items[0][price_data][unit_amount]"), null);
if (pinPriceWas === undefined) delete process.env.STRIPE_PRICE_PIN;
else process.env.STRIPE_PRICE_PIN = pinPriceWas;
if (watchPriceWas === undefined) delete process.env.STRIPE_PRICE_WATCH;
else process.env.STRIPE_PRICE_WATCH = watchPriceWas;

const readme = readFileSync(path.join(process.cwd(), "README.md"), "utf8");
assert.match(readme, /STRIPE_PRICE_PIN/);
assert.match(readme, /STRIPE_PRICE_WATCH/);
assert.match(readme, /dock_posted_pin_season/);
assert.match(readme, /dock_posted_watch_year/);
assert.match(readme, /price_1UAg3MGW7cXXvgqvz72XMgTu/);
assert.match(readme, /price_1UAg63GW7cXXvgqvvlOgWIa4/);
assert.equal(checkoutCustomerEmail({ customer_email: "paid@example.com" }), "paid@example.com");
assert.equal(
  checkoutCustomerEmail({ customer_email: null, customer_details: { email: "details@example.com" } }),
  "details@example.com",
);
assert.equal(thankYouRecipient("dock@example.com", "card@example.com"), "dock@example.com");
assert.equal(thankYouRecipient("  ", "card@example.com"), "card@example.com");
assert.equal(thankYouRecipient("", null), null);

const pinMail = pinThankYouMail(
  { dockId: "marina-bay-harbor", dockName: "Marina Bay Harbor" },
  "https://dockposted.com",
);
assert.equal(pinMail.subject, PIN_THANK_YOU_SUBJECT);
assert.equal(pinMail.subject, "This dock is yours");
assert.match(pinMail.text, /Marina Bay Harbor/);
assert.match(pinMail.text, /\$299 a season/);
assert.match(pinMail.text, /You write the number/);
assert.match(pinMail.text, /https:\/\/dockposted\.com\/report\?dock=marina-bay-harbor&who=marina/);
assert.match(pinMail.text, /https:\/\/dockposted\.com\/docks\/marina-bay-harbor/);
assert.doesNotMatch(pinMail.text, /dock-posted\.vercel\.app/);
assert.doesNotMatch(pinMail.text, /users|the product working|sell a gallon of|SMS/i);
assert.match(pinMail.html, /lang="en"/);
assert.match(pinMail.html, /dir="ltr"/);
assert.match(pinMail.html, /<title>This dock is yours<\/title>/);
assert.match(pinMail.html, /role="presentation"/);
assert.match(pinMail.html, /#0b1f33/);
assert.match(pinMail.html, /#2f8fd6/);
assert.match(pinMail.html, /#e23b3b/);
assert.match(pinMail.html, /#fbf8f3/);
assert.match(pinMail.html, /brand\/stripe-icon\.png/);
assert.match(pinMail.html, /Put a number on the hose/);
assert.match(pinMail.html, /See Marina Bay Harbor/);

const nasty = pinThankYouMail(
  { dockId: "x", dockName: `Dock <script>alert(1)</script>` },
  "https://dockposted.com",
);
assert.match(nasty.html, /Dock &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(nasty.html, /<script>alert\(1\)<\/script>/);
assert.equal(escapeHtml(`a&b<"c">`), "a&amp;b&lt;&quot;c&quot;&gt;");

const watchMail = watchThankYouMail({ corridor: "galveston-bay", region: null }, "https://dockposted.com");
assert.equal(watchMail.subject, WATCH_THANK_YOU_SUBJECT);
assert.match(watchMail.subject, /watch that water/i);
assert.match(watchMail.text, /Galveston Bay \/ Clear Lake/);
assert.match(watchMail.text, /\$29 a year/);
assert.match(watchMail.text, /we write you/i);
assert.match(watchMail.text, /Not a text/);
assert.match(watchMail.text, /https:\/\/dockposted\.com\/run/);
assert.doesNotMatch(watchMail.text, /dock-posted\.vercel\.app/);
assert.doesNotMatch(watchMail.text, /users|the product working|SMS/i);
const defaultPinMail = pinThankYouMail({ dockId: "marina-bay-harbor", dockName: "Marina Bay Harbor" });
assert.match(defaultPinMail.text, /dockposted\.com/);
assert.doesNotMatch(defaultPinMail.text, /dock-posted\.vercel\.app/);
assert.match(watchMail.html, /<title>We’ll watch that water<\/title>/);
assert.match(watchMail.html, /See this trip/);
assert.match(watchMail.html, /#0b1f33/);
assert.match(watchMail.html, /brand\/stripe-icon\.png/);

const webhookSrc = readFileSync(path.join(process.cwd(), "src/app/api/pay/webhook/route.ts"), "utf8");
assert.match(webhookSrc, /sendPinPaidThankYou/);
assert.match(webhookSrc, /sendWatchPaidThankYou/);
assert.match(webhookSrc, /newlyPaid/);
assert.match(webhookSrc, /checkoutCustomerEmail/);
assert.doesNotMatch(webhookSrc, /notifyEmail/);

const notifySrc = readFileSync(path.join(process.cwd(), "src/lib/notify.ts"), "utf8");
assert.match(notifySrc, /html\?: string/);
assert.match(notifySrc, /Idempotency-Key/);

const pinAction = readFileSync(path.join(process.cwd(), "src/app/pin/actions.ts"), "utf8");
assert.match(pinAction, /to: notifyEmail\(\)/);
const runAction = readFileSync(path.join(process.cwd(), "src/app/run/actions.ts"), "utf8");
assert.match(runAction, /to: notifyEmail\(\)/);
assert.equal(runWatchHref({ corridor: "galveston-bay", gallons: 40 }), "/run?corridor=galveston-bay&gallons=40");
assert.equal(
  runWatchHref({ corridor: "galveston-bay", gallons: 40, watched: true }),
  "/run?corridor=galveston-bay&gallons=40&watched=1",
);
assert.equal(runWatchHref({ region: "keys" }), "/run?region=keys");
assert.equal(runWatchHref({}), "/run");

const fence = /cheapest|bargain|savings pitch|on this water|instrument family|field letter|wind is the tide/i;
for (const file of [
  "src/app/pin/page.tsx",
  "src/app/run/page.tsx",
  "src/app/how/page.tsx",
  "src/components/how-it-works.tsx",
  "src/lib/income.ts",
  "src/lib/run-card.ts",
  "src/lib/desk.ts",
]) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  assert.doesNotMatch(text, fence, `${file} leaked a bargain or sister-product term`);
}

const pinPage = readFileSync(path.join(process.cwd(), "src/app/pin/page.tsx"), "utf8");
assert.match(pinPage, /This is your dock/);
assert.match(pinPage, /PIN_PRICE_LABEL/);
assert.match(pinPage, /How your dock works/);
assert.doesNotMatch(pinPage, /stripe/i);

const runPage = readFileSync(path.join(process.cwd(), "src/app/run/page.tsx"), "utf8");
assert.match(runPage, /Before you leave/);
assert.match(runPage, /Charter or trailer/);
assert.match(runPage, /If the sticker says 15% ethanol/);
assert.match(runPage, /How this trip works/);

const howPage = readFileSync(path.join(process.cwd(), "src/app/how/page.tsx"), "utf8");
assert.match(howPage, /How it works/);
assert.match(howPage, /Your dock/);
assert.match(howPage, /This trip/);
assert.match(howPage, /Yard seats/);
assert.match(howPage, /PIN_WALK/);
assert.match(howPage, /RUN_WALK/);
assert.match(howPage, /STORM_WALK/);

const walks = readFileSync(path.join(process.cwd(), "src/components/how-it-works.tsx"), "utf8");
assert.match(walks, /File the boat/);
assert.match(walks, /Two yards that fit/);
assert.match(walks, /When they name it, we tell you what.s left/);
assert.match(walks, /You call the yard\. We don.t pull her\./);

const haulPage = readFileSync(path.join(process.cwd(), "src/app/haul-out/page.tsx"), "utf8");
assert.match(haulPage, /STORM_WALK/);
assert.match(haulPage, /The four steps/);
assert.doesNotMatch(haulPage, /heading="How it works"/);

const footer = readFileSync(path.join(process.cwd(), "src/components/site-footer.tsx"), "utf8");
assert.match(footer, /href="\/pin"/);
assert.match(footer, /href="\/run"/);
assert.match(footer, /href="\/how"/);
assert.match(footer, /Waterdog Fuel[\s\S]*Your dock[\s\S]*This trip/);
assert.match(footer, /On This Water/);
assert.match(footer, /sisterHomeHref/);

assert.equal(briefCoastFor({ corridor: "galveston-bay", region: null } as never), "galveston");
assert.deepEqual(
  briefCoastsForWatch({ corridor: null, region: "keys" } as never),
  ["key-largo", "islamorada", "florida-bay", "marathon", "key-west"],
);
assert.match(conditionsMailLine({ corridor: "galveston-bay" }), /area=galveston/);
assert.match(runPage, /SisterHandoff/);

const dockPage = readFileSync(path.join(process.cwd(), "src/app/docks/[id]/page.tsx"), "utf8");
assert.match(dockPage, /data-testid="own-this-pin"/);
assert.match(dockPage, /data-testid="this-water"/);
assert.match(dockPage, /runWatchHref/);
assert.match(dockPage, /SisterHandoff/);

const board = readFileSync(path.join(process.cwd(), "src/components/dock-board.tsx"), "utf8");
assert.match(board, /data-testid="board-run"/);

const home = readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8");
assert.doesNotMatch(home, /stripe|waitlist|email capture|newsletter/i);

console.log("income tests passed");
