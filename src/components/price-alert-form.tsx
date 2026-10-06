import { submitPriceAlert } from "@/app/report/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRICE_ALERT_CONSENT } from "@/lib/price-report";

export function PriceAlertForm({
  dockId,
  dockName,
  error,
}: {
  dockId: string;
  dockName: string;
  error?: string;
}) {
  return (
    <form action={submitPriceAlert} className="mt-6 space-y-4" data-testid="price-alert">
      <h2 className="font-heading text-2xl text-[color:var(--navy)]">
        Tell me when this dock&apos;s price changes
      </h2>
      <p className="text-sm text-[color:var(--ink)]/70">
        We store your email with {dockName}. Nothing goes out from this page.
      </p>
      {error ? (
        <p className="rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
          {error}
        </p>
      ) : null}
      <input type="hidden" name="dock" value={dockId} />
      <div className="space-y-1.5">
        <Label htmlFor="alert-email">Email</Label>
        <Input id="alert-email" name="email" type="email" autoComplete="email" required />
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm text-[color:var(--ink)]/80">
        <input type="checkbox" name="consent" value="yes" required className="mt-0.5 h-5 w-5" />
        <span>{PRICE_ALERT_CONSENT}</span>
      </label>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="alert-company">Company</Label>
        <Input id="alert-company" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        Tell me
      </Button>
    </form>
  );
}
