import type { Dock, Product } from "./types";
import type { PlattsAssessmentKey, PlattsDailyRow } from "./platts-daily";

type Cents = number | null;

export type PlattsSpotKey = PlattsAssessmentKey;
export type DerivedLegBlank = "not sourced" | "not typed" | "Platts row unavailable";
export type DerivedLegDisposition = "add" | "embedded" | "not_on_path" | "typed_input";
export type DerivedLegKey =
  | "spot"
  | "marinePipelineFreight"
  | "terminalThroughput"
  | "truckFreight"
  | "federalTax"
  | "stateTax"
  | "localTax"
  | "invoice"
  | "rack";

export interface DerivedLeg {
  key: DerivedLegKey;
  label: string;
  /** A blank leg is null. Zero is only a sourced rate, never a stand-in for missing. */
  cents: number | null;
  blank: DerivedLegBlank | null;
  disposition: DerivedLegDisposition;
  sourceUrl: string | null;
  asOf: string | null;
  sourceTitle: string | null;
  note: string;
}

export interface DieselTaxFlag {
  estimateUsed: "undyed-clear";
  headline: string;
  notApplied: string;
  sources: Array<{ title: string; url: string; asOf: string }>;
}

export interface DerivedProductEstimate {
  label: "DERIVED ESTIMATE";
  dockId: string;
  product: Product;
  productLabel: string;
  spotKey: PlattsSpotKey;
  approximate: boolean;
  matchNote: string;
  legs: DerivedLeg[];
  gaps: string[];
  dapCents: number | null;
  dapComplete: boolean;
  postedPumpCents: number | null;
  postedPumpNote: string;
  impliedMarginCents: number | null;
  fatTakeCents: number | null;
  fatTakeStatus: "typed" | "NO CALL";
  dieselFlag: DieselTaxFlag | null;
}

export interface DerivedDockEstimate {
  dockId: string;
  dockName: string;
  gaps: string[];
  products: DerivedProductEstimate[];
}

export interface DerivedLandedCostBook {
  label: "DERIVED ESTIMATE";
  dateKey: string | null;
  stale: boolean;
  rowSource: "airtable" | "unavailable";
  rowNote: string;
  outrightFlag: boolean;
  docks: DerivedDockEstimate[];
}

export interface DerivedTypedInputs {
  RB: { invoiceCents: Cents; rackCents: Cents };
  HO: { invoiceCents: Cents; rackCents: Cents };
}

export interface DerivedLandedCostInput {
  docks: Dock[];
  row: PlattsDailyRow | null;
  typed: DerivedTypedInputs;
  todayKey: string;
  stale: boolean;
  rowSource: "airtable" | "unavailable";
  rowNote: string;
}

const IRS_P510 = {
  title: "IRS Publication 510 (Rev. December 2025)",
  url: "https://www.irs.gov/publications/p510",
  asOf: "2025-12",
};

const FL_CHART = {
  title: "Florida DOR 2026 fuel tax chart (TIP 25B05-05)",
  url: "https://floridarevenue.com/taxes/Documents/fuel_charts/25B05-05_chart.pdf",
  asOf: "2026-01-01",
};

const COLONIAL = {
  title: "Colonial Pipeline asset map",
  url: "https://www.colpipe.com/about-us/asset-map/",
  asOf: "2026-10-06",
};

const TAMPA_METHOD = {
  title: "S&P Global Platts Americas refined oil products methodology — Florida waterborne CBOB",
  url: "https://www.spglobal.com/commodityinsights/PlattsContent/_assets/_files/en/our-methodology/methodology-specifications/americas-refined-oil-products-methodology.pdf",
  asOf: "2026-10-06",
};

const TX_GAS = {
  title: "Texas Comptroller gasoline tax (Tax Code §162.102)",
  url: "https://comptroller.texas.gov/taxes/fuels/gasoline.php",
  asOf: "2026-10-06",
};

