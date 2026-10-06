/**
 * Home welcome wording. Edit the strings here.
 * The rest of the home page reads them from this file.
 */
export const HOME_WELCOME = {
  headline: "Fuel prices at the dock, from Texas to Florida.",
  subhead:
    "Know what you’ll pay before you leave the slip. Every price shows where it came from and the day we saw it.",
  findNearMe: "Find fuel near me",
  reportPrice: "Report a price",
  howHeading: "How it works",
  steps: [
    "Marked by source: each price says whether it came from the marina’s own board or site or from a boater.",
    "Always dated: every price shows when we saw it, never a guess.",
    "Boaters keep it fresh: send a price you saw, and after a quick review it shows up marked as a boater report.",
  ],
  pricesHeading: "Fuel prices by dock",
  marinaLine: "Run a fuel dock? Put your prices in front of local boaters.",
} as const;
