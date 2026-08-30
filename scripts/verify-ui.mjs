import puppeteer from "puppeteer-core";

const base = process.env.APP_URL ?? "http://127.0.0.1:43123";
const chrome = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "shell",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
});

const page = await browser.newPage();
page.setDefaultTimeout(20000);
const failures = [];

function check(name, ok, detail = "") {
  if (ok) console.log(`ok  ${name}`);
  else {
    console.error(`fail  ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
  }
}

try {
  await page.goto(base, { waitUntil: "networkidle0" });
  const homeTitle = await page.$eval("h1", (el) => el.textContent);
  check("all-water home", homeTitle?.includes("What the dock last posted"));

  await page.goto(`${base}/?corridor=galveston-bay`, { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-testid=corridor-heading]");

  const kicker = await page.$eval("[data-testid=hero-kicker]", (el) => el.textContent?.trim());
  const headline = await page.$eval("[data-testid=hero-headline]", (el) => el.textContent?.trim());
  const deck = await page.$eval("[data-testid=hero-deck]", (el) => el.textContent?.trim());
  const homeCopy = await page.$eval("body", (el) => el.textContent ?? "");
  check("copy lock kicker", kicker === "What the dock posted", kicker);
  check("copy lock headline", headline === "Sabine to Key West", headline);
  check(
    "copy lock deck",
    deck === "The last number they wrote on the board. If they did not post, it stays Call.",
    deck,
  );
  const tally = await page.$eval("[data-testid=board-tally]", (el) => el.textContent?.trim());
  check("count under deck", /posted this week/i.test(tally ?? "") && !deck?.includes("posted this week"));
  check("no invent compliance", !/never invent a price/i.test(homeCopy));

  const texasHeading = await page.$eval("[data-testid=corridor-heading]", (el) => el.textContent);
  check("texas heading", texasHeading?.includes("Galveston Bay"));

  await page.waitForSelector('img[src*="/api/tiles/"]');
  const tileCount = await page.$$eval('img[src*="/api/tiles/"]', (tiles) =>
    tiles.filter((img) => img.complete && img.naturalWidth > 0).length,
  );
  check("map tiles painted", tileCount > 0, `tiles=${tileCount}`);

  const attribution = await page.$eval("[data-testid=fuel-map]", (el) => el.textContent ?? "");
  check("no carto attribution", !/carto/i.test(attribution), attribution);

  const texasNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("clear lake 1 marina bay", texasNames[0] === "Marina Bay Harbor", texasNames[0]);
  check("clear lake 2 blue marlin", texasNames[1] === "Blue Marlin Fuel Dock", texasNames[1]);
  check(
    "clear lake 3 south shore",
    texasNames[2] === "South Shore Harbour Fuel Pier",
    texasNames[2],
  );
  check("island is not the poster", texasNames[0] !== "Galveston Yacht Marina");
  check("no kemah boardwalk", !texasNames.some((name) => name?.includes("Kemah Boardwalk")));

  check("no on this water", !/on this water/i.test(homeCopy));
  check("no instrument family", !/instrument family/i.test(homeCopy));
  check("no sister page", !/sister page/i.test(homeCopy));
  check("no corridors copy", !/\bcorridors\b/i.test(homeCopy));
  check("no platform insights", !/platform|insights|real-time/i.test(homeCopy));
  check("no compliance hero", !/does not sell gallons, broker fuel/i.test(homeCopy));
  check("no sine-wave costume", (await page.$$("svg")).length === 0 || !homeCopy.includes("sine"));
  check("no waterdog mark", !/waterdog/i.test(homeCopy));
  check("no rack desk", !/opis|argus|platts|cents-over-rack|jobber|\bRIN\b/i.test(homeCopy));
  check("call ahead empty", /call ahead/i.test(homeCopy));
  check("verified vs last seen", /verified|last seen/i.test(homeCopy));
  check("claim path", /claim this pin/i.test(homeCopy));
  check("no bargain", !/cheapest|savings|bargain/i.test(homeCopy));
  check("no slips pitch", !/wet-slip|coastal cavaliers|waterdog/i.test(homeCopy));

  await page.goto(`${base}/?corridor=upper-keys`, { waitUntil: "networkidle0" });
  const keysHeading = await page.$eval("[data-testid=corridor-heading]", (el) => el.textContent);
  const keysNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  const keysCopy = await page.$eval("main", (el) => el.textContent ?? "");
  check("keys heading", keysHeading?.includes("Key Largo"));
  check("keys list", keysNames.some((name) => name.includes("Key Largo Harbor")));
  check("keys marina del mar", keysNames.some((name) => name.includes("Marina Del Mar")));
  check("keys ocean reef", keysNames.some((name) => name.includes("Ocean Reef")));
  check("keys hides texas", !keysNames.some((name) => name.includes("Marina Bay Harbor")));
  check("keys islamorada caption", /islamorada is a different run/i.test(keysCopy));
  check("keys members honesty", /members only/i.test(keysCopy));

  await page.goto(`${base}/?state=TX`, { waitUntil: "networkidle0" });
  const texasState = await page.$eval("[data-testid=corridor-heading]", (el) => el.textContent);
  const texasStateNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("texas state heading", texasState?.includes("Texas"));
  check("texas state includes rockport", texasStateNames.some((name) => name?.includes("Cove Harbor")));
  check("texas state hides kemah", !texasStateNames.some((name) => name?.includes("Kemah Boardwalk")));

  await page.goto(`${base}/?q=key+largo`, { waitUntil: "networkidle0" });
  const searchNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("search key largo", searchNames.some((name) => name?.includes("Key Largo Harbor")));

  await page.goto(`${base}/?e0=1`, { waitUntil: "networkidle0" });
  const e0Count = await page.$eval("[data-testid=dock-count]", (el) => el.textContent);
  const e0Names = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("e0 count copy", e0Count?.startsWith("Showing"));
  check("e0 hides south shore", !e0Names.includes("South Shore Harbour Fuel Pier"));

  await page.goto(`${base}/?corridor=galveston-bay&fresh=1`, { waitUntil: "networkidle0" });
  const freshCount = await page.$eval("[data-testid=dock-count]", (el) => el.textContent);
  check("fresh count copy", freshCount?.startsWith("Showing"));

  await page.goto(`${base}/?corridor=galveston-bay&dock=galveston-yacht-marina`, { waitUntil: "networkidle0" });
  const selected = await page.$eval(
    "[data-testid=dock-card-galveston-yacht-marina]",
    (el) => el.getAttribute("aria-current") === "true",
  );
  check("selected card", selected);

  await page.goto(`${base}/report?dock=galveston-yacht-marina`, { waitUntil: "networkidle0" });
  const reporting = await page.$eval("[data-testid=reporting-for]", (el) => el.textContent);
  check("report marina label", reporting?.includes("Galveston Yacht Marina"));
  await page.type("#price", "5.280");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click("[data-testid=post-price]"),
  ]);
  const saved = await page.$("[data-testid=report-saved]");
  check("report saved banner", Boolean(saved));

  await page.goto(`${base}/safe-fuel`, { waitUntil: "networkidle0" });
  const safe = await page.$eval("main", (el) => el.textContent ?? "");
  check("safe fuel", /E15 is not for boats/i.test(safe));
  check("safe fuel is a warning", /walk away/i.test(safe) && !/save|deal|cheap/i.test(safe));
  check("safe fuel no waterdog", !/waterdog|opis|argus|platts|invoice/i.test(safe));
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  console.error(error);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nui checks passed");