const TX_DIESEL = {
  title: "Texas Comptroller diesel fuel tax (Tax Code §162.202)",
  url: "https://comptroller.texas.gov/taxes/fuels/diesel.php",
  asOf: "2026-10-06",
};

const TX_LOCAL = {
  title: "Texas A&M Transportation Policy Research — local option motor fuels tax",
  url: "https://policy.tti.tamu.edu/strategy/local-option-motor-fuels-tax/",
  asOf: "2026-10-06",
};

const POSTED_PUMP_NOTE =
  "Posted pump tax is unknown (taxIncluded is null). Implied margin is posted pump minus derived DAP only when DAP is complete. DERIVED ESTIMATE. Not an invoice, not a rack, and not a buy signal.";

const DIESEL_FLAG: DieselTaxFlag = {
  estimateUsed: "undyed-clear",
  headline:
    "Diesel tax flag: this estimate uses the undyed (clear) rate. The posted pump does not say dyed or clear. The choice is flagged here and is not a silent pick.",
  notApplied:
    "Not applied: dyed diesel at the federal LUST-only $0.001/gal (IRS Pub 510); the IRS ultimate-purchaser credit for undyed diesel used in boats (Publication 510 type of use 8 — that credit is not deducted from the posted pump); Florida’s dyed-diesel allowance for a noncommercial vessel (s. 206.874(3)(m)); and any Texas off-highway exemption. The Comptroller diesel page says dyed diesel used on the highway still owes $0.20 (Tax Code §162.203). Commercial and off-highway exemptions are not applied.",
  sources: [
    IRS_P510,
    {
      title: "Florida Statutes §206.874 (2026) — dyed diesel exemptions, including noncommercial vessels",
      url: "https://www.flsenate.gov/Laws/Statutes/2026/206.874",
      asOf: "2026",
    },
    TX_DIESEL,
    FL_CHART,
  ],
};

type FuelKind = "gasoline" | "diesel";
type FreightMode = "truck-only" | "tampa-ddp" | "jones-act";

interface LinePlan {
  product: Product;
  productLabel: string;
  spotKey: PlattsSpotKey;
  approximate: boolean;
  matchNote: string;
  freight: FreightMode;
  fuel: FuelKind;
}

interface DockPlan {
  dockId: string;
  county: string;
  state: "TX" | "FL";
  lines: LinePlan[];
}

/**
 * West Florida premium grades use TPA_PRE_Out. Other West Florida gasoline uses
 * TPA_CBOB_Out. West Florida diesel uses TPA_ULSD_Out. None of the four docks
 * posts a premium grade in West Florida, so TPA_PRE_Out is checked on the row
 * and not applied to a line.
 */
export function westFloridaSpotKey(kind: "gasoline" | "premium" | "diesel"): PlattsSpotKey {
  if (kind === "diesel") return "tpaUlsd";
  if (kind === "premium") return "tpaPre";
  return "tpaCbob";
}

