export type CorridorId =
  | "sabine"
  | "galveston-bay"
  | "freeport-matagorda"
  | "rockport-aransas"
  | "corpus"
  | "baffin-laguna"
  | "lower-laguna"
  | "calcasieu"
  | "louisiana-delta"
  | "mississippi-sound"
  | "mobile-bay"
  | "pensacola"
  | "destin-pcb"
  | "tampa-bay"
  | "southwest-florida"
  | "upper-keys"
  | "lower-keys";

export type RegionId =
  | "texas"
  | "louisiana"
  | "mississippi"
  | "alabama"
  | "west-florida"
  | "keys"
  | "east-florida"
  | "georgia"
  | "south-carolina"
  | "north-carolina"
  | "virginia"
  | "maryland"
  | "new-jersey"
  | "new-york"
  | "new-england";

export type StateCode =
  | "TX"
  | "LA"
  | "MS"
  | "AL"
  | "FL"
  | "GA"
  | "SC"
  | "NC"
  | "VA"
  | "MD"
  | "NJ"
  | "NY"
  | "CT"
  | "RI"
  | "MA"
  | "NH"
  | "ME";

export type Ethanol = "E0" | "E10" | "E15" | "unknown";

export type SourceLabel = "Waterway Guide" | "marina site" | "user report";

export type Product = "87" | "89" | "90" | "91" | "93" | "diesel";

export type QuoteStatus = "posted" | "call" | "no-report" | "not-sold";

export type DockAccess = "public" | "private" | "members";

export type UsGulfState = "TX" | "LA" | "MS" | "AL" | "FL";

export interface FuelQuote {
  product: Product;
  pricePerGallon: number | null;
  ethanol: Ethanol;
  status: QuoteStatus;
  taxIncluded: boolean | null;
}

export interface Dock {
  id: string;
  name: string;
  corridor: CorridorId | null;
  region: RegionId;
  city: string;
  state: StateCode;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
  website: string | null;
  notes: string | null;
  access: DockAccess;
  ethanol: Ethanol;
  quotes: FuelQuote[];
  lastVerifiedAt: string | null;
  lastVerifiedSource: SourceLabel | null;
  sourceUrl: string | null;
}

export interface PriceReport {
  id: string;
  dockId: string;
  product: Product;
  ethanol: Ethanol;
  pricePerGallon: number;
  seenAt: string;
  note: string | null;
  createdAt: string;
}

export interface DockStoreFile {
  generatedAt: string;
  seedCapturedOn: string;
  docks: Dock[];
}

export interface ReportStoreFile {
  reports: PriceReport[];
}

export interface DockOverlay {
  quotes?: FuelQuote[];
  ethanol?: Ethanol;
  lastVerifiedAt?: string | null;
  lastVerifiedSource?: SourceLabel | null;
  sourceUrl?: string | null;
  notes?: string | null;
}

export interface OverlayStoreFile {
  overlays: Record<string, DockOverlay>;
}

export const PRODUCTS: Product[] = ["87", "89", "90", "91", "93", "diesel"];

export const ETHANOLS: Ethanol[] = ["E0", "E10", "E15", "unknown"];

export const STATE_CODES: StateCode[] = [
  "TX",
  "LA",
  "MS",
  "AL",
  "FL",
  "GA",
  "SC",
  "NC",
  "VA",
  "MD",
  "NJ",
  "NY",
  "CT",
  "RI",
  "MA",
  "NH",
  "ME",
];

export const CORRIDORS: Record<
  CorridorId,
  { label: string; short: string; state: string; center: [number, number]; zoom: number }
