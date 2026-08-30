import type { Metadata } from "next";
import { OwnerPlanForm } from "@/components/owner-plan-form";
import { Waterline } from "@/components/waterline";
import { YardBoard } from "@/components/yard-board";
import { YardLeftoverForm } from "@/components/yard-leftover-form";
import { NAMED_STORM_PLAN_PRICE, yardsAreAllCall } from "@/lib/haul-out";
import { readYards } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Named storm — Named Storm Plan — Dock Posted",
  description:
    "Indoor and lot on Clear Lake, Kemah, and the Upper Keys. If the yard did not say what was left, it stays Call.",
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
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <p
        data-testid="haul-out-kicker"
        className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]"
      >
        Leftover seats
      </p>
      <h1
        data-testid="haul-out-headline"
        className="mt-2 font-heading text-4xl text-[color:var(--cream)] md:text-5xl"
      >
        Named storm parking
      </h1>
      <p data-testid="haul-out-deck" className="mt-2 max-w-2xl text-sm text-[color:var(--cream)]/65">
        Indoor and lot on Clear Lake, Kemah, and the Upper Keys. If the yard did not say
        what was left, it stays Call.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--cream)]/60">
        We are not the yard. We do not haul, store, or insure. We do not sell wet slips.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-10 max-w-3xl space-y-4" data-testid="how-it-works">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]">
          How it works
        </p>
        <h2 className="font-heading text-2xl text-[color:var(--cream)]">Four doors. One cone.</h2>
        <p className="text-sm leading-6 text-[color:var(--cream)]/75">
          You file the boat. We hold two yards that fit. When NHC names it, you call. We
          do not lift.
        </p>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-[color:var(--cream)]/75">
          <li>File the boat — Name, length, where she sits. One page.</li>
          <li>Two yards that fit — A primary and a backup. Indoor or lot. Not a wet slip.</li>
          <li>
            The cone gets a name — We text what’s left and the yard number. If the yard
            did not say, it stays Call.
          </li>
          <li>You call the yard — They haul. They store. They insure. We do not.</li>
        </ol>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="font-heading text-2xl text-[color:var(--cream)]">File a Named Storm Plan</h2>
        <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5">
          {params.error ? (
            <p className="mb-4 rounded-md bg-[color:var(--copper)]/10 px-3 py-2 text-sm text-[color:var(--copper)]">
              {params.error}
            </p>
          ) : null}
          <OwnerPlanForm />
        </div>
      </section>

      <section id="yard-board" className="mt-12 max-w-3xl">
        <h2 className="font-heading text-2xl text-[color:var(--cream)]">Yard board</h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--cream)]/65">
          A leftover seat is Call until a yard says a number out loud. Names here are
          unverified. We do not invent a hole.
        </p>
        {emptyBoard ? (
          <p data-testid="leftover-empty" className="mt-3 text-sm text-[color:var(--cream)]/55">
            All leftover seats are Call.
          </p>
        ) : null}
        {params.posted ? (
          <p className="mt-3 rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh">
            Leftover seats posted. The board uses what you said.
          </p>
        ) : null}
        <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4">
          <YardBoard yards={yards} />
        </div>
      </section>

      <section id="yard-post" className="mt-8 max-w-3xl">
        <h2 className="font-heading text-lg text-[color:var(--cream)]">Yard: post what’s left</h2>
        <div className="mt-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5">
          {params.yardError ? (
            <p className="mb-4 rounded-md bg-[color:var(--copper)]/10 px-3 py-2 text-sm text-[color:var(--copper)]">
              {params.yardError}
            </p>
          ) : null}
          <YardLeftoverForm />
        </div>
      </section>

      <section className="mt-12 max-w-3xl border-t border-[color:var(--line)] pt-8 text-xs leading-6 text-[color:var(--cream)]/50">
        <p>
          Owner: {NAMED_STORM_PLAN_PRICE} for a Named Storm Plan. One page, a primary and
          a backup, plus a text when NHC names a storm in the cone — what’s left, and the
          yard phone. Form only. No checkout yet.
        </p>
        <p className="mt-3">
          Yard: A referred boat that actually shows: the yard keeps the haul fee. Clear
          Lake first-come color has been about $40 a foot. That is not a quote. If a yard
          won’t say what’s left, it stays Call, and they get no boats.
        </p>
        <p className="mt-3">Five yards still have not said what’s left.</p>
      </section>
    </main>
  );
}
