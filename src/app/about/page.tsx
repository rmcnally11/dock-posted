import type { Metadata } from "next";
import { BrandPhoto } from "@/components/brand-photo";
import { SisterHandoff } from "@/components/sister-handoff";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { XTimeline } from "@/components/x-timeline";
import { publicXHandle } from "@/lib/x-handle";

export const metadata: Metadata = {
  title: "Who writes this",
  description: "What they wrote on the pump. If they didn’t, ask the dock.",
};

export default function AboutPage() {
  const handle = publicXHandle();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <h1
        data-testid="about-headline"
        className="font-heading text-4xl text-[color:var(--navy)] md:text-5xl"
      >
        Who writes this
      </h1>
      <p
        data-testid="about-deck"
        className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70"
      >
        What they wrote on the pump. If they didn’t, ask the dock.
      </p>
      <Waterline className="mt-3" />
      <BrandPhoto name="cover" className="mt-8 aspect-[16/9] w-full max-w-2xl" />

      <section
        data-testid="about-body"
        className="mt-8 max-w-2xl space-y-3 text-sm leading-7 text-[color:var(--ink)]/80"
      >
        <p>
          Dock Posted is the number on the pump. Sabine to Key West, then
          the rest of the saltwater coast.
        </p>
        <p>We don’t sell fuel. We don’t pull your boat. We just write down what we know. A blank stays blank.</p>
        <p>
          Yard seats are leftover spots in the shed or on the lot. When they name a storm, you
          call the yard.
        </p>
        <p>What it cost and what they posted lives behind a locked door.</p>
        <p>
          If you were at the dock, send the number.{" "}
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href="/report"
          >I was there</a>
          .
        </p>
        <p>
          Three short walks if you want the simple version: your dock for the marina, this trip
          before you leave, and yard seats for the boat.{" "}
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href="/how"
          >
            How it works
          </a>
          .
        </p>
        <SisterHandoff />
      </section>

      <BrandPhoto name="close" className="mt-8 aspect-[16/9] w-full max-w-2xl" />

      <section
        data-testid="waterdog-fuel"
        className="mt-10 max-w-2xl space-y-3 text-sm leading-7 text-[color:var(--ink)]/80"
      >
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">Waterdog Fuel</h2>
        <p>
          Waterdog Fuel brings the gallon from the Houston rack to the first-water dock. Clear
          Lake, Kemah, Seabrook. Opens 2027. Not selling gallons yet.
        </p>
        <p>
          Reach them at{" "}
          <a
            className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
            href="mailto:orders@coastalcavaliers.com"
          >
            orders@coastalcavaliers.com
          </a>
          .
        </p>
        <p>Waterdog does not set the number on the hose.</p>
      </section>

      <XTimeline handle={handle} />
      <SiteFooter />
    </main>
  );
}