> = {
  sabine: {
    label: "Sabine / Port Arthur",
    short: "Sabine",
    state: "TX",
    center: [-93.87, 29.73],
    zoom: 10.4,
  },
  "galveston-bay": {
    label: "Galveston Bay / Clear Lake",
    short: "Clear Lake",
    center: [-95.02, 29.54],
    zoom: 10.2,
  },
  "freeport-matagorda": {
    label: "Freeport / Matagorda",
    short: "Matagorda",
    state: "TX",
    center: [-95.55, 28.8],
    zoom: 9.2,
  },
  "rockport-aransas": {
    label: "Rockport / Aransas",
    short: "Rockport",
    state: "TX",
    center: [-97.05, 28.04],
    zoom: 10.4,
  },
  corpus: {
    label: "Corpus Christi",
    short: "Corpus",
    state: "TX",
    center: [-97.39, 27.8],
    zoom: 10.6,
  },
  "baffin-laguna": {
    label: "Baffin / Upper Laguna",
    short: "Baffin",
    state: "TX",
    center: [-97.22, 27.45],
    zoom: 9.8,
  },
  "lower-laguna": {
    label: "Lower Laguna / South Padre",
    short: "South Padre",
    state: "TX",
    center: [-97.17, 26.1],
    zoom: 10.4,
  },
  calcasieu: {
    label: "Calcasieu / Lake Charles",
    short: "Calcasieu",
    state: "LA",
    center: [-93.27, 30.18],
    zoom: 10.2,
  },
  "louisiana-delta": {
    label: "Grand Isle / Venice",
    short: "Delta",
    state: "LA",
    center: [-89.55, 29.25],
    zoom: 8.6,
  },
  "mississippi-sound": {
    label: "Biloxi / Gulfport / Bay St. Louis",
    short: "MS Coast",
    state: "MS",
    center: [-89.0, 30.37],
    zoom: 9.6,
  },
  "mobile-bay": {
    label: "Mobile Bay / Orange Beach",
    short: "Mobile",
    state: "AL",
    center: [-87.8, 30.4],
    zoom: 9.4,
  },
  pensacola: {
    label: "Pensacola",
    short: "Pensacola",
    state: "FL",
    center: [-87.21, 30.4],
    zoom: 10.6,
  },
  "destin-pcb": {
    label: "Destin / Panama City",
    short: "Destin",
    state: "FL",
    center: [-86.1, 30.3],
    zoom: 8.8,
  },
  "tampa-bay": {
    label: "Tampa Bay",
    short: "Tampa",
    state: "FL",
    center: [-82.64, 27.75],
    zoom: 10.2,
  },
  "southwest-florida": {
    label: "Fort Myers / Naples",
    short: "SW Florida",
    state: "FL",
    center: [-81.85, 26.4],
    zoom: 8.8,
  },
  "upper-keys": {
    label: "Key Largo / Upper Keys",
    short: "Upper Keys",
    state: "FL",
    center: [-80.53, 25.02],
    zoom: 9.6,
  },
  "lower-keys": {
    label: "Marathon / Key West",
    short: "Lower Keys",
    state: "FL",
    center: [-81.45, 24.64],
    zoom: 8.8,
  },
};

export const REGIONS: Record<
  RegionId,
  {
    label: string;
    short: string;
    states: StateCode[];
    center: [number, number];
    zoom: number;
  }
> = {
  texas: {
    label: "Texas coast",
    short: "TX",
    states: ["TX"],
    center: [-95.3, 28.4],
    zoom: 6.4,
  },
  louisiana: {
    label: "Louisiana",
    short: "LA",
    states: ["LA"],
    center: [-90.2, 29.5],
    zoom: 7.2,
  },
  mississippi: {
    label: "Mississippi",
    short: "MS",
    states: ["MS"],
    center: [-88.9, 30.35],
    zoom: 8.4,
  },
  alabama: {
    label: "Alabama",
    short: "AL",
    states: ["AL"],
    center: [-87.8, 30.35],
    zoom: 8.4,
  },
  "west-florida": {
    label: "West Florida",
    short: "W FL",
    states: ["FL"],
    center: [-82.6, 27.6],
    zoom: 6.6,
  },
  keys: {
    label: "Florida Keys",
    short: "Keys",
    states: ["FL"],
    center: [-81.1, 24.8],
    zoom: 8.2,
  },
  "east-florida": {
    label: "East Florida",
    short: "E FL",
    states: ["FL"],
    center: [-80.4, 27.4],
    zoom: 6.6,
  },
  georgia: {
    label: "Georgia",
    short: "GA",
    states: ["GA"],
    center: [-81.2, 31.4],
    zoom: 7.8,
  },
  "south-carolina": {
    label: "South Carolina",
    short: "SC",
    states: ["SC"],
    center: [-79.9, 32.8],
    zoom: 7.6,
  },
  "north-carolina": {
    label: "North Carolina",
    short: "NC",
    states: ["NC"],
    center: [-76.6, 34.8],
    zoom: 7.2,
  },
  virginia: {
    label: "Virginia",
    short: "VA",
    states: ["VA"],
    center: [-76.3, 37.1],
    zoom: 7.4,
  },
  maryland: {
    label: "Maryland",
    short: "MD",
    states: ["MD"],
    center: [-76.3, 38.6],
    zoom: 7.6,
  },
  "new-jersey": {
    label: "New Jersey",
    short: "NJ",
    states: ["NJ"],
    center: [-74.2, 39.8],
    zoom: 7.4,
  },
  "new-york": {
    label: "New York",
    short: "NY",
    states: ["NY"],
    center: [-73.5, 40.8],
    zoom: 8,
  },
  "new-england": {
    label: "New England",
    short: "N.E.",
    states: ["CT", "RI", "MA", "NH", "ME"],
    center: [-70.8, 42.4],
    zoom: 6.4,
  },
};

