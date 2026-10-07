import type { Route } from "next";
import { redirect } from "next/navigation";
import { HomeWelcome, MarinaStrip } from "@/components/home-welcome";
import { PostedHome } from "@/components/posted-home";
import { SiteFooter } from "@/components/site-footer";
import { legacyHomeBoardPath } from "@/lib/board-query";
import { DATE_UNKNOWN, HOME_AREAS, homeAreaHref, homeCards, parseHomeArea, type PostedCard } from "@/lib/posted";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Unpriced docks are a name and a phone. Do not ship grade rows or "Date unknown". */
function cardForHome(card: PostedCard): PostedCard {
  if (!card.hasPrice) return { ...card, lines: [] };
  return {
    ...card,
    lines: card.lines.map((line) => (line.asOf === DATE_UNKNOWN ? { ...line, asOf: "" } : line)),
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    corridor?: string;
    state?: string;
    region?: string;
    q?: string;
    e0?: string;
    fresh?: string;
    dock?: string;
    reported?: string;
    waters?: string;
  }>;
}) {
  const params = await searchParams;
  const legacy = legacyHomeBoardPath(params);
  if (legacy) redirect(legacy as Route);

  const docks = await readDocks();
  const area = parseHomeArea(params.waters);
  const cards = homeCards(docks).map(cardForHome);
  const areaLinks = [
    { id: "all" as const, label: "All", href: homeAreaHref(null, params) },
    ...HOME_AREAS.map((item) => ({
      id: item.id,
      label: item.label,
      href: homeAreaHref(item.id, params),
    })),
  ];

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <script
        dangerouslySetInnerHTML={{
          __html:
            'function leaveBoardHash(){if(location.pathname==="/"&&location.hash==="#board")location.replace("/board#board")}leaveBoardHash();addEventListener("hashchange",leaveBoardHash)',
        }}
      />
      <HomeWelcome />
      <PostedHome cards={cards} area={area} links={areaLinks} />
      <div className="bg-[color:var(--cream)] px-4 pb-10 md:px-6">
        <p className="mx-auto w-full max-w-7xl">
          <a
            data-testid="see-every-dock"
            href="/board"
            className="inline-flex min-h-12 items-center text-base font-medium text-[color:var(--navy)] underline decoration-[color:var(--diesel)] decoration-2 underline-offset-4"
          >
            See every fuel dock from Texas to Florida
          </a>
        </p>
      </div>
      <MarinaStrip />
      <SiteFooter />
    </main>
  );
}
