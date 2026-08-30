import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";

export default function SafeFuelPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]">
        The hose
      </p>
      <h1 className="mt-1 font-heading text-4xl text-[color:var(--cream)] md:text-5xl">
        E15 is not for boats
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--cream)]/65">
        If the sticker says 15% ethanol, walk away. That hose stays Call.
      </p>
      <Waterline className="mt-3" />

      <section className="mt-8 max-w-2xl space-y-3">
        <h2 className="font-heading text-2xl text-[color:var(--cream)]">
          The hose that damages an outboard
        </h2>
        <p className="text-sm leading-7 text-[color:var(--cream)]/80">
          E15 is gasoline with 15% ethanol. EPA lists boats with snowmobiles and other nonroad
          engines as equipment that must not use it. NMMA says the same. Most warranties stop at
          E10.
        </p>
        <p className="text-sm leading-7 text-[color:var(--cream)]/80">
          In March 2026 EPA widened E15 on the highway for the summer driving season. That waiver
          is for cars. It does not put E15 in a Yamaha or a Mercury. More green stickers at the
          ramp raise the odds a trailered boat gets the wrong hose.
        </p>
      </section>

      <section className="mt-8 max-w-2xl space-y-3">
        <h2 className="font-heading text-2xl text-[color:var(--cream)]">E10 runs. E0 sits better.</h2>
        <p className="text-sm leading-7 text-[color:var(--cream)]/80">
          E10 is what most late-model outboards are built to take. It still pulls water. A tank
          that sits between weekends is happier on ethanol-free — E0, sometimes sold as Rec-90 —
          when the dock has it.
        </p>
        <p className="text-sm leading-7 text-[color:var(--cream)]/80">
          When a dock has E0, the card says E0. When the public page said non-ethanol: no, we mark
          E10. If nobody labeled the pump, the blend stays Call. Octane is not a test for ethanol.
        </p>
      </section>

      <section className="mt-8 max-w-2xl space-y-3">
        <h2 className="font-heading text-2xl text-[color:var(--cream)]">What to do</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[color:var(--cream)]/80">
          <li>Read the pump sticker. Walk away from E15.</li>
          <li>If the card says Call — call the dock.</li>
          <li>Ask whether the high-octane hose is E0 or just 93 with ethanol.</li>
          <li>Then post what you saw so the next boat is not guessing.</li>
        </ul>
      </section>

      <section className="mt-10 max-w-2xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5 text-sm leading-6 text-[color:var(--cream)]/70">
        <h2 className="font-heading text-xl text-[color:var(--cream)]">Pages we opened</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            EPA, “E15 Fuel Registration” — boats among equipment that cannot use E15.{" "}
            <a
              className="text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40 underline-offset-2"
              href="https://www.epa.gov/fuels-registration-reporting-and-compliance-help/e15-fuel-registration"
            >
              epa.gov
            </a>
          </li>
          <li>
            EPA news release, 25 March 2026, nationwide E15 summer waiver beginning 1 May 2026.{" "}
            <a
              className="text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40 underline-offset-2"
              href="https://www.epa.gov/newsreleases/epa-fortifies-domestic-fuel-supply-provides-americans-relief-pump-approving-nationwide"
            >
              epa.gov
            </a>
          </li>
          <li>NMMA and marine press: E15 remains prohibited for marine engines.</li>
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <a
          className="text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40 underline-offset-2"
          href="/"
        >
          Back to the board
        </a>
      </p>
      <SiteFooter />
    </main>
  );
}
