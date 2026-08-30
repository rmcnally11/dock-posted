import { submitPriceReport } from "@/app/report/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ETHANOLS, PRODUCTS, STATE_CODES, type Dock, type StateCode } from "@/lib/types";

export function ReportForm({ docks, initialDockId }: { docks: Dock[]; initialDockId?: string }) {
  const startingDock =
    docks.find((dock) => dock.id === initialDockId)?.id ?? docks[0]?.id ?? "";
  const selected = docks.find((dock) => dock.id === startingDock) ?? null;
  const today = todayInput();
  const grouped = STATE_CODES.map((state) => ({
    state,
    docks: docks.filter((dock) => dock.state === state),
  })).filter((group) => group.docks.length > 0);

  return (
    <form action={submitPriceReport} autoComplete="off" className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--ink)]/80">Marina</legend>
        <Label htmlFor="marina" className="sr-only">
          Marina
        </Label>
        <select
          id="marina"
          name="marina"
          defaultValue={startingDock}
          className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
        >
          {grouped.map((group) => (
            <optgroup key={group.state} label={stateLabel(group.state)}>
              {group.docks.map((dock) => (
                <option key={dock.id} value={dock.id} data-testid={`marina-${dock.id}`}>
                  {dock.name} · {dock.city}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selected ? (
          <p data-testid="reporting-for" className="text-xs text-[color:var(--ink)]/55">
            {selected.name}, {selected.city} {selected.state}
            {selected.phone ? ` · ${selected.phone}` : ""}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="product">Product</Label>
          <select
            id="product"
            name="product"
            defaultValue="90"
            className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
          >
            {PRODUCTS.map((item) => (
              <option key={item} value={item}>
                {item === "diesel" ? "Diesel" : `${item} octane`}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ethanol">Ethanol</Label>
          <select
            id="ethanol"
            name="ethanol"
            defaultValue="E0"
            className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
          >
            {ETHANOLS.map((item) => (
              <option key={item} value={item}>
                {item === "E0"
                  ? "E0"
                  : item === "E15"
                    ? "E15 — not for boats"
                    : item === "unknown"
                      ? "Call"
                      : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price per gallon</Label>
          <Input id="price" name="price" inputMode="decimal" placeholder="5.790" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seenAt">When you saw it</Label>
          <Input id="seenAt" name="seenAt" type="date" defaultValue={today} required />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--ink)]/80">Who posts</legend>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="radio" name="who" value="boater" defaultChecked className="h-5 w-5" />
          I fueled here
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="radio" name="who" value="marina" className="h-5 w-5" />
          I run this dock
        </label>
        <p className="text-xs text-[color:var(--ink)]/50">
          Truck day, or when you change the board. Not every morning.
        </p>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="hours">Hours</Label>
        <Input id="hours" name="hours" placeholder="Daily 7am–6pm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pay">Pay</Label>
          <select
            id="pay"
            name="pay"
            defaultValue=""
            className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
          >
            <option value="">Call</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="both">Cash or card</option>
          </select>
        </div>
        <div className="space-y-2 pt-6 text-sm">
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="closed" value="1" className="h-5 w-5" />
            Closed
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="dieselOnly" value="1" className="h-5 w-5" />
            Diesel only
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          required={false}
          maxLength={400}
          placeholder="Rec-90 on the hose. Tax in."
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" data-testid="post-price" className="w-full sm:w-auto">
        Send it
      </Button>
      <p className="text-xs text-[color:var(--ink)]/50">
        The number on the pump. If they did not post, it stays Call.
      </p>
    </form>
  );
}

function stateLabel(state: StateCode): string {
  return state;
}

function todayInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