export const STATE_VIEWS: Record<StateCode, { label: string; center: [number, number]; zoom: number }> =
  {
    TX: { label: "Texas", center: [-95.3, 28.4], zoom: 6.4 },
    LA: { label: "Louisiana", center: [-90.2, 29.5], zoom: 7.2 },
    MS: { label: "Mississippi", center: [-88.9, 30.35], zoom: 8.4 },
    AL: { label: "Alabama", center: [-87.8, 30.35], zoom: 8.4 },
    FL: { label: "Florida", center: [-81.6, 27.4], zoom: 6 },
    GA: { label: "Georgia", center: [-81.2, 31.4], zoom: 7.8 },
    SC: { label: "South Carolina", center: [-79.9, 32.8], zoom: 7.6 },
    NC: { label: "North Carolina", center: [-76.6, 34.8], zoom: 7.2 },
    VA: { label: "Virginia", center: [-76.3, 37.1], zoom: 7.4 },
    MD: { label: "Maryland", center: [-76.3, 38.6], zoom: 7.6 },
    NJ: { label: "New Jersey", center: [-74.2, 39.8], zoom: 7.4 },
    NY: { label: "New York", center: [-73.5, 40.8], zoom: 8 },
    CT: { label: "Connecticut", center: [-72.4, 41.3], zoom: 8.2 },
    RI: { label: "Rhode Island", center: [-71.4, 41.5], zoom: 8.6 },
    MA: { label: "Massachusetts", center: [-70.7, 41.9], zoom: 7.8 },
    NH: { label: "New Hampshire", center: [-70.7, 43.05], zoom: 9 },
    ME: { label: "Maine", center: [-69.6, 44.1], zoom: 7.2 },
  };

export const COAST_JUMPS: Array<
  | { kind: "corridor"; id: CorridorId; short: string }
  | { kind: "state"; id: StateCode; short: string }
  | { kind: "region"; id: RegionId; short: string }
> = [
  { kind: "corridor", id: "galveston-bay", short: "Clear Lake" },
  { kind: "corridor", id: "upper-keys", short: "Keys home" },
  { kind: "state", id: "TX", short: "TX" },
  { kind: "state", id: "LA", short: "LA" },
  { kind: "state", id: "MS", short: "MS" },
  { kind: "state", id: "AL", short: "AL" },
  { kind: "state", id: "FL", short: "FL" },
  { kind: "region", id: "keys", short: "Keys" },
  { kind: "state", id: "GA", short: "GA" },
  { kind: "state", id: "SC", short: "SC" },
  { kind: "state", id: "NC", short: "NC" },
  { kind: "state", id: "VA", short: "VA" },
  { kind: "state", id: "MD", short: "MD" },
  { kind: "state", id: "NJ", short: "NJ" },
  { kind: "state", id: "NY", short: "NY" },
  { kind: "region", id: "new-england", short: "New England" },
];
