import { cn } from "@/lib/utils";

export type WalkSketch = "pin" | "tank" | "mail" | "boat" | "yards" | "phone" | "board";

export type WalkStep = {
  title: string;
  body: string;
  sketch: WalkSketch;
};

function Sketch({ kind }: { kind: WalkSketch }) {
  const common = {
    viewBox: "0 0 160 96",
    className: "h-24 w-full text-[color:var(--navy)]",
    "aria-hidden": true as const,
  };

  if (kind === "pin") {
    return (
      <svg {...common}>
        <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d="M80 28c-8 0-14 6-14 14 0 12 14 26 14 26s14-14 14-26c0-8-6-14-14-14z" fill="none" stroke="var(--signal)" strokeWidth="1.6" />
        <circle cx="80" cy="42" r="4" fill="var(--signal)" />
        <text x="80" y="72" textAnchor="middle" fontSize="9" fill="currentColor">
          $4.89
        </text>
      </svg>
    );
  }

  if (kind === "tank") {
    return (
      <svg {...common}>
        <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
        <rect x="36" y="32" width="40" height="36" rx="3" fill="none" stroke="var(--diesel)" strokeWidth="1.5" />
        <path d="M44 44h24M44 54h16" stroke="currentColor" strokeWidth="1.2" />
        <text x="112" y="48" textAnchor="middle" fontSize="10" fill="currentColor">
          40 gal
        </text>
        <text x="112" y="64" textAnchor="middle" fontSize="10" fill="var(--diesel)">
          $211
        </text>
      </svg>
    );
  }

  if (kind === "mail") {
    return (
      <svg {...common}>
        <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
        <rect x="44" y="32" width="72" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M44 32l36 18 36-18" fill="none" stroke="var(--diesel)" strokeWidth="1.4" />
      </svg>
    );
  }

  if (kind === "boat") {
    return (
      <svg {...common}>
        <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d="M40 58h80l-10 10H50z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M70 58V34l28 12-28 12" fill="none" stroke="var(--diesel)" strokeWidth="1.4" />
      </svg>
    );
  }

  if (kind === "yards") {
    return (
      <svg {...common}>
        <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d="M36 62V44l20-12 20 12v18H36z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M86 62V48l16-10 16 10v14H86z" fill="none" stroke="var(--diesel)" strokeWidth="1.4" />
      </svg>
    );
  }

  if (kind === "phone") {
    return (
      <svg {...common}>
        <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
        <rect x="64" y="24" width="32" height="52" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="80" cy="68" r="2" fill="var(--signal)" />
        <path d="M70 34h20" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="18" y="14" width="124" height="68" rx="6" fill="var(--cream)" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 3" />
      <circle cx="58" cy="48" r="7" fill="var(--signal)" />
      <circle cx="86" cy="48" r="7" fill="var(--diesel)" />
      <circle cx="114" cy="48" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function HowItWorks({
  heading,
  intro,
  steps,
  testId = "how-it-works",
  className,
}: {
  heading?: string;
  intro?: string;
  steps: WalkStep[];
  testId?: string;
  className?: string;
}) {
  return (
    <section data-testid={testId} className={cn("mt-8 max-w-4xl", className)}>
      {heading ? (
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">{heading}</h2>
      ) : null}
      {intro ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink)]/70">{intro}</p>
      ) : null}
      <ol
        className={cn(
          "mt-5 grid gap-3 sm:grid-cols-2",
          steps.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {steps.map((step, index) => (
          <li
            key={`${step.title}-${index}`}
            className="flex flex-col rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--fog)]/70 p-3"
          >
            <Sketch kind={step.sketch} />
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--diesel)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-1 font-heading text-lg leading-6 text-[color:var(--navy)]">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]/70">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const PIN_WALK: WalkStep[] = [
  {
    title: "Pick your dock",
    body: "Tell us which marina you run. That pin on the board becomes yours.",
    sketch: "board",
  },
  {
    title: "You write the price",
    body: "When the truck comes, or when you change the board. Not every morning.",
    sketch: "pin",
  },
  {
    title: "Boats see it first",
    body: "Someone leaving the ramp sees what you posted. If you have not written it, they see Call.",
    sketch: "boat",
  },
];

export const RUN_WALK: WalkStep[] = [
  {
    title: "Pick the water",
    body: "Galveston Bay, the Keys, or the coast you fish. Charter or trailer.",
    sketch: "board",
  },
  {
    title: "Enter the tank",
    body: "Gallons you will burn, or GPH and hours. Same math either way.",
    sketch: "tank",
  },
  {
    title: "See what they posted",
    body: "Posted dollars for that tank. If a dock has not written a number, it stays Call.",
    sketch: "pin",
  },
  {
    title: "Get the next post",
    body: "Leave an email if you want a note when a dock on that water posts. Not a text.",
    sketch: "mail",
  },
];

export const STORM_WALK: WalkStep[] = [
  {
    title: "File the boat",
    body: "Length, beam, home dock. We keep one page ready before the cone has a name.",
    sketch: "boat",
  },
  {
    title: "Two yards that fit",
    body: "A primary and a backup that can take her. We do not invent a hole.",
    sketch: "yards",
  },
  {
    title: "When they name it, we text what’s left",
    body: "You get leftover indoor and lot seats, plus the yard phone.",
    sketch: "mail",
  },
  {
    title: "You call the yard. We don’t lift her.",
    body: "We are not the yard. We do not haul, store, or insure.",
    sketch: "phone",
  },
];