const DOCK_PLANS: DockPlan[] = [
  {
    dockId: "galveston-yacht-marina",
    county: "Galveston",
    state: "TX",
    lines: [
      {
        product: "87",
        productLabel: "Regular 87",
        spotKey: "gcCbob",
        approximate: false,
        matchNote: "Regular grade mapped to GC CBOB. CBOB is a blendstock. Ethanol on the pin is unknown.",
        freight: "truck-only",
        fuel: "gasoline",
      },
      {
        product: "93",
        productLabel: "Non-ethanol 93",
        spotKey: "gcCbob93",
        approximate: true,
        matchNote: "Approximate match. Non-ethanol 93 mapped to GC CBOB93. E0 is not CBOB blendstock.",
        freight: "truck-only",
        fuel: "gasoline",
      },
      {
        product: "diesel",
        productLabel: "Diesel",
        spotKey: "gcUlsd",
        approximate: false,
        matchNote: "Diesel mapped to GC ULSD. The marina page does not say dyed or clear.",
        freight: "truck-only",
        fuel: "diesel",
      },
    ],
  },
  {
    dockId: "madeira-beach-municipal-marina",
    county: "Pinellas",
    state: "FL",
    lines: [
      {
        product: "gasoline",
        productLabel: "Ethanol-free gasoline",
        spotKey: westFloridaSpotKey("gasoline"),
        approximate: true,
        matchNote:
          "Approximate match. Ethanol-free gasoline, octane not stated, mapped to Tampa CBOB. E0 is not CBOB blendstock. Not a premium grade, so Tampa premium is not used.",
        freight: "tampa-ddp",
        fuel: "gasoline",
      },
      {
        product: "diesel",
        productLabel: "Diesel",
        spotKey: westFloridaSpotKey("diesel"),
        approximate: false,
        matchNote:
          "Diesel mapped to Tampa ULSD. The Tampa waterborne assessment is DDP, so marine freight stays inside the basis. The marina page does not say dyed or clear.",
        freight: "tampa-ddp",
        fuel: "diesel",
      },
    ],
  },
  {
    dockId: "st-augustine-municipal-marina",
    county: "St. Johns",
    state: "FL",
    lines: [
      {
        product: "gasoline",
        productLabel: "Gasoline",
        spotKey: "gcCbob",
        approximate: true,
        matchNote: "Approximate match. Gasoline, octane not stated, mapped to GC CBOB. Not a Tampa basis.",
        freight: "jones-act",
        fuel: "gasoline",
      },
      {
        product: "diesel",
        productLabel: "Diesel",
        spotKey: "gcUlsd",
        approximate: false,
        matchNote: "Diesel mapped to GC ULSD. The marina page does not say dyed or clear.",
        freight: "jones-act",
        fuel: "diesel",
      },
    ],
  },
  {
    dockId: "lambs-yacht-center",
    county: "Duval",
    state: "FL",
    lines: [
      {
        product: "90",
        productLabel: "Rec 90 ethanol-free",
        spotKey: "gcCbob",
        approximate: true,
        matchNote:
          "Approximate match. Rec 90 ethanol-free mapped to GC CBOB, not CBOB93. E0 and rec-90 are not CBOB blendstock.",
        freight: "jones-act",
        fuel: "gasoline",
      },
      {
        product: "diesel",
        productLabel: "Diesel",
        spotKey: "gcUlsd",
        approximate: false,
        matchNote: "Diesel mapped to GC ULSD. The marina page calls it ultra low sulfur diesel and does not say dyed or clear.",
        freight: "jones-act",
        fuel: "diesel",
      },
    ],
  },
];

export function roundDerivedCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function plattsOutrights(row: PlattsDailyRow | null): Record<PlattsSpotKey, number | null> {
  if (!row) {
    return { gcCbob: null, gcCbob93: null, gcUlsd: null, tpaCbob: null, tpaPre: null, tpaUlsd: null };
  }
  return {
    gcCbob: row.gcCbob.out,
    gcCbob93: row.gcCbob93.out,
    gcUlsd: row.gcUlsd.out,
    tpaCbob: row.tpaCbob.out,
    tpaPre: row.tpaPre.out,
    tpaUlsd: row.tpaUlsd.out,
  };
}

export function derivedLegBlankText(leg: DerivedLeg): string | null {
  if (leg.blank == null) return null;
  return `${leg.label} — ${leg.blank}`;
}

export function sumDerivedAddLegs(legs: DerivedLeg[]): number | null {
  const adding = legs.filter((leg) => leg.disposition === "add");
  if (adding.length === 0 || adding.some((leg) => leg.cents == null)) return null;
  return roundDerivedCents(adding.reduce((sum, leg) => sum + (leg.cents as number), 0));
}

export function formatDerivedCents(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const rounded = roundDerivedCents(value);
  const sign = rounded < 0 ? "−" : "";
  return `${sign}${trimDecimals(Math.abs(rounded), 4)} ¢/gal`;
}

