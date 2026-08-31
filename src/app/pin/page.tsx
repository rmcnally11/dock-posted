import type { Metadata } from "next";
import { PinForm } from "@/components/pin-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { PIN_PRICE_LABEL } from "@/lib/income";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The pin",
  description: "Own the pin. You write the number. If you didn’t, it stays Call.",
};

export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ dock?: string; error?: string }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <p
        data-testid="pin-kicker"
        className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]"
      >
        Marina pin
      </p>
      <h1 data-testid="pin-headline" className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl">
        Own the pin
      </h1>
      <p data-testid="pin-deck" className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        {PIN_PRICE_LABEL}. You write the number. If you didn’t, it stays Call.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/60">
        We don’t sell a gallon. We don’t invent a price. Truck day, or when you change
        the board. Not every morning.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-8 max-w-xl space-y-3 text-sm leading-7 text-[color:var(--ink)]/80">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">What you get</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>The pin is yours. Verified when you post.</li>
          <li>A boat on that water sees what you wrote.</li>
          <li>You change it on truck day. We leave a blank as Call.</li>
        </ol>
      </section>

      <section className="mt-8 max-w-xl">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">File the pin</h2>
        <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5">
          {params.error ? (
            <p className="mb-4 rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
              {params.error}
            </p>
          ) : null}
          <PinForm docks={docks} initialDockId={params.dock} />
        </div>
      </section>

      <p className="mt-8 max-w-xl text-sm text-[color:var(--ink)]/55">
        Charter or weekend run. Same board.{" "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/run"
        >
          The run
        </a>
        .
      </p>
      <SiteFooter />
    </main>
  );
}
