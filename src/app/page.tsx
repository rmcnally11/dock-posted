import { DockBoard } from "@/components/dock-board";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ reported?: string }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <section className="border-b border-harbor/10 bg-sand px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wake-deep">
              Two corridors only
            </p>
            <h1 className="mt-1 font-serif text-3xl text-harbor md:text-4xl">
              What the dock last posted
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-harbor/70 md:text-base">
              Galveston Bay / Clear Lake / Kemah / Seabrook, and Key Largo / Upper Keys.
              Waterway Guide still says call ahead. We never invent a price.
            </p>
          </div>
          <p className="text-xs text-harbor/55 md:max-w-xs md:text-right">
            Dock Posted does not sell gallons, broker fuel, or bid racks. Pins are public
            snapshots plus boater reports.
          </p>
        </div>
        {params.reported ? (
          <p className="mx-auto mt-3 max-w-6xl rounded-md bg-fresh/10 px-3 py-2 text-sm text-fresh">
            Report saved. The map now uses your last-verified time for that dock.
          </p>
        ) : null}
      </section>
      <DockBoard docks={docks} />
    </main>
  );
}
