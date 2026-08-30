import type { Metadata } from "next";
import { BrandPhoto } from "@/components/brand-photo";
import { ReportForm } from "@/components/report-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { matchesSearch } from "@/lib/board-query";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a number",
  description: "You were there. What did they have up.",
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ dock?: string; error?: string; q?: string; who?: string }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const visible = q.length >= 2 ? docks.filter((dock) => matchesSearch(dock, q)) : docks;

  return (
    <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col overflow-x-hidden px-4 py-4 md:px-6 lg:py-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--signal)]">
        The board
      </p>
      <h1 className="mt-1 font-heading text-2xl text-[color:var(--navy)] lg:text-5xl">
        Post a number
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        You were there. What did they have up.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/55">
        Post the number. Save the next boat a phone call.
      </p>
      <Waterline className="mt-3 hidden lg:block" />
      <BrandPhoto name="board" className="mt-6 aspect-[16/9] w-full max-w-xl" />

      <form action="/report" method="get" className="mt-6 flex max-w-xl gap-2">
        {params.dock ? <input type="hidden" name="dock" value={params.dock} /> : null}
        {params.who ? <input type="hidden" name="who" value={params.who} /> : null}
        <label className="sr-only" htmlFor="report-search">
          Filter marinas
        </label>
        <input
          id="report-search"
          name="q"
          defaultValue={q}
          placeholder="Find a marina or town"
          className="h-11 min-w-0 flex-1 rounded-md border border-[color:var(--line)] bg-white px-3 text-base lg:text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-[color:var(--line)] bg-[color:var(--fog)] px-3 text-sm"
        >
          Find
        </button>
      </form>

      <div className="mt-6 max-w-xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5">
        {params.error ? (
          <p className="mb-4 rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
            {params.error}
          </p>
        ) : null}
        {visible.length === 0 ? (
          <p className="text-sm text-[color:var(--ink)]/70">
            No marina by that name. Try Seabrook, Key Largo, or Beaufort.
          </p>
        ) : (
          <ReportForm docks={visible} initialDockId={params.dock} initialWho={params.who} />
        )}
      </div>
      <p className="mt-6 text-sm text-[color:var(--ink)]/55">
        Wrong hose?{" "}
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href="/safe-fuel"
        >
          E15 is not for boats
        </a>
        .
      </p>
      <SiteFooter />
    </main>
  );
}
