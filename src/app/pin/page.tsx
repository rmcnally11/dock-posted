import type { Metadata } from "next";
import { HowItWorks, PIN_WALK } from "@/components/how-it-works";
import { PinForm } from "@/components/pin-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { PIN_PRICE_LABEL } from "@/lib/income";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The pin",
  description: "Put your dock’s price on the board. You write the number. If you didn’t, it stays Call.",
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
        For the marina
      </p>
      <h1 data-testid="pin-headline" className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl">
        Own the pin
      </h1>
      <p data-testid="pin-deck" className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
        Boats look here before they leave the ramp. You put up the price you are charging.
        {" "}
        {PIN_PRICE_LABEL}. If you have not written it yet, they see Call — and they often
        keep going.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/60">
        You change it on truck day, or when the board at the dock changes. We never invent
        a price. We don’t sell a gallon.
      </p>
      <Waterline className="mt-3" />

      <HowItWorks
        heading="How the pin works"
        intro="Three steps. You stay in charge of the number."
        steps={PIN_WALK}
        testId="pin-how"
      />

      <section className="mt-10 max-w-xl">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">Claim your dock</h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]/70">
          Takes a minute. We confirm it is you, then the pin is yours. Verified when you post.
        </p>
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
        Running the boat this weekend?{" "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/run"
        >
          The run
        </a>
        {" · "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/how"
        >
          See all three walks
        </a>
        .
      </p>
      <SiteFooter />
    </main>
  );
}
