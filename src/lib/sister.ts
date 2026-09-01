export const ON_THIS_WATER = "https://onthiswater.com";

export function conditionsHref(input: {
  corridor?: string | null;
  region?: string | null;
}): { href: string; label: string } {
  if (input.corridor === "galveston-bay" || input.region === "texas") {
    return {
      href: `${ON_THIS_WATER}/?theater=texas&area=galveston`,
      label: "Galveston morning line",
    };
  }
  if (input.corridor === "upper-keys" || input.region === "keys") {
    return {
      href: `${ON_THIS_WATER}/?theater=florida&area=islamorada`,
      label: "Keys morning line",
    };
  }
  if (input.region === "louisiana") {
    return {
      href: `${ON_THIS_WATER}/?theater=louisiana&area=venice`,
      label: "Venice morning line",
    };
  }
  if (input.region === "west-florida") {
    return {
      href: `${ON_THIS_WATER}/?theater=florida&area=boca-grande`,
      label: "Boca Grande morning line",
    };
  }
  if (input.region === "east-florida") {
    return {
      href: `${ON_THIS_WATER}/?theater=florida&area=jupiter`,
      label: "Jupiter morning line",
    };
  }
  return {
    href: ON_THIS_WATER,
    label: "Morning line",
  };
}