export function buildDerivedLandedCostBook(input: DerivedLandedCostInput): DerivedLandedCostBook {
  const docks = DOCK_PLANS.map((plan) => {
    const dock = input.docks.find((row) => row.id === plan.dockId);
    const products = plan.lines.map((line) => buildProduct(plan, line, dock, input.row, input.typed));
    const gaps = products.flatMap((product) => product.gaps.map((gap) => `${product.productLabel}: ${gap}`));
    return {
      dockId: plan.dockId,
      dockName: dock?.name ?? plan.dockId,
      gaps,
      products,
    };
  });
  return {
    label: "DERIVED ESTIMATE",
    dateKey: input.row?.dateKey ?? null,
    stale: input.row ? input.stale : false,
    rowSource: input.row ? input.rowSource : "unavailable",
    rowNote: input.rowNote,
    outrightFlag: outrightFlag(input.row),
    docks,
  };
}

function outrightFlag(row: PlattsDailyRow | null): boolean {
  if (!row) return false;
  return row.gcCbob.flagged || row.gcCbob93.flagged || row.gcUlsd.flagged || row.tpaCbob.flagged || row.tpaPre.flagged || row.tpaUlsd.flagged;
}

function buildProduct(
  plan: DockPlan,
  line: LinePlan,
  dock: Dock | undefined,
  row: PlattsDailyRow | null,
  typed: DerivedTypedInputs,
): DerivedProductEstimate {
  const quote = dock?.quotes.find((item) => item.product === line.product);
  const postedPumpCents =
    quote?.pricePerGallon != null && Number.isFinite(quote.pricePerGallon)
      ? Math.round(quote.pricePerGallon * 100)
      : null;
  const book = line.fuel === "diesel" ? typed.HO : typed.RB;
  const legs = [
    spotLeg(line, row),
    freightLeg(line),
    unsourcedLeg(
      "terminalThroughput",
      "Terminal throughput",
      "No public refined-product terminal throughput fee, in ¢/gal, was found for the Houston, Tampa, or Jacksonville terminals that would serve this dock. Crude-pipeline tariffs and private contracts are not used.",
    ),
    unsourcedLeg(
      "truckFreight",
      "Truck freight",
      "No public common-carrier truck rate, in ¢/gal, was found for the haul from the terminal to this marina.",
    ),
    ...taxLegs(plan, line.fuel),
    typedLeg("invoice", "Invoice", book.invoiceCents),
    typedLeg("rack", "Posted rack", book.rackCents),
  ];
  const dapCents = sumDerivedAddLegs(legs);
  const dapComplete = dapCents != null;
  const impliedMarginCents =
    dapComplete && postedPumpCents != null ? roundDerivedCents(postedPumpCents - dapCents) : null;
  const fatTakeCents =
    book.invoiceCents != null && book.rackCents != null
      ? roundDerivedCents(book.invoiceCents - book.rackCents)
      : null;
  const gaps = legs.flatMap((leg) => {
    const text = derivedLegBlankText(leg);
    return text ? [text] : [];
  });
  return {
    label: "DERIVED ESTIMATE",
    dockId: plan.dockId,
    product: line.product,
    productLabel: line.productLabel,
    spotKey: line.spotKey,
    approximate: line.approximate,
    matchNote: line.matchNote,
    legs,
    gaps,
    dapCents,
    dapComplete,
    postedPumpCents,
    postedPumpNote: POSTED_PUMP_NOTE,
    impliedMarginCents,
    fatTakeCents,
    fatTakeStatus: fatTakeCents == null ? "NO CALL" : "typed",
    dieselFlag: line.fuel === "diesel" ? DIESEL_FLAG : null,
  };
}

