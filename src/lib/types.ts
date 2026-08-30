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
  corridor: CorridorId;
  city: string;
  state: UsGulfState;
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

export const PRODUCTS: Product[] = ["87", "89", "90", "91", "93", "diesel"];

export const ETHANOLS: Ethanol[] = ["E0", "E10", "E15", "unknown"];

export const CORRIDOR_ORDER: CorridorId[] = [
  "sabine",
  "galveston-bay",
  "freeport-matagorda",
  "rockport-aransas",
  "corpus",
  "baffin-laguna",
  "lower-laguna",
  "calcasieu",
  "louisiana-delta",
  "mississippi-sound",
  "mobile-bay",
  "pensacola",
  "destin-pcb",
  "tampa-bay",
  "southwest-florida",
  "upper-keys",
  "lower-keys",
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
    short: "Galveston",
    state: "TX",
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

export const GULF_VIEW = { center: [-88.2, 27.8] as [number, number], zoom: 5.6 };
