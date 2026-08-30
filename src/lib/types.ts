export type CorridorId = "galveston-bay" | "upper-keys";

export type Ethanol = "E0" | "E10" | "E15" | "unknown";

export type SourceLabel = "Waterway Guide" | "marina site" | "user report";

export type Product = "87" | "89" | "90" | "91" | "93" | "diesel";

export type QuoteStatus = "posted" | "call" | "no-report" | "not-sold";

export type DockAccess = "public" | "private" | "members";

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
  state: "TX" | "FL";
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

export const CORRIDORS: Record<
  CorridorId,
  { label: string; short: string; center: [number, number]; zoom: number }
> = {
  "galveston-bay": {
    label: "Galveston Bay / Clear Lake",
    short: "Texas",
    center: [-95.02, 29.54],
    zoom: 10.2,
  },
  "upper-keys": {
    label: "Key Largo / Upper Keys",
    short: "Keys",
    center: [-80.53, 25.02],
    zoom: 9.6,
  },
};
