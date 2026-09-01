import { submitWaterWatch } from "@/app/run/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WATCH_PRICE_LABEL } from "@/lib/income";
import { CORRIDORS, REGIONS, type CorridorId, type RegionId } from "@/lib/types";

export function RunWatchForm({
  corridor,
  region,
  gallons,
}: {
  corridor: CorridorId | null;
  region: RegionId | null;
  gallons: string;
}) {
  return (
    <form action={submitWaterWatch} autoComplete="off" className="space-y-4" data-testid="watch-form">
      <p className="text-sm text-[color:var(--ink)]/70">
        {WATCH_PRICE_LABEL}. When a dock on that water posts, we write you. Not a text.
      </p>
      {corridor ? <input type="hidden" name="corridor" value={corridor} /> : null}
      {region ? <input type="hidden" name="region" value={region} /> : null}
      {gallons ? <input type="hidden" name="gallons" value={gallons} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" data-testid="file-watch">
        Watch this water
      </Button>
      <p className="text-xs text-[color:var(--ink)]/50">
        {corridor ? CORRIDORS[corridor].label : region ? REGIONS[region].label : "Sabine to Maine"}.
        A blank stays blank.
      </p>
    </form>
  );
}
