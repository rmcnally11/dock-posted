import { submitYardLeftover } from "@/app/haul-out/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function YardLeftoverForm() {
  return (
    <form action={submitYardLeftover} autoComplete="off" className="space-y-3" data-testid="yard-leftover-form">
      <p className="text-xs leading-5 text-[color:var(--ink)]/60">
        Blank stays Call. If you won’t say the number, the boats don’t come.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="yardName">Yard name</Label>
          <Input id="yardName" name="yardName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indoorLeftover">Indoor leftover</Label>
          <Input id="indoorLeftover" name="indoorLeftover" inputMode="numeric" placeholder="Call" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lotLeftover">Lot leftover</Label>
          <Input id="lotLeftover" name="lotLeftover" inputMode="numeric" placeholder="Call" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxLength">Max length (ft)</Label>
          <Input id="maxLength" name="maxLength" inputMode="decimal" placeholder="Call" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yardPhone">Phone</Label>
          <Input id="yardPhone" name="yardPhone" type="tel" placeholder="Call" />
        </div>
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="yard-company">Company</Label>
        <Input id="yard-company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Post leftover seats
      </Button>
    </form>
  );
}
