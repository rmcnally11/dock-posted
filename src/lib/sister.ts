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
    label: "This morning on Sabine",
    match: /\bsabine\b|port arthur|\borange\b|groves/i,
  },
  {
    theater: "texas",
    area: "galveston",
    label: "This morning on Galveston",
    match:
      /galveston|kemah|seabrook|league city|clear lake|baytown|dickinson|la porte|shoreacres|san leon|texas city|hitchcock/i,
  },
  {
    theater: "texas",
    area: "matagorda",
    label: "This morning on Matagorda",
    match: /matagorda|palacios|port lavaca|port o.?connor|seadrift/i,
  },
  {
    theater: "texas",
    area: "aransas",
    label: "This morning on Aransas",
    match: /rockport|aransas|fulton|port aransas|ingle side/i,
  },
  {
    theater: "texas",
    area: "corpus",
    label: "This morning on Corpus",
    match: /corpus/i,
  },
  {
    theater: "texas",
    area: "baffin",
    label: "This morning on Baffin",
    match: /baffin|upper laguna|kingsville|riviera/i,
  },
  {
    theater: "texas",
    area: "lower-laguna",
    label: "This morning on Lower Laguna",
    match: /south padre|port isabel|laguna madre|brownsville|los fresnos/i,
  },
  {
    theater: "louisiana",
    area: "venice",
    label: "This morning on Venice",
    match: /venice|empire|buras|boothville|birdfoot/i,
  },
  {
    theater: "louisiana",
    area: "grand-isle",
    label: "This morning on Grand Isle",
    match: /grand isle|barataria|leeville|golden meadow/i,
  },
  {
    theater: "louisiana",
    area: "calcasieu",
    label: "This morning on Calcasieu",
    match: /calcasieu|cameron|lake charles|hackberry/i,
  },
  {
    theater: "florida",
    area: "key-west",
    label: "This morning on Key West",
    match: /key west|stock island/i,
  },
  {
    theater: "florida",
    area: "marathon",
    label: "This morning on Marathon",
    match: /marathon/i,
  },
  {
    theater: "florida",
    area: "islamorada",
    label: "This morning on Islamorada",
    match: /islamorada/i,
  },
  {
    theater: "florida",
    area: "key-largo",
    label: "This morning on Key Largo",
    match: /key largo|tavernier|pennekamp|north key largo/i,
  },
  {
    theater: "florida",
    area: "florida-bay",
    label: "This morning on Florida Bay",
    match: /flamingo|florida bay/i,
  },
  {
    theater: "florida",
    area: "biscayne",
    label: "This morning on Biscayne",
    match: /miami|biscayne|coconut grove|key biscayne/i,
  },
  {
    theater: "florida",
    area: "boca-grande",
    label: "This morning on Boca Grande",
    match: /boca grande|charlotte|punta gorda|cape coral|fort myers|sanibel|pine island/i,
  },
  {
    theater: "florida",
    area: "jupiter",
    label: "This morning on Jupiter",
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
    return target("texas", "galveston", "This morning on Galveston");
  }
  if (place.corridor === "upper-keys") {
    return target("florida", "key-largo", "This morning on Key Largo");
  }

  for (const desk of DESKS) {
    if (desk.match.test(hay)) {
      return target(desk.theater, desk.area, desk.label);
    }
  }

  if (place.region === "texas" || place.state === "TX") {
    return target("texas", "galveston", "This morning on Galveston");
  }
  if (place.region === "louisiana" || place.state === "LA") {
    return target("louisiana", "venice", "This morning on Venice");
  }
  if (place.region === "keys") {
    return target("florida", "islamorada", "This morning on the Keys");
  }
  if (place.region === "west-florida") {
    return target("florida", "boca-grande", "This morning on Boca Grande");
  }
  if (place.region === "east-florida") {
    return target("florida", "jupiter", "This morning on Jupiter");
  }
  if (place.state === "FL") {
    return target("florida", "islamorada", "This morning on the Keys");
  }

  return {
    href: homeUrl(),
    label: "This morning",
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
