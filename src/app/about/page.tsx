import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { XTimeline } from "@/components/x-timeline";
import { publicXHandle } from "@/lib/x-handle";

export const metadata: Metadata = {
  title: "About",
  description: "We write what they posted. If they didn’t, it’s Call.",
};

export default function AboutPage() {
  const handle = publicXHandle();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
      <h1
        data-testid="about-headline"
        className="font-heading text-4xl text-[color:var(--cream)] md:text-5xl"
      >
        About
      </h1>
      <p
        data-testid="about-deck"
        className="mt-2 max-w-2xl text-sm text-[color:var(--cream)]/65"
      >
        We write what they posted. If they didn’t, it’s Call.
      </p>
      <Waterline className="mt-3" />

      <section
        data-testid="about-body"
        className="mt-8 max-w-2xl space-y-3 text-sm leading-7 text-[color:var(--cream)]/80"
      >
        <p>
          Dock Posted is the number on the board at the fuel dock. Sabine to Key West, then
          the rest of the saltwater coast.
        </p>
        <p>We don’t sell a gallon. We don’t lift a boat. A blank stays Call.</p>
        <p>
          Named storm is leftover seats in the shed or on the lot. When they name it, you
          call the yard.
        </p>
        <p>Wholesale is what it cost and what they posted. That’s a locked door.</p>
        <p>
          If you were at the dock, send the number.{" "}
          <a
            className="text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40 underline-offset-2"
            href="/report"
          >
            Post a number
          </a>
          .
        </p>
      </section>

      <XTimeline handle={handle} />
      <SiteFooter />
    </main>
  );
}