function spotLeg(line: LinePlan, row: PlattsDailyRow | null): DerivedLeg {
  if (!row) {
    return {
      key: "spot",
      label: "Spot",
      cents: null,
      blank: "Platts row unavailable",
      disposition: "add",
      sourceUrl: null,
      asOf: null,
      sourceTitle: null,
      note: "The Platts Daily feed did not return a row. No substitute number is used. DERIVED ESTIMATE.",
    };
  }
  const assessment = row[line.spotKey];
  const cents = assessment.out;
  let note = "Spot is the outright on the Platts Daily row. A missing outright stays blank and is never treated as 0. DERIVED ESTIMATE.";
  if (assessment.flagged) {
    note = `Outright check failed. The outright and implied plus diff differ by ${formatDerivedCents(assessment.gap)}. The outright is still the spot. DERIVED ESTIMATE.`;
  } else if (assessment.gap == null) {
    note = "Outright check did not run. Implied or diff is missing and is not treated as 0. DERIVED ESTIMATE.";
  }
  return {
    key: "spot",
    label: "Spot",
    cents,
    blank: cents == null ? "not sourced" : null,
    disposition: "add",
    sourceUrl: null,
    asOf: row.dateKey,
    sourceTitle: "Platts Daily row (desk feed)",
    note,
  };
}

function freightLeg(line: LinePlan): DerivedLeg {
  if (line.freight === "truck-only") {
    return {
      key: "marinePipelineFreight",
      label: "Marine / pipeline freight",
      cents: null,
      blank: null,
      disposition: "not_on_path",
      sourceUrl: COLONIAL.url,
      asOf: COLONIAL.asOf,
      sourceTitle: COLONIAL.title,
      note: "Not on path. Colonial runs from Houston to the New York Harbor and does not deliver to this Galveston marina. Supply is truck from Houston-area terminals. No Colonial tariff is added.",
    };
  }
  if (line.freight === "tampa-ddp") {
    return {
      key: "marinePipelineFreight",
      label: "Marine / pipeline freight",
      cents: null,
      blank: null,
      disposition: "embedded",
      sourceUrl: TAMPA_METHOD.url,
      asOf: TAMPA_METHOD.asOf,
      sourceTitle: TAMPA_METHOD.title,
      note: "Included in the Tampa DDP basis. Platts assesses Tampa waterborne CBOB and ULSD as delivered cargoes, DDP Tampa, so Jones Act freight is inside the assessment and is not added again. Colonial does not serve this dock.",
    };
  }
  return unsourcedLeg(
    "marinePipelineFreight",
    "Marine / pipeline freight",
    "Jones Act marine freight from the Gulf is the path. Colonial does not serve this Florida dock. No public ¢/gal Jones Act tariff was found for this lane.",
  );
}

function taxLegs(plan: DockPlan, fuel: FuelKind): DerivedLeg[] {
  if (plan.state === "TX") {
    const stateSource = fuel === "diesel" ? TX_DIESEL : TX_GAS;
    return [
      sourcedLeg(
        "federalTax",
        "Federal tax",
        fuel === "diesel" ? 24.4 : 18.4,
        IRS_P510.url,
        IRS_P510.asOf,
        IRS_P510.title,
        fuel === "diesel"
          ? "Undyed diesel $0.244/gal, the rate this estimate uses. Dyed diesel is $0.001 LUST only and is not used. See the diesel flag."
          : "Gasoline $0.184/gal, including LUST.",
      ),
      sourcedLeg(
        "stateTax",
        "State tax",
        20,
        stateSource.url,
        stateSource.asOf,
        stateSource.title,
        "Texas state motor-fuel tax is 20¢/gal. The Comptroller rate page states no local motor-fuel tax.",
      ),
      sourcedLeg(
        "localTax",
        "Local tax",
        0,
        TX_LOCAL.url,
        TX_LOCAL.asOf,
        TX_LOCAL.title,
        "Sourced zero. Texas charges a flat state 20¢/gal and does not authorize a local-option motor fuel tax. This is not a missing rate.",
      ),
    ];
  }

  const local = floridaLocalGasoline(plan.county);
  if (fuel === "gasoline") {
    return [
      sourcedLeg(
        "federalTax",
        "Federal tax",
        18.4,
        IRS_P510.url,
        IRS_P510.asOf,
        IRS_P510.title,
        "Gasoline $0.184/gal, including LUST.",
      ),
      sourcedLeg(
        "stateTax",
        "State tax",
        22.125,
        FL_CHART.url,
        FL_CHART.asOf,
        FL_CHART.title,
        "Florida motor fuel state taxes $0.220 plus inspection fee $0.00125. Pollutants tax is not included: the 2026 chart’s water-quality petroleum line does not resolve to one rate (the statute moves between 2¢ and 5¢ per barrel with the trust-fund balance).",
      ),
      sourcedLeg(
        "localTax",
        "Local tax",
        local.cents,
        FL_CHART.url,
        FL_CHART.asOf,
        FL_CHART.title,
        `${plan.county} County total on the 2026 chart: ninth-cent + local option + additional local option + SCETS = $${local.dollars}/gal. Retail total tax imposed is state + inspection + this county total.`,
      ),
    ];
  }

  return [
    sourcedLeg(
      "federalTax",
      "Federal tax",
      24.4,
      IRS_P510.url,
      IRS_P510.asOf,
      IRS_P510.title,
      "Undyed diesel $0.244/gal, the rate this estimate uses. See the diesel flag. Dyed LUST-only $0.001 is not used.",
    ),
    sourcedLeg(
      "stateTax",
      "State tax",
      22,
      FL_CHART.url,
      FL_CHART.asOf,
      FL_CHART.title,
      "Undyed diesel statewide excise $0.040 + sales $0.180 = $0.220. The chart’s $0.389 total does not add the gasoline inspection fee. Pollutants tax is not included.",
    ),
    sourcedLeg(
      "localTax",
      "Local tax",
      16.9,
      FL_CHART.url,
      FL_CHART.asOf,
      FL_CHART.title,
      "Undyed diesel county rate is statewide: ninth-cent $0.01 + local option $0.06 + SCETS $0.099 = $0.169. It does not vary by county.",
    ),
  ];
}

