import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { PIN_PRICE_LABEL } from "@/lib/income";
import { stripeConfigured } from "@/lib/pay";
import { readPin } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pin filed",
  description: "The pin is filed. You write the number.",
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
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">
        Marina pin
      </p>
      <h1 className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl">
        {paid ? "The pin is yours" : "Pin filed"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        {pin.dockName}. {PIN_PRICE_LABEL}.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-8 max-w-xl space-y-3 text-sm leading-7 text-[color:var(--ink)]/80">
        {paid ? (
          <p>Paid. Post the number when you change the board.</p>
        ) : stripeConfigured() ? (
          <p>The bill is open. The pin stays Call until it clears.</p>
        ) : (
          <p>
            We sent a bill to the desk. Mail or wire {PIN_PRICE_LABEL}. The pin stays
            Call until it clears.
          </p>
        )}
        <p>You write the number. We don’t invent a price. We don’t sell a gallon.</p>
        <p>
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href={`/report?dock=${pin.dockId}&who=marina`}
          >
            Post a number
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
