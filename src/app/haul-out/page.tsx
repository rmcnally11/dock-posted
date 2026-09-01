import type { Metadata } from "next";
import { BrandPhoto } from "@/components/brand-photo";
import { HowItWorks, STORM_WALK } from "@/components/how-it-works";
import { SisterHandoff } from "@/components/sister-handoff";
import { OwnerPlanForm } from "@/components/owner-plan-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { YardBoard } from "@/components/yard-board";
import { YardLeftoverForm } from "@/components/yard-leftover-form";
import { NAMED_STORM_PLAN_PRICE, yardsAreAllCall } from "@/lib/haul-out";
import { readYards } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Named storm",
  description:
    "When they name it, you need a hole. If the yard didn’t say what was left, it stays Call.",
};

export default async function HaulOutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; yardError?: string; posted?: string }>;
}) {
  const yards = await readYards();
  const params = await searchParams;
  const emptyBoard = yardsAreAllCall(yards);

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 overflow-x-hidden px-4 py-4 md:px-6 lg:py-6">
      <p
        data-testid="haul-out-kicker"
        className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]"
      >
        Leftover seats
      </p>
      <h1
        data-testid="haul-out-headline"
        className="mt-2 font-heading text-2xl text-[color:var(--navy)] lg:text-5xl"
      >
        Named storm
      </h1>
      <p data-testid="haul-out-deck" className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        When they name it, you need a hole. If the yard didn’t say what was left, it stays Call.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/60">
        File the boat once, on a quiet Tuesday. When they put a name on the cone, we
        text what’s left at the two yards you already picked. We are not the yard. We
        do not haul, store, or insure. We don’t invent a hole. You call the yard. We
        don’t lift her. Wet slips stay Coastal Cavaliers — not this product.
      </p>
      <SisterHandoff corridor="galveston-bay" />
      <Waterline className="mt-3 hidden lg:block" />
      <BrandPhoto name="storm" className="mt-6 aspect-[16/9] w-full max-w-3xl" />

      <HowItWorks
        heading="The four steps"
        intro="One page on file. A text when they name it. You make the call."
        steps={STORM_WALK}
      />

      <section className="mt-8 max-w-3xl lg:mt-10">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">File the boat now</h2>
        <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5">
          {params.error ? (
            <p className="mb-4 rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
              {params.error}
            </p>
          ) : null}
          <OwnerPlanForm />
        </div>
      </section>

      <section id="yard-board" className="mt-8 max-w-3xl lg:mt-12">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">Yard board</h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]/70">
          If you won’t say the number, the boats don’t come. A leftover seat is Call
          until a yard says a number out loud. Names here are unverified. We do not
          invent a hole.
        </p>
        {emptyBoard ? (
          <p data-testid="leftover-empty" className="mt-3 text-sm text-[color:var(--ink)]/55">
            All leftover seats are Call.
          </p>
        ) : null}
        {params.posted ? (
          <p className="mt-3 rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh">
            Leftover seats posted. The board uses what you said.
          </p>
        ) : null}
        <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-4">
          <YardBoard yards={yards} />
        </div>
      </section>

      <section id="yard-post" className="mt-8 max-w-3xl">
        <h2 className="font-heading text-lg text-[color:var(--navy)]">Yard: post what’s left</h2>
        <div className="mt-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5">
          {params.yardError ? (
            <p className="mb-4 rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
              {params.yardError}
            </p>
          ) : null}
          <YardLeftoverForm />
        </div>
      </section>

      <section className="mt-12 max-w-3xl border-t border-[color:var(--line)] pt-8 text-xs leading-6 text-[color:var(--ink)]/50">
        <p>
          Owner: {NAMED_STORM_PLAN_PRICE} for a Named Storm Plan. One page, a primary and
          a backup, plus a text when NHC names a storm in the cone — what’s left, and the
          yard phone. Form only. No checkout yet. Leftover indoor and lot seats.
        </p>
        <p className="mt-3">
          Yard: A referred boat that actually shows: the yard keeps the haul fee. Clear
          Lake first-come color has been about $40 a foot. That is not a quote. If a yard
          won’t say what’s left, it stays Call, and they get no boats.
        </p>
        <p className="mt-3">Five yards still have not said what’s left.</p>
        <p className="mt-3">
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href="/how"
          >
            See all three walks
          </a>
          .
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