function floridaLocalGasoline(county: string): { cents: number; dollars: string } {
  if (county === "Pinellas") return { cents: 16.9, dollars: "0.169" };
  if (county === "Duval") return { cents: 21.9, dollars: "0.219" };
  if (county === "St. Johns") return { cents: 15.9, dollars: "0.159" };
  return { cents: Number.NaN, dollars: "" };
}

function sourcedLeg(
  key: DerivedLegKey,
  label: string,
  cents: number,
  sourceUrl: string,
  asOf: string,
  sourceTitle: string,
  note: string,
): DerivedLeg {
  return {
    key,
    label,
    cents: Number.isFinite(cents) ? roundDerivedCents(cents) : null,
    blank: Number.isFinite(cents) ? null : "not sourced",
    disposition: "add",
    sourceUrl: Number.isFinite(cents) ? sourceUrl : null,
    asOf: Number.isFinite(cents) ? asOf : null,
    sourceTitle: Number.isFinite(cents) ? sourceTitle : null,
    note,
  };
}

function unsourcedLeg(key: DerivedLegKey, label: string, note: string): DerivedLeg {
  return {
    key,
    label,
    cents: null,
    blank: "not sourced",
    disposition: "add",
    sourceUrl: null,
    asOf: null,
    sourceTitle: null,
    note,
  };
}

function typedLeg(key: "invoice" | "rack", label: string, cents: Cents): DerivedLeg {
  const typed = cents != null && Number.isFinite(cents);
  return {
    key,
    label,
    cents: typed ? roundDerivedCents(cents as number) : null,
    blank: typed ? null : "not typed",
    disposition: "typed_input",
    sourceUrl: null,
    asOf: null,
    sourceTitle: typed ? "Worksheet typed input" : null,
    note: typed
      ? "Typed on the wholesale worksheet. Not filled from Platts. Not part of derived DAP."
      : "Not typed. Platts does not fill this cell.",
  };
}

function trimDecimals(value: number, maxDecimals: number): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  let text = rounded.toFixed(maxDecimals);
  text = text.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  if (!text.includes(".")) return `${text}.00`;
  const fraction = text.split(".")[1] ?? "";
  if (fraction.length >= 2) return text;
  return `${text}${"0".repeat(2 - fraction.length)}`;
}
