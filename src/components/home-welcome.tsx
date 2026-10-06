"use client";

import { HOME_WELCOME } from "@/lib/home-welcome";

function findFuelNearMe() {
  document.getElementById("dock-prices")?.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector<HTMLButtonElement>("[data-testid=near-me]")?.click();
}

function StepIcon({ index }: { index: number }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "mt-0.5 size-5 shrink-0 text-[color:var(--diesel)]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (index === 0) {
    return (
      <svg {...common}>
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="M8 8.5h8M8 12.5h8M8 16.5h5" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4 9.5h16" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3.5 15.5h17l-2.2 4H5.7z" />
      <path d="M12 15.5V6.5l7 4.5-7 4.5" />
    </svg>
  );
}

function HarborWash() {
  return (
    <svg
      viewBox="0 0 640 280"
      className="aspect-[2.6/1] w-full md:aspect-[16/11]"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      data-testid="home-hero-visual"
    >
      <defs>
        <linearGradient id="home-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbf8f3" />
          <stop offset="46%" stopColor="#d7ebf7" />
          <stop offset="100%" stopColor="#8ec4e6" />
        </linearGradient>
      </defs>
      <rect width="640" height="280" rx="28" fill="url(#home-sea)" />
      <path
        d="M0 150c70-28 130 22 210 4s130-36 200-8 140 18 230-16v150H0Z"
        fill="#0b1f33"
        fillOpacity="0.05"
      />
      <path
        d="M0 168c80-24 140 26 220 6s140-34 220-6 130 16 200-18"
        fill="none"
        stroke="#0b1f33"
        strokeOpacity="0.35"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M0 198c90-22 150 28 240 8s150-32 230-4 110 14 170-16"
        fill="none"
        stroke="#2F8FD6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M0 224c100-16 160 24 250 10s150-22 230 0 100 8 160-10"
        fill="none"
        stroke="#E23B3B"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HomeWelcome() {
  return (
    <div data-testid="home-welcome" className="bg-[color:var(--cream)]">
      <section
        data-testid="home-hero"
        className="relative overflow-hidden bg-[radial-gradient(90%_80%_at_100%_-10%,rgba(47,143,214,0.16),transparent_52%),linear-gradient(180deg,#f3f8fb_0%,#fbf8f3_70%)] px-4 pb-2 pt-6 md:px-6 md:pb-6 md:pt-14"
      >
        <div className="mx-auto grid w-full max-w-7xl items-center gap-4 md:grid-cols-[minmax(0,38rem)_minmax(16rem,1fr)] md:gap-14">
          <div className="min-w-0">
            <h1
              data-testid="home-hero-headline"
              className="font-heading text-[2.625rem] leading-[1.08] text-[color:var(--navy)] md:text-5xl md:leading-[1.05] xl:text-7xl"
            >
              {HOME_WELCOME.headline}
            </h1>
            <p
              data-testid="home-hero-subhead"
              className="mt-3 max-w-xl text-base leading-6 text-[color:var(--ink)]/75 md:mt-4 md:text-lg md:leading-7"
            >
              {HOME_WELCOME.subhead}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5 md:mt-8">
              <button
                type="button"
                data-testid="find-fuel-near-me"
                onClick={findFuelNearMe}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[color:var(--navy)] px-4 text-sm font-medium text-[color:var(--cream)] hover:bg-[color:var(--navy)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
              >
                {HOME_WELCOME.findNearMe}
              </button>
              <a
                href="/report"
                data-testid="report-a-price"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[color:var(--navy)]/15 bg-white/80 px-4 text-sm font-medium text-[color:var(--navy)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)]"
              >
                {HOME_WELCOME.reportPrice}
              </a>
            </div>
          </div>
          <HarborWash />
        </div>
      </section>

      <section
        data-testid="home-how"
        aria-labelledby="home-how-heading"
        className="px-4 pb-2 pt-4 md:px-6 md:pb-4 md:pt-8"
      >
        <div className="mx-auto w-full max-w-7xl">
          <h2 id="home-how-heading" className="font-heading text-lg text-[color:var(--navy)] md:text-2xl">
            {HOME_WELCOME.howHeading}
          </h2>
          <ul className="mt-3 grid gap-3 border-t border-[color:var(--line)] pt-3 md:grid-cols-3 md:gap-8 md:pt-5">
            {HOME_WELCOME.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5">
                <StepIcon index={index} />
                <p className="text-sm leading-5 text-[color:var(--ink)]/80">{step}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export function MarinaStrip() {
  return (
    <section
      data-testid="for-marinas"
      className="border-t border-[color:var(--line)] bg-[color:var(--fog)] px-4 py-6 md:px-6 md:py-8"
    >
      <p className="mx-auto max-w-7xl text-center">
        <a
          href="/pin"
          className="font-heading text-lg leading-snug text-[color:var(--navy)] underline decoration-[color:var(--diesel)] decoration-2 underline-offset-4 hover:text-[color:var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--diesel)] md:text-xl"
        >
          {HOME_WELCOME.marinaLine}
        </a>
      </p>
    </section>
  );
}
