import type { Metadata } from "next";
import { HowItWorks, PIN_WALK, RUN_WALK, STORM_WALK } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { NAMED_STORM_PLAN_PRICE } from "@/lib/haul-out";
import { PIN_PRICE_LABEL, WATCH_PRICE_LABEL } from "@/lib/income";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Three short walks: put your dock’s price on the board, see what a tank will cost, and file a boat before they name a storm.",
};

export default function HowPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">Walkthrough</p>
      <h1
        data-testid="how-headline"
        className="mt-1 font-heading text-4xl text-[color:var(--navy)] md:text-5xl"
      >
        How it works
      </h1>
      <p data-testid="how-deck" className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
        Dock Posted is the number on the board. If they have not written one, it stays Call —
        that just means pick up the phone. These three walks are for a marina, a captain, and
        a boat that needs a hole when they name a storm.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-10" data-testid="how-pin">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">For the marina</p>
        <h2 className="mt-1 font-heading text-3xl text-[color:var(--navy)]">The pin</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          Boats check this board before they leave. If your pin is blank, they often fuel at
          the next hose. You write the price. We do not invent one. {PIN_PRICE_LABEL}.
        </p>
        <HowItWorks testId="how-pin-steps" steps={PIN_WALK} />
        <p className="mt-4 text-sm">
          <a
            href="/pin"
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          >
            Put your dock on the board
          </a>
        </p>
      </section>

      <section className="mt-12" data-testid="how-run">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">For the boat</p>
        <h2 className="mt-1 font-heading text-3xl text-[color:var(--navy)]">The run</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          Before you leave, see what a tank will cost on the water you fish. Charter or trailer.
          Posted dollars only. Leave an email if you want the next post — {WATCH_PRICE_LABEL}.
          E15 is not for boats.
        </p>
        <HowItWorks testId="how-run-steps" steps={RUN_WALK} />
        <p className="mt-4 text-sm">
          <a
            href="/run"
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          >
            Price this weekend’s run
          </a>
        </p>
      </section>

      <section className="mt-12" data-testid="how-storm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">Before they name it</p>
        <h2 className="mt-1 font-heading text-3xl text-[color:var(--navy)]">Named storm</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">
          When they name it, you need a hole. File the boat now — {NAMED_STORM_PLAN_PRICE}.
          We text two yards that fit and what space they still have. You call the yard. We
          don’t lift her.
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
