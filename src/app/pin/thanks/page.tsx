import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { PIN_PRICE_LABEL } from "@/lib/income";
import { stripeConfigured } from "@/lib/pay";
import { readPin } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your dock is filed",
  description: "Your dock is filed. You write the number.",
};

export default async function PinThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; paid?: string }>;
}) {
  const params = await searchParams;
  if (!params.id) notFound();
  const pin = await readPin(params.id);
  if (!pin) notFound();
  const paid = params.paid === "1" || pin.status === "paid";

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6" data-testid="pin-thanks">
      <p className="kicker text-[color:var(--signal)]">Your dock</p>
      <h1 className="page-title mt-3 text-[color:var(--navy)]">
        {paid ? "This dock is yours" : "Dock filed"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        {pin.dockName}. {PIN_PRICE_LABEL}.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-8 max-w-xl space-y-3 text-sm leading-7 text-[color:var(--ink)]/80">
        {paid ? (
          <p>You’re on the card. Change the number whenever the dock board changes.</p>
        ) : stripeConfigured() ? (
          <p>The bill is open. Boats will see a blank until it clears.</p>
        ) : (
          <p>
            We sent a bill. Mail or wire {PIN_PRICE_LABEL}. Boats will see
            a blank until it clears.
          </p>
        )}
        <p>You write the number. We don’t invent a price. We don’t sell a gallon.</p>
        <p>
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href={`/report?dock=${pin.dockId}&who=marina`}
          >
            I was there
          </a>
          {" · "}
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href={`/docks/${pin.dockId}`}
          >
            {pin.dockName}
          </a>
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
