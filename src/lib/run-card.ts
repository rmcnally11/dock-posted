import { BLANK, formatPrice } from "./format";
import { boardQuote, displayDiesel, displayGas } from "./freshness";
import type { Dock } from "./types";

export interface RunInput {
  gallons: number | null;
  gph: number | null;
  hours: number | null;
}

export interface RunRow {
  dock: Dock;
  gasPosted: number | null;
  dieselPosted: number | null;
  tankGas: number | null;
  tankDiesel: number | null;
  gasLabel: string;
  dieselLabel: string;
  tankGasLabel: string;
  tankDieselLabel: string;
}

export function tankGallons(input: RunInput): number | null {
  if (input.gallons != null && input.gallons > 0) return roundTenths(input.gallons);
  if (input.gph != null && input.gph > 0 && input.hours != null && input.hours > 0) {
    return roundTenths(input.gph * input.hours);
  }
  return null;
}

export function tankDollars(gallons: number, pricePerGallon: number): number {
  return Math.round(gallons * pricePerGallon * 100) / 100;
}

export function postedPrice(dock: Dock, kind: "gas" | "diesel"): number | null {
  const quote = kind === "gas" ? boardQuote(dock, displayGas(dock)) : boardQuote(dock, displayDiesel(dock));
  if (!quote || quote.status !== "posted" || quote.pricePerGallon == null) return null;
  return quote.pricePerGallon;
}

export function runRows(docks: Dock[], gallons: number | null): RunRow[] {
  return docks.map((dock) => {
    const gasPosted = postedPrice(dock, "gas");
    const dieselPosted = postedPrice(dock, "diesel");
    const tankGas = gallons != null && gasPosted != null ? tankDollars(gallons, gasPosted) : null;
    const tankDiesel = gallons != null && dieselPosted != null ? tankDollars(gallons, dieselPosted) : null;
    return {
      dock,
      gasPosted,
      dieselPosted,
      tankGas,
      tankDiesel,
      gasLabel: gasPosted == null ? BLANK : formatPrice(gasPosted),
      dieselLabel: dieselPosted == null ? BLANK : formatPrice(dieselPosted),
      tankGasLabel: tankGas == null ? BLANK : money(tankGas),
      tankDieselLabel: tankDiesel == null ? BLANK : money(tankDiesel),
    };
  });
}

export function runTally(rows: RunRow[]): { posted: number; call: number } {
  let posted = 0;
  let call = 0;
  for (const row of rows) {
    if (row.gasPosted != null || row.dieselPosted != null) posted += 1;
    else call += 1;
  }
  return { posted, call };
}

export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function roundTenths(value: number): number {
  return Math.round(value * 10) / 10;
}
