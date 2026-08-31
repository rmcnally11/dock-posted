import { submitPinClaim } from "@/app/pin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PIN_PRICE_LABEL } from "@/lib/income";
import { STATE_CODES, type Dock } from "@/lib/types";

export function PinForm({ docks, initialDockId }: { docks: Dock[]; initialDockId?: string }) {
  const starting = docks.find((dock) => dock.id === initialDockId)?.id ?? docks[0]?.id ?? "";
  const grouped = STATE_CODES.map((state) => ({
    state,
    docks: docks.filter((dock) => dock.state === state),
  })).filter((group) => group.docks.length > 0);

  return (
    <form action={submitPinClaim} autoComplete="off" className="space-y-4" data-testid="pin-form">
      <p className="text-sm text-[color:var(--ink)]/70">
        {PIN_PRICE_LABEL}. You write the number. Truck day, or when you change the board.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="dockId">Dock</Label>
        <select
          id="dockId"
          name="dockId"
          defaultValue={starting}
          className="h-11 w-full rounded-md border border-[color:var(--line)] bg-white px-3 text-base md:text-sm"
        >
          {grouped.map((group) => (
            <optgroup key={group.state} label={group.state}>
              {group.docks.map((dock) => (
                <option key={dock.id} value={dock.id}>
                  {dock.name} · {dock.city}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactName">Your name</Label>
        <Input id="contactName" name="contactName" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Input id="role" name="role" placeholder="Fuel dock / harbormaster" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" maxLength={400} placeholder="Hours. Blend. Cash or card." />
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" data-testid="file-pin">
        File the pin
      </Button>
      <p className="text-xs text-[color:var(--ink)]/50">
        We don’t sell a gallon. A blank stays Call until you write it.
      </p>
    </form>
  );
}

