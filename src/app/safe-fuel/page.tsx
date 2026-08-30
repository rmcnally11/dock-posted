import Link from "next/link";

export default function SafeFuelPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wake-deep">
        Plain English
      </p>
      <h1 className="mt-2 font-serif text-4xl text-harbor">Safe fuel for boats</h1>
      <p className="mt-3 text-base leading-7 text-harbor/75">
        This is not trading advice and not a pitch to buy or sell gallons. It is the
        misfuel sheet trailerable boats keep needing, especially after more land pumps
        started offering E15 in 2026.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-harbor">E15 is not for boats</h2>
        <p className="text-sm leading-7 text-harbor/80">
          E15 is gasoline with 15% ethanol. EPA registration pages list boats with
          snowmobiles and other nonroad engines as equipment that must not use E15. The
          National Marine Manufacturers Association (NMMA) says the same: E15 is not
          approved for marine engines, and using it can damage fuel systems. Warranty
          language from engine makers typically stops at E10.
        </p>
        <p className="text-sm leading-7 text-harbor/80">
          On 25 March 2026 the EPA announced a temporary emergency waiver so E15 could
          be sold more widely during the summer driving season, starting 1 May 2026. That
          waiver is about land-pump supply. It does not approve E15 for marine use. More
          green E15 stickers at highway stations raise the odds a trailered boat gets
          the wrong hose.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-harbor">E10 is allowed. Many shops still want E0.</h2>
        <p className="text-sm leading-7 text-harbor/80">
          E10 (10% ethanol) is the common pump gas most late-model outboards are built
          to accept. It is still ethanol. Ethanol pulls water, can phase-separate in a
          tank that sits, and is hard on older rubber and fiberglass tanks. That is why
          a lot of OEMs and yards tell you to prefer ethanol-free (E0, sometimes sold
          as REC-90) when you can find it — especially if the boat sits between weekends.
        </p>
        <p className="text-sm leading-7 text-harbor/80">
          E0 is scarce on both corridors we map. When a dock has it, the card says E0.
          When we only know “non-ethanol: no,” we mark E10. If nobody labeled the pump,
          we say unknown. Do not guess from octane alone.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-harbor">Why E0 costs more</h2>
        <p className="text-sm leading-7 text-harbor/80">
          The federal Renewable Fuel Standard requires obligated parties (refiners and
          importers) to blend renewable fuel or retire credits called RINs. EPA’s own
          RFS overview is the source: RINs are generated when renewable fuel is made,
          and they can be separated when that fuel is blended into gasoline. Straight
          gasoline that never takes ethanol does not create that RIN path, so terminals
          and trucks are steered toward E10. E0 becomes a specialty product and prices
          like one.
        </p>
        <p className="text-sm leading-7 text-harbor/80">
          We are not quoting RIN prices here. Those screens move all day and we did not
          open a live ticker for this page. The useful fact for a boater is simpler: E0
          is usually the expensive hose because the blending system is built around
          ethanol credits, not because a marina is gouging you.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-harbor">What to do at the pump</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-harbor/80">
          <li>Read the pump sticker. Walk away from E15 / 15% ethanol.</li>
          <li>If the dock card says Call, call. Waterway Guide updates weekly and still says the same.</li>
          <li>Ask whether the high-octane hose is E0 or just 93 with ethanol.</li>
          <li>Then report what you saw so the next boat is not guessing.</li>
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-harbor/10 bg-white p-5 text-sm leading-6 text-harbor/70">
        <h2 className="font-serif text-xl text-harbor">Sources opened for this page</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            EPA, “E15 Fuel Registration” — boats listed among equipment that cannot use
            E15.{" "}
            <a
              className="text-wake underline-offset-2 hover:underline"
              href="https://www.epa.gov/fuels-registration-reporting-and-compliance-help/e15-fuel-registration"
            >
              epa.gov
            </a>
          </li>
          <li>
            EPA news release, 25 March 2026, nationwide E15 summer waiver beginning 1 May
            2026.{" "}
            <a
              className="text-wake underline-offset-2 hover:underline"
              href="https://www.epa.gov/newsreleases/epa-fortifies-domestic-fuel-supply-provides-americans-relief-pump-approving-nationwide"
            >
              epa.gov
            </a>
          </li>
          <li>
            NMMA / marine press summaries of that waiver, stating E15 remains prohibited
            for marine use (e.g. BoatTEST, The Fisherman).
          </li>
          <li>
            EPA, “Overview of the Renewable Fuel Standard Program” — RINs generated on
            renewable fuel and separated when blended.{" "}
            <a
              className="text-wake underline-offset-2 hover:underline"
              href="https://www.epa.gov/renewable-fuel-standard/overview-renewable-fuel-standard-program"
            >
              epa.gov
            </a>
          </li>
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link className="text-wake underline-offset-2 hover:underline" href="/">
          Back to the map
        </Link>
      </p>
    </main>
  );
}
