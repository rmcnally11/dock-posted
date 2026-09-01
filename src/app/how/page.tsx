import type { Metadata } from "next";
import { HowItWorks, PIN_WALK, RUN_WALK, STORM_WALK } from "@/components/how-it-works";
import { SisterHandoff } from "@/components/sister-handoff";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { NAMED_STORM_PLAN_PRICE } from "@/lib/haul-out";
import { PIN_PRICE_LABEL, WATCH_PRICE_LABEL } from "@/lib/income";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Three short walks: your dock, this trip, and a seat in the yard when they name a storm.",
};

export default function HowPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">Walkthrough</p>
      <h1
        data-testid="how-headline"
        className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl"
      >
        Three short walks.
      </h1>
      <p data-testid="how-deck" className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
        The number on the pump. If they haven’t written one, we leave it blank — that just means
        pick up the phone.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-10" data-testid="how-pin">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">For the marina</p>
        <h2 className="mt-1 font-heading text-3xl text-[color:var(--navy)]">Your dock · {PIN_PRICE_LABEL}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          Boats look here before they leave the ramp. You write the number when the truck comes. We
          never invent one.
        </p>
        <HowItWorks testId="how-pin-steps" steps={PIN_WALK} />
        <p className="mt-4 text-sm">
          <a
            href="/pin"
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          >
            This is my dock
          </a>
        </p>
      </section>

      <section className="mt-12" data-testid="how-run">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">For the boat</p>
        <h2 className="mt-1 font-heading text-3xl text-[color:var(--navy)]">This trip · {WATCH_PRICE_LABEL} to watch</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          Before you leave, see what a tank will cost on the water you fish. Charter or trailer. We
          only multiply a number they wrote.
        </p>
        <HowItWorks testId="how-run-steps" steps={RUN_WALK} />
        <p className="mt-4 text-sm">
          <a
            href="/run"
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          >
            Price this trip
          </a>
        </p>
        <SisterHandoff />
      </section>

      <section className="mt-12" data-testid="how-storm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">Before they name it</p>
        <h2 className="mt-1 font-heading text-3xl text-[color:var(--navy)]">Yard seats</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          When they name a storm, yards fill up. Who still has a seat. You call the yard. We don’t
          pull her. File the boat now — {NAMED_STORM_PLAN_PRICE}.
        </p>
        <HowItWorks testId="how-storm-steps" steps={STORM_WALK} />
        <p className="mt-4 text-sm">
          <a
            href="/haul-out"
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          >
            File the boat
          </a>
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
