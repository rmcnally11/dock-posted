import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Waterline } from "@/components/waterline";
import {
  EMPTY_LEFTOVER_NOTE,
  NAMED_STORM_PLAN_PRICE,
  planLeftoverNote,
  yardDisplayName,
} from "@/lib/haul-out";
import { readHaulOutStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Yard seats ${id.slice(0, 8)}`,
    description: "A place to pull her. Primary and backup stay blank until a yard says what’s left.",
  };
}

export default async function NamedStormPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await readHaulOutStore();
  const plan = store.plans.find((row) => row.id === id);
  if (!plan) notFound();

  const primary = store.yards.find((yard) => yard.id === plan.primaryYardId) ?? null;
  const backup = store.yards.find((yard) => yard.id === plan.backupYardId) ?? null;
  const leftoverNote = planLeftoverNote(primary);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 print:px-0 print:py-0 md:px-6">
      <p className="kicker text-[color:var(--signal)] print:text-black">Named Storm Plan</p>
      <h1 className="page-title mt-3 text-[color:var(--navy)] print:text-black">
        Primary and backup
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70 print:text-black">
        When NHC names a storm in the cone we text what’s left and the yard number. You
        call the yard. We do not lift.
      </p>
      <Waterline className="mt-3 print:hidden" />

      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2" data-testid="plan-preview">
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-4">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--signal)]">
            Primary
          </dt>
          <dd data-testid="plan-primary" className="mt-1 font-heading text-2xl">
            {yardDisplayName(primary)}
          </dd>
        </div>
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-4">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--signal)]">
            Backup
          </dt>
          <dd data-testid="plan-backup" className="mt-1 font-heading text-2xl">
            {yardDisplayName(backup)}
          </dd>
        </div>
      </dl>

      <p data-testid="plan-leftover-note" className="mt-4 text-sm text-[color:var(--ink)]/70 print:text-black">
        {leftoverNote}
      </p>

      <section className="mt-8 rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5 text-sm leading-6">
        <h2 className="font-heading text-xl text-[color:var(--navy)] print:text-black">Boat</h2>
        <ul className="mt-3 space-y-1 text-[color:var(--ink)]/75 print:text-black">
          <li>Owner: {plan.ownerName}</li>
          <li>Phone: {plan.phone}</li>
          <li>Email: {plan.email}</li>
          <li>Home dock: {plan.homeDock}</li>
          <li>
            {plan.lengthFt} ft × {plan.beamFt} ft · {plan.berth === "trailer" ? "trailer" : "in-water"}
          </li>
          <li>Insurance: {plan.insuranceCarrier}</li>
        </ul>
      </section>

      <p className="mt-6 text-xs leading-6 text-[color:var(--ink)]/50 print:text-black">
        Offer: {NAMED_STORM_PLAN_PRICE}. No checkout on this page. We are not the yard.
        We do not haul, store, or insure. We do not sell wet slips.
        {leftoverNote === EMPTY_LEFTOVER_NOTE ? ` ${EMPTY_LEFTOVER_NOTE}` : ""}
      </p>

      <div className="mt-8 flex items-center gap-4">
        <PrintButton />
        <a
          className="text-sm text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2 print:hidden"
          href="/haul-out"
        >
          Back to named storm
        </a>
      </div>
    </main>
  );
}
