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

  const kicker = await page.$eval("[data-testid=hero-kicker]", (el) => el.textContent?.trim());
  const headline = await page.$eval("[data-testid=hero-headline]", (el) => el.textContent?.trim());
  const deck = await page.$eval("[data-testid=hero-deck]", (el) => el.textContent?.trim());
  const homeCopy = await page.$eval("body", (el) => el.textContent ?? "");
  check("hero kicker present", Boolean(kicker), kicker);
  check("hero headline present", Boolean(headline), headline);
  check("hero deck present", Boolean(deck), deck);
  const tally = await page.$eval("[data-testid=board-tally]", (el) => el.textContent?.trim());
  check("count under deck", /posted this week/i.test(tally ?? "") && !deck?.includes("posted this week"));
  check("week line still call", /\d+ posted this week\.\s+\d+ still Call\./.test(tally ?? ""), tally);
  check("no invent compliance", !/never invent a price/i.test(homeCopy));
  check(
    "no campaign nouns",
    !/the take|the book|open the book|come in|where the cents went|four doors|we publish the pin|we own the pin|fat cut lights up|call is the honest number/i.test(
      homeCopy,
    ),
  );

  const wordmark = await page.$eval("[data-testid=wordmark]", (el) => el.textContent?.trim());
  const headerCopy = await page.$eval("header", (el) => el.textContent ?? "");
  check("distinct wordmark", wordmark === "Dock Posted", wordmark);
  check("header is not a family lockup", !/what the dock posted/i.test(headerCopy), headerCopy);
  check("nav the board", /The board/.test(headerCopy));
  check("nav named storm", /Named storm/.test(headerCopy) && !/Haul-out/.test(headerCopy));
  check("nav post a number", /Post a number/.test(headerCopy));
  check("nav e15", /E15/.test(headerCopy));
  check("nav about after e15", /E15[\s\S]*About/.test(headerCopy) && !/Wholesale[\s\S]*About/.test(headerCopy));
  const whoWrites = await page.$eval("[data-testid=who-writes-this] a", (el) => ({
    text: el.textContent?.trim(),
    href: el.getAttribute("href"),
  }));
  check("who writes this", whoWrites.text === "Who writes this." && whoWrites.href === "/about", JSON.stringify(whoWrites));

  const cardFields = await page.$$eval(
    "[data-testid=dock-card-marina-bay-harbor] dt",
    (els) => els.map((el) => el.textContent?.trim()),
  );
  const firstCard = await page.$eval("[data-testid=dock-list] article", (el) => el.textContent ?? "");
  const dateLine = await page.$eval(
    "[data-testid=pin-trust-marina-bay-harbor]",
    (el) => el.textContent ?? "",
  );
  check("card regular", cardFields.includes("Regular"), cardFields.join(","));
  check("card diesel", cardFields.includes("Diesel"), cardFields.join(","));
  check("card blend", cardFields.includes("Blend"), cardFields.join(","));
  check("card hours", cardFields.includes("Hours"), cardFields.join(","));
  check("card date", dateLine.includes("Date"), dateLine);
  check("marina bay stays call", /Call/.test(firstCard));
  check(
    "marina bay hours as-is",
    /7:30am–5:30pm/.test(firstCard) && /store only, not the hose/.test(firstCard),
    firstCard.slice(0, 280),
  );

  const texasHeading = await page.$eval("[data-testid=corridor-heading]", (el) => el.textContent);
  check("texas heading", texasHeading?.includes("Galveston Bay"));

  await page.waitForSelector('img[src*="/api/tiles/"]');
  const tileCount = await page.$$eval('img[src*="/api/tiles/"]', (tiles) =>
    tiles.filter((img) => img.complete && img.naturalWidth > 0).length,
  );
  check("map tiles painted", tileCount > 0, `tiles=${tileCount}`);

  const attribution = await page.$eval("[data-testid=fuel-map]", (el) => el.textContent ?? "");
  check("no carto attribution", !/carto/i.test(attribution), attribution);
  check(
    "galveston bay frame",
    /29\.56N 95\.03W · z11 · © OpenStreetMap/.test(attribution),
    attribution,
  );
  const tileSrcs = await page.$$eval('img[src*="/api/tiles/"]', (tiles) =>
    tiles.map((img) => img.getAttribute("src") ?? ""),
  );
  check(
    "cache-bust tile url",
    tileSrcs.every((src) => /\/api\/tiles\/11\/\d+\/\d+\.png\?v=2$/.test(src)),
    tileSrcs[0],
  );
  check("no waller z10 grid", !tileSrcs.some((src) => /\/api\/tiles\/10\/239\//.test(src)));

  await page.goto(`${base}/?corridor=galveston-bay`, { waitUntil: "networkidle0" });
  const corridorMap = await page.$eval("[data-testid=fuel-map]", (el) => el.textContent ?? "");
  check(
    "corridor query same bay frame",
    /29\.56N 95\.03W · z11 · © OpenStreetMap/.test(corridorMap),
    corridorMap,
  );
  await page.goto(base, { waitUntil: "networkidle0" });

  const texasNames = await page.$$eval("[data-testid=dock-list] h3", (nodes) =>
    nodes.map((node) => node.textContent),
  );
  check("clear lake 1 marina bay", texasNames[0] === "Marina Bay Harbor", texasNames[0]);
  check("clear lake 2 blue marlin", texasNames[1] === "Blue Marlin Fuel Dock", texasNames[1]);
  const blueMarlinCard = await page.$eval(
    "[data-testid=dock-card-blue-marlin-seabrook]",
    (el) => el.textContent ?? "",
  );
  check("blue marlin hours call", /Hours\s*Call/.test(blueMarlinCard) || blueMarlinCard.includes("Call"), blueMarlinCard.slice(0, 200));
  check("blue marlin no live wg dollar", !/\$5\.990|\$4\.980|\$5\.280/.test(blueMarlinCard));
  check("blue marlin west of 146", /west of 146/i.test(blueMarlinCard));
  const sshCard = await page.$eval(
    "[data-testid=dock-card-south-shore-harbour]",
    (el) => el.textContent ?? "",
  );
  check("south shore no live wg dollar", !/\$5\.500|\$5\.000/.test(sshCard));
  check("south shore opens at 8", /8am–6pm/.test(sshCard));
  const lycCard = await page.$eval(
    "[data-testid=dock-card-lakewood-yacht-club]",
    (el) => el.textContent ?? "",
  );
  check("lakewood is members dock", /members. dock/i.test(lycCard));
  check(
    "clear lake 3 south shore",
    texasNames[2] === "South Shore Harbour Fuel Pier",
    texasNames[2],
  );
  check("island is not the poster", texasNames[0] !== "Galveston Yacht Marina");
  check("no kemah boardwalk", !texasNames.some((name) => name?.includes("Kemah Boardwalk")));

  check("no today nav", !/\bToday\b/.test(headerCopy), headerCopy);
  check("no last-posted hero", !/what the dock last posted/i.test(homeCopy));
  check("no on this water", !/on this water/i.test(homeCopy));
  check("no instrument family", !/instrument family/i.test(homeCopy));
  check("no sister page", !/sister page/i.test(homeCopy));
  check("no field letter", !/field letter|almanac|onthiswater/i.test(homeCopy));
  check("no hunt theater", !/wind is the tide|score ring|hunt line/i.test(homeCopy));
  check("no corridors copy", !/\bcorridors\b/i.test(homeCopy));
  check("no platform insights", !/platform|insights|real-time/i.test(homeCopy));
  check("no compliance hero", !/does not sell gallons, broker fuel/i.test(homeCopy));
  check("no sine-wave costume", (await page.$$("svg")).length === 0 || !homeCopy.includes("sine"));
  const dockListCopy = await page.$eval("[data-testid=dock-list]", (el) => el.textContent ?? "");
  const mapCopy = await page.$eval("[data-testid=fuel-map]", (el) => el.textContent ?? "");
  const footerCopy = await page.$eval("footer", (el) => el.textContent ?? "");
  const waterdogHref = await page.$eval("[data-testid=waterdog-credit] a", (el) => el.getAttribute("href"));
  check("pins have no waterdog", !/waterdog|coastal cavaliers|platts|nymex|\bTCN\b|\brack\b/i.test(dockListCopy));
  check("map has no waterdog", !/waterdog|platts|nymex|\bTCN\b|\brack\b/i.test(mapCopy));
  check("hero has no waterdog", !/waterdog|platts|nymex|\bTCN\b|\brack\b/i.test(`${kicker} ${headline} ${deck} ${tally}`));
  check("waterdog footer credit", /Waterdog Fuel\. Rack to dock\./.test(footerCopy), footerCopy);
  check("waterdog footer link", waterdogHref === "https://coastalcavaliers.com", waterdogHref);
  check("no invented waterdog domain", !/waterdogfuel\.com/i.test(homeCopy));
  check("no waterdog twitter", !/RJMtweets11/i.test(homeCopy));
  check("no rack desk", !/opis|argus|platts|cents-over-rack|jobber|\bRIN\b/i.test(homeCopy));
  check("board has no wholesale book", !/nymex|differential|\bTCN\b/i.test(`${kicker} ${headline} ${deck} ${tally} ${dockListCopy} ${mapCopy}`));
  check("board omits wholesale nav without password", !(await page.$("[data-testid=nav-wholesale]")));
  check("call the dock action", /call the dock/i.test(homeCopy));
  check("company footer", /if they didn.t post it, it.s Call/i.test(homeCopy));
  check("osm attribution in footer", /openstreetmap/i.test(homeCopy));
  check("no call ahead", !/call ahead/i.test(homeCopy));
  check("no tbd or unknown", !/\bTBD\b|\bunknown\b/i.test(homeCopy));
  check("verified vs last seen", /verified|last seen/i.test(homeCopy));
  check("claim path", /claim this pin/i.test(homeCopy));
  check("no bargain", !/cheapest|savings|bargain/i.test(homeCopy));
  check("no slips pitch", !/wet-slip|Holds Fast/i.test(homeCopy));

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
  check("keys first light e0", /e0 still pumping at first light/i.test(keysCopy));
  check("keys does not lump islamorada", !keysNames.some((name) => /islamarina|plantation yacht|bud.n.mary/i.test(name ?? "")));
  check("keys members honesty", /members. dock/i.test(keysCopy));

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
  const reportHero = await page.$eval("main h1", (el) => el.textContent?.trim());
  const reportHeader = await page.$eval("header", (el) => el.textContent ?? "");
  check("report is its own page", reportHero === "Post a number", reportHero);
  check("report header is not a family lockup", !/what the dock posted/i.test(reportHeader));
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
  check("safe fuel ethanol honesty", /ethanol is what the sticker says/i.test(safe));
  check(
    "safe fuel no campaign nouns",
    !/the take|the book|call is the honest number|we publish the pin/i.test(safe),
  );
  const safeSansFooter = await page.$eval("main", (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("footer").forEach((node) => node.remove());
    return clone.textContent ?? "";
  });
  check("safe fuel no waterdog on the warning", !/waterdog|opis|argus|platts|invoice/i.test(safeSansFooter));
  check("safe fuel no wholesale book", !/nymex|differential|\bTCN\b|jobber/i.test(safeSansFooter));
  check("safe fuel footer credit", /Waterdog Fuel\. Rack to dock\./.test(safe));

  await page.goto(`${base}/haul-out`, { waitUntil: "networkidle0" });
  const haulKicker = await page.$eval("[data-testid=haul-out-kicker]", (el) => el.textContent?.trim());
  const haulHeadline = await page.$eval("[data-testid=haul-out-headline]", (el) => el.textContent?.trim());
  const haulDeck = await page.$eval("[data-testid=haul-out-deck]", (el) => el.textContent?.trim());
  const haulCopy = await page.$eval("main", (el) => el.textContent ?? "");
  const haulHow = await page.$eval("[data-testid=how-it-works]", (el) => el.textContent ?? "");
  const haulHeader = await page.$eval("header", (el) => el.textContent ?? "");
  check("haul kicker", haulKicker === "Leftover seats", haulKicker);
  check("haul headline", haulHeadline === "Named storm", haulHeadline);
  check(
    "haul deck",
    /When they name it, you need a hole\. If the yard didn.t say what was left, it stays Call\./.test(
      haulDeck ?? "",
    ),
    haulDeck,
  );
  check("no four doors slogan", !/Four doors\. One cone\./.test(haulHow) && !/how it works/i.test(haulHow));
  check("door 01", /File the boat/.test(haulHow));
  check("door 02", /Two yards that fit/.test(haulHow));
  check("door 03", /When they name it, we text what.s left/.test(haulHow));
  check("door 04", /You call the yard\. We don.t lift her\./.test(haulHow));
  check("file the boat button", /File the boat/.test(haulCopy));
  check("no checkout", /No checkout on this page/.test(haulCopy));
  check("all leftover call", /All leftover seats are Call/.test(haulCopy));
  check("no kill word", !/\bKill\b/.test(haulCopy));
  check("five yards line", /Five yards still have not said what.s left/.test(haulCopy));
  check("yard post heading", /Yard: post what.s left/.test(haulCopy));
  check("we are not the yard", /We are not the yard/.test(haulCopy));
  check(
    "haul-out no campaign nouns",
    !/the take|the book|come in|where the cents went|four doors|a leftover seat, said out loud|call is the honest number/i.test(
      haulCopy,
    ),
  );
  check("no stripe", !/stripe/i.test(haulCopy));
  const haulSansFooter = await page.$eval("main", (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("footer").forEach((node) => node.remove());
    return clone.textContent ?? "";
  });
  check("haul-out no wholesale book", !/nymex|platts|\bRIN\b|waterdog|differential|\bTCN\b|\brack\b|jobber/i.test(haulSansFooter));
  check("haul-out footer credit", /Waterdog Fuel\. Rack to dock\./.test(haulCopy));
  check("haul-out header omits wholesale nav without password", !/wholesale/i.test(haulHeader));

  const reportCopy = await page.goto(`${base}/report`, { waitUntil: "networkidle0" }).then(async () =>
    page.$eval("main", (el) => el.textContent ?? ""),
  );
  check("report headline", /Post a number/.test(reportCopy) && /You were there\. What did they have up\./.test(reportCopy));
  check("report send it button", /Send it/.test(reportCopy) && !/submit a price/i.test(reportCopy));
  check(
    "report no campaign nouns",
    !/if you saw it, write it|the book|call is the honest number/i.test(reportCopy),
  );
  const reportSansFooter = await page.$eval("main", (el) => {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("footer").forEach((node) => node.remove());
    return clone.textContent ?? "";
  });
  check("report no wholesale book", !/nymex|platts|\bRIN\b|waterdog|differential|\bTCN\b|\brack\b|jobber/i.test(reportSansFooter));
  check("report footer credit", /Waterdog Fuel\. Rack to dock\./.test(reportCopy));

  await page.setViewport({ width: 375, height: 812 });
  await page.goto(`${base}/about`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-testid=about-headline]");
  const aboutHeadline = await page.$eval("[data-testid=about-headline]", (el) => el.textContent?.trim());
  const aboutDeck = await page.$eval("[data-testid=about-deck]", (el) => el.textContent?.trim());
  const aboutBody = await page.$eval("[data-testid=about-body]", (el) => el.textContent ?? "");
  const aboutCopy = await page.$eval("main", (el) => el.textContent ?? "");
  const aboutHeader = await page.$eval("header", (el) => el.textContent ?? "");
  const aboutOnX = await page.$eval("[data-testid=on-x]", (el) => el.textContent ?? "");
  const fallback = await page.$eval("[data-testid=on-x-fallback]", (el) => ({
    text: el.textContent ?? "",
    href: el.querySelector("a")?.getAttribute("href"),
  }));
  const reportLink = await page.$eval("[data-testid=about-body] a[href='/report']", (el) =>
    el.textContent?.trim(),
  );
  check("about headline", aboutHeadline === "About", aboutHeadline);
  check(
    "about deck",
    aboutDeck === "We write what they posted. If they didn’t, it’s Call.",
    aboutDeck,
  );
  check(
    "about dock board sentence",
    /Dock Posted is the number on the board at the fuel dock\. Sabine to Key West, then the rest of the saltwater coast\./.test(
      aboutBody,
    ),
    aboutBody.slice(0, 200),
  );
  check(
    "about no gallon no lift",
    /We don’t sell a gallon\. We don’t lift a boat\. A blank stays Call\./.test(aboutBody),
  );
  check(
    "about named storm",
    /Named storm is leftover seats in the shed or on the lot\. When they name it, you call the yard\./.test(
      aboutBody,
    ),
  );
  check(
    "about wholesale locked door",
    /Wholesale is what it cost and what they posted\. That’s a locked door\./.test(aboutBody),
  );
  check("about send the number", /If you were at the dock, send the number\./.test(aboutBody));
  check("about post a number link", reportLink === "Post a number", reportLink);
  check("about footer call", /if they didn.t post it, it.s Call/i.test(aboutCopy));
  check("about on x label", /On X/.test(aboutOnX) && !/Twitter feed/i.test(aboutOnX) && !/\bsocial\b/i.test(aboutOnX));
  check(
    "about x fallback",
    /Nothing on X yet\./.test(fallback.text) && fallback.href === "https://x.com/DockPosted",
    JSON.stringify(fallback),
  );
  check("about nav has about", /About/.test(aboutHeader));
  const waterdogBlock = await page.$eval("[data-testid=waterdog-fuel]", (el) => el.textContent ?? "");
  const waterdogMail = await page.$eval(
    "[data-testid=waterdog-fuel] a[href='mailto:orders@coastalcavaliers.com']",
    (el) => el.textContent?.trim(),
  );
  check("about waterdog heading", /^Waterdog Fuel/.test(waterdogBlock.trim()), waterdogBlock.slice(0, 80));
  check(
    "about waterdog body",
    /Waterdog Fuel brings the gallon from the Houston rack to the first-water dock\. Clear Lake, Kemah, Seabrook\. Opens 2027\. Not selling gallons yet\./.test(
      waterdogBlock,
    ),
    waterdogBlock,
  );
  check("about waterdog mail", waterdogMail === "orders@coastalcavaliers.com", waterdogMail);
  check(
    "about waterdog hose",
    /Rack to dock\. Same family as this board\. They do not set the number on the hose\./.test(
      waterdogBlock,
    ),
  );
  check("about no campaign nouns", !/the take|the book|come in|four doors|we publish the pin|Holds Fast/i.test(aboutCopy));
  check("about no wholesale book", !/nymex|platts|differential|\bTCN\b|jobber|opis/i.test(aboutCopy));
  check("about no invented tweets", !/RJMtweets11|goodpiratesalma/i.test(aboutCopy));
  check("about no invented domain", !/waterdogfuel\.com/i.test(aboutCopy));
  check("about footer credit", /Waterdog Fuel\. Rack to dock\./.test(aboutCopy));
  const headerOverflow = await page.$eval("header", (el) => el.scrollWidth > el.clientWidth + 1);
  const aboutNavBox = await page.$eval("[data-testid=nav-about]", (el) => {
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height, top: r.top };
  });
  check("header does not overflow at 375", !headerOverflow);
  check("about nav readable at 375", aboutNavBox.width > 20 && aboutNavBox.height > 10, JSON.stringify(aboutNavBox));
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
