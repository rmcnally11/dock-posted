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
  await page.waitForSelector("[data-testid=corridor-heading]");

  const texasHeading = await page.$eval("[data-testid=corridor-heading]", (el) => el.textContent);
  check("texas heading", texasHeading?.includes("Galveston Bay"));

  await page.waitForFunction(() => {
    const map = document.querySelector("[data-testid=fuel-map]");
    return Boolean(map && map.querySelector("img.leaflet-tile"));
  });
  const tileCount = await page.$$eval("img.leaflet-tile", (tiles) => tiles.length);
  check("map tiles painted", tileCount > 0, `tiles=${tileCount}`);

  const texasNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("texas list", texasNames.some((name) => name.includes("Marina Bay Harbor")));

  await page.goto(`${base}/?corridor=upper-keys`, { waitUntil: "networkidle0" });
  const keysHeading = await page.$eval("[data-testid=corridor-heading]", (el) => el.textContent);
  const keysNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("keys heading", keysHeading?.includes("Key Largo"));
  check("keys list", keysNames.some((name) => name.includes("Key Largo Harbor")));
  check("keys hides texas", !keysNames.some((name) => name.includes("Marina Bay Harbor")));

  await page.goto(`${base}/?e0=1`, { waitUntil: "networkidle0" });
  const e0Count = await page.$eval("[data-testid=dock-count]", (el) => el.textContent);
  const e0Names = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("e0 count copy", e0Count?.startsWith("Showing"));
  check("e0 hides south shore", !e0Names.includes("South Shore Harbour Marina"));

  await page.goto(`${base}/?fresh=1`, { waitUntil: "networkidle0" });
  const freshCount = await page.$eval("[data-testid=dock-count]", (el) => el.textContent);
  check("fresh count copy", freshCount?.startsWith("Showing"));

  await page.goto(`${base}/?dock=galveston-yacht-marina`, { waitUntil: "networkidle0" });
  const selected = await page.$eval(
    "[data-testid=dock-card-galveston-yacht-marina]",
    (el) => el.getAttribute("aria-current") === "true",
  );
  check("selected card", selected);

  await page.goto(`${base}/report?dock=galveston-yacht-marina`, { waitUntil: "networkidle0" });
  await page.click("[data-testid=marina-galveston-yacht-marina]");
  const reporting = await page.$eval("[data-testid=reporting-for]", (el) => el.textContent);
  check("report marina label", reporting?.includes("Galveston Yacht Marina"));
  await page.click("#price");
  await page.type("#price", "5.280");
  const reportingAfter = await page.$eval("[data-testid=reporting-for]", (el) => el.textContent);
  check("report marina stays", reportingAfter?.includes("Galveston Yacht Marina"));
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid=report-saved]");
  check("report saved banner", true);

  await page.goto(`${base}/safe-fuel`, { waitUntil: "networkidle0" });
  const safe = await page.$eval("h1", (el) => el.textContent);
  check("safe fuel", /E15|boat|fuel/i.test(safe ?? ""));
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
