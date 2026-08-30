import { ReportForm } from "@/components/report-form";
import { SiteFooter } from "@/components/site-footer";
import { matchesSearch } from "@/lib/board-query";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ dock?: string; error?: string; q?: string }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const visible = q.length >= 2 ? docks.filter((dock) => matchesSearch(dock, q)) : docks;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8">
      <p className="kicker text-wake-deep">From the pump</p>
      <h1 className="mt-2 font-serif text-4xl text-harbor">You just fueled</h1>
      <p className="mt-3 text-sm leading-6 text-harbor/70">
        Post the number on the hose. Clear Lake, Islamorada, or wherever you tied up.
      </p>

      <form action="/report" method="get" className="mt-6 flex gap-2">
        {params.dock ? <input type="hidden" name="dock" value={params.dock} /> : null}
        <label className="sr-only" htmlFor="report-search">
          Filter marinas
        </label>
        <input
          id="report-search"
          name="q"
          defaultValue={q}
          placeholder="Find a marina or town"
          className="h-10 min-w-0 flex-1 border border-harbor/15 bg-white px-3 text-sm"
        />
        <button type="submit" className="h-10 border border-harbor/20 bg-sand px-3 text-sm">
          Find
        </button>
      </form>

      <div className="mt-6 border border-harbor/12 bg-white p-5">
        {params.error ? (
          <p className="mb-4 bg-rust/10 px-3 py-2 text-sm text-rust">{params.error}</p>
        ) : null}
        {visible.length === 0 ? (
          <p className="text-sm text-harbor/70">
            No marina by that name. Try Kemah, Key Largo, or Beaufort.
          </p>
        ) : (
          <ReportForm docks={visible} initialDockId={params.dock} />
        )}
      </div>
      <p className="mt-6 text-sm text-harbor/55">
        Wrong hose?{" "}
        <a className="text-wake underline-offset-2 hover:underline" href="/safe-fuel">
          E15 is not for boats
        </a>
        .
      </p>
      <SiteFooter />
    </main>
  );
}
