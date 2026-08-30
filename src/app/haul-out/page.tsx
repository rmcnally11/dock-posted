import type { Metadata } from "next";
import { OwnerPlanForm } from "@/components/owner-plan-form";
import { YardBoard } from "@/components/yard-board";
import { YardLeftoverForm } from "@/components/yard-leftover-form";
import { NAMED_STORM_PLAN_PRICE, yardsAreAllCall } from "@/lib/haul-out";
import { readYards } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Haul-out — Named Storm Plan — Dock Posted",
  description:
    "Leftover hurricane haul-out seats for Clear Lake, Kemah, and the Upper Keys. If the yard did not say what was left, it stays Call.",
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p
        data-testid="haul-out-kicker"
        className="text-[11px] uppercase tracking-[0.2em] text-wake-deep"
      >
        Leftover seats
      </p>
      <h1
        data-testid="haul-out-headline"
        className="mt-2 font-serif text-4xl text-harbor md:text-5xl"
      >
        Named storm parking
      </h1>
      <p data-testid="haul-out-deck" className="mt-3 max-w-2xl text-base leading-7 text-harbor/70">
        If the yard did not say what was left, it stays Call.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-harbor/60">
        Clear Lake, Kemah, Upper Keys. Indoor and lot only. We are not the yard. We do
        not haul, store, or insure. We do not sell wet slips.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-harbor">How it works</h2>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-harbor/75">
          <li>You file the boat.</li>
          <li>We match a primary and a backup that fit.</li>
          <li>
            When NHC names a storm in the cone we text remaining seats and the yard
            number. You call the yard. We do not lift the boat.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-harbor">File a Named Storm Plan</h2>
        <div className="mt-4 border border-harbor/12 bg-white p-5">
          {params.error ? (
            <p className="mb-4 rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">{params.error}</p>
          ) : null}
          <OwnerPlanForm />
        </div>
      </section>

      <section id="yard-board" className="mt-12">
        <h2 className="font-serif text-2xl text-harbor">Yard board</h2>
        <p className="mt-2 text-sm leading-6 text-harbor/65">
          Remaining seats are Call until a yard says a number out loud. Names here are
          unverified. We do not invent a hole.
        </p>
        {emptyBoard ? (
          <p data-testid="leftover-empty" className="mt-3 text-sm text-harbor/55">
            All leftover seats are Call.
          </p>
        ) : null}
        {params.posted ? (
          <p className="mt-3 rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh">
            Leftover seats posted. The board uses what you said.
          </p>
        ) : null}
        <div className="mt-4 border border-harbor/12 bg-white p-4">
          <YardBoard yards={yards} />
        </div>
      </section>

      <section id="yard-post" className="mt-8">
        <h2 className="font-serif text-lg text-harbor">Yard: post leftover seats</h2>
        <div className="mt-3 border border-harbor/12 bg-white p-5">
          {params.yardError ? (
            <p className="mb-4 rounded-md bg-rust/10 px-3 py-2 text-sm text-rust">
              {params.yardError}
            </p>
          ) : null}
          <YardLeftoverForm />
        </div>
      </section>

      <section className="mt-12 border-t border-harbor/10 pt-8 text-xs leading-6 text-harbor/50">
        <p>
          Owner: {NAMED_STORM_PLAN_PRICE} for a Named Storm Plan. One-page primary and
          backup, plus an NHC-name text with remaining seats and the yard phone. Form
          only. No checkout yet.
        </p>
        <p className="mt-3">
          Yard: a bounty when a referred boat actually shows. They keep the haul fee.
          Clear Lake first-come color has been about $40 a foot. That is not a quote. If
          a yard will not disclose leftover seats, they stay Call and they get no boats.
        </p>
        <p className="mt-3">Kill: five yards have not said leftover seats out loud.</p>
      </section>
    </main>
  );
}
