export const ON_THIS_WATER = "https://onthiswater.com";

export const DOCK_POSTED = "https://www.dockposted.com";

export type SisterTarget = {
  href: string;
  label: string;
  theater: string | null;
  area: string | null;
};

export type SisterPlace = {
  corridor?: string | null;
  region?: string | null;
  state?: string | null;
  city?: string | null;
};

type Desk = {
  theater: string;
  area: string;
  label: string;
  match: RegExp;
};

const DESKS: Desk[] = [
  {
    theater: "texas",
    area: "sabine",
    label: "Sabine morning line",
    match: /\bsabine\b|port arthur|\borange\b|groves/i,
  },
  {
    theater: "texas",
    area: "galveston",
    label: "Galveston morning line",
    match:
      /galveston|kemah|seabrook|league city|clear lake|baytown|dickinson|la porte|shoreacres|san leon|texas city|hitchcock/i,
  },
  {
    theater: "texas",
    area: "matagorda",
    label: "Matagorda morning line",
    match: /matagorda|palacios|port lavaca|port o.?connor|seadrift/i,
  },
  {
    theater: "texas",
    area: "aransas",
    label: "Aransas morning line",
    match: /rockport|aransas|fulton|port aransas|ingle side/i,
  },
  {
    theater: "texas",
    area: "corpus",
    label: "Corpus morning line",
    match: /corpus/i,
  },
  {
    theater: "texas",
    area: "baffin",
    label: "Baffin morning line",
    match: /baffin|upper laguna|kingsville|riviera/i,
  },
  {
    theater: "texas",
    area: "lower-laguna",
    label: "Lower Laguna morning line",
    match: /south padre|port isabel|laguna madre|brownsville|los fresnos/i,
  },
  {
    theater: "louisiana",
    area: "venice",
    label: "Venice morning line",
    match: /venice|empire|buras|boothville|birdfoot/i,
  },
  {
    theater: "louisiana",
    area: "grand-isle",
    label: "Grand Isle morning line",
    match: /grand isle|barataria|leeville|golden meadow/i,
  },
  {
    theater: "louisiana",
    area: "calcasieu",
    label: "Calcasieu morning line",
    match: /calcasieu|cameron|lake charles|hackberry/i,
  },
  {
    theater: "florida",
    area: "key-west",
    label: "Key West morning line",
    match: /key west|stock island/i,
  },
  {
    theater: "florida",
    area: "marathon",
    label: "Marathon morning line",
    match: /marathon/i,
  },
  {
    theater: "florida",
    area: "islamorada",
    label: "Islamorada morning line",
    match: /islamorada/i,
  },
  {
    theater: "florida",
    area: "key-largo",
    label: "Key Largo morning line",
    match: /key largo|tavernier|pennekamp|north key largo/i,
  },
  {
    theater: "florida",
    area: "florida-bay",
    label: "Florida Bay morning line",
    match: /flamingo|florida bay/i,
  },
  {
    theater: "florida",
    area: "biscayne",
    label: "Biscayne morning line",
    match: /miami|biscayne|coconut grove|key biscayne/i,
  },
  {
    theater: "florida",
    area: "boca-grande",
    label: "Boca Grande morning line",
    match: /boca grande|charlotte|punta gorda|cape coral|fort myers|sanibel|pine island/i,
  },
  {
    theater: "florida",
    area: "jupiter",
    label: "Jupiter morning line",
    match: /jupiter|loxahatchee|stuart|palm beach|tequesta/i,
  },
];

const TEXAS_DESKS = [
  "sabine",
  "galveston",
  "matagorda",
  "aransas",
  "corpus",
  "baffin",
  "lower-laguna",
] as const;

const KEYS_DESKS = [
  "key-largo",
  "islamorada",
  "florida-bay",
  "marathon",
  "key-west",
] as const;

const LOUISIANA_DESKS = ["venice", "grand-isle", "calcasieu"] as const;

function briefUrl(theater: string, area: string): string {
  const url = new URL(ON_THIS_WATER);
  url.searchParams.set("theater", theater);
  url.searchParams.set("area", area);
  url.searchParams.set("utm_source", "dockposted");
  url.searchParams.set("utm_medium", "handoff");
  return url.toString();
}

function homeUrl(): string {
  const url = new URL(ON_THIS_WATER);
  url.searchParams.set("utm_source", "dockposted");
  url.searchParams.set("utm_medium", "handoff");
  return url.toString();
}

function target(theater: string, area: string, label: string): SisterTarget {
  return {
    href: briefUrl(theater, area),
    label,
    theater,
    area,
  };
}

function haystack(place: SisterPlace): string {
  return [place.city, place.corridor, place.region, place.state].filter(Boolean).join(" ");
}

export function publicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || DOCK_POSTED).replace(/\/$/, "");
}

export function sisterHomeHref(): string {
  return homeUrl();
}

export function conditionsHref(place: SisterPlace = {}): SisterTarget {
  const hay = haystack(place);

  for (const desk of DESKS) {
    if (place.city && desk.match.test(place.city)) {
      return target(desk.theater, desk.area, desk.label);
    }
  }

  if (place.corridor === "galveston-bay") {
    return target("texas", "galveston", "Galveston morning line");
  }
  if (place.corridor === "upper-keys") {
    return target("florida", "key-largo", "Key Largo morning line");
  }

  for (const desk of DESKS) {
    if (desk.match.test(hay)) {
      return target(desk.theater, desk.area, desk.label);
    }
  }

  if (place.region === "texas" || place.state === "TX") {
    return target("texas", "galveston", "Galveston morning line");
  }
  if (place.region === "louisiana" || place.state === "LA") {
    return target("louisiana", "venice", "Venice morning line");
  }
  if (place.region === "keys") {
    return target("florida", "islamorada", "Keys morning line");
  }
  if (place.region === "west-florida") {
    return target("florida", "boca-grande", "Boca Grande morning line");
  }
  if (place.region === "east-florida") {
    return target("florida", "jupiter", "Jupiter morning line");
  }
  if (place.state === "FL") {
    return target("florida", "islamorada", "Keys morning line");
  }

  return {
    href: homeUrl(),
    label: "Morning line",
    theater: null,
    area: null,
  };
}

export function conditionsMailLine(place: SisterPlace = {}): string {
  const next = conditionsHref(place);
  return `Tide and wind on that water: ${next.href}`;
}

export function briefCoastsFor(place: SisterPlace): string[] {
  const next = conditionsHref(place);
  if (place.region === "texas" && !place.city && !place.corridor) {
    return [...TEXAS_DESKS];
  }
  if (place.region === "keys" && !place.city && !place.corridor) {
    return [...KEYS_DESKS];
  }
  if (place.region === "louisiana" && !place.city && !place.corridor) {
    return [...LOUISIANA_DESKS];
  }
  if (place.region === "west-florida") return ["boca-grande"];
  if (place.region === "east-florida") return ["jupiter", "biscayne"];
  if (next.area) return [next.area];
  return [];
}
