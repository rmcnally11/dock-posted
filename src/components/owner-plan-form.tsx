import { submitNamedStormPlan } from "@/app/haul-out/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NAMED_STORM_PLAN_PRICE } from "@/lib/haul-out";

export function OwnerPlanForm() {
  return (
    <form action={submitNamedStormPlan} autoComplete="off" className="space-y-4" data-testid="owner-plan-form">
      <p className="text-sm text-[color:var(--cream)]/70">
        {NAMED_STORM_PLAN_PRICE}. One page. Two yards that fit, and a text when the cone
        gets a name. No checkout on this page. File the boat.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="ownerName">Name</Label>
        <Input id="ownerName" name="ownerName" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="homeDock">Home dock</Label>
        <Input id="homeDock" name="homeDock" required placeholder="Marina or ramp" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="length">Length (ft)</Label>
          <Input id="length" name="length" inputMode="decimal" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="beam">Beam (ft)</Label>
          <Input id="beam" name="beam" inputMode="decimal" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="insuranceCarrier">Insurance carrier</Label>
        <Input id="insuranceCarrier" name="insuranceCarrier" required />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--cream)]/80">Where the boat sits</legend>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="radio" name="berth" value="in-water" defaultChecked className="h-5 w-5" />
          In-water
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="radio" name="berth" value="trailer" className="h-5 w-5" />
          Trailer
        </label>
      </fieldset>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit">File the boat</Button>
      <p className="text-xs text-[color:var(--cream)]/50">
        We don’t lift her. You call the yard. A blank seat stays Call.
      </p>
    </form>
  );
}
