import type { Metadata } from "next";
import { ReportForm } from "@/components/report-form";
import { SiteFooter } from "@/components/site-footer";
import { Waterline } from "@/components/waterline";
import { matchesSearch } from "@/lib/board-query";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What did they post",
  description: "What did they post. If they did not post, it stays Call.",
};

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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--copper)]">
        The board
      </p>
      <h1 className="mt-1 font-heading text-4xl text-[color:var(--cream)] md:text-5xl">
        What did they post
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--cream)]/65">
        When the truck comes, or when they change the board. If they did not post, it stays Call.
      </p>
      <Waterline className="mt-3" />

      <form action="/report" method="get" className="mt-6 flex max-w-xl gap-2">
        {params.dock ? <input type="hidden" name="dock" value={params.dock} /> : null}
        <label className="sr-only" htmlFor="report-search">
          Filter marinas
        </label>
        <input
          id="report-search"
          name="q"
          defaultValue={q}
          placeholder="Find a marina or town"
          className="h-10 min-w-0 flex-1 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md border border-[color:var(--line)] bg-[color:var(--panel)] px-3 text-sm"
        >
          Find
        </button>
      </form>

      <div className="mt-6 max-w-xl rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5">
        {params.error ? (
          <p className="mb-4 rounded-md bg-[color:var(--copper)]/10 px-3 py-2 text-sm text-[color:var(--copper)]">
            {params.error}
          </p>
        ) : null}
        {visible.length === 0 ? (
          <p className="text-sm text-[color:var(--cream)]/70">
            No marina by that name. Try Seabrook, Key Largo, or Beaufort.
          </p>
        ) : (
          <ReportForm docks={visible} initialDockId={params.dock} />
        )}
      </div>
      <p className="mt-6 text-sm text-[color:var(--cream)]/55">
        Wrong hose?{" "}
        <a
          className="text-[color:var(--sea)] underline decoration-[color:var(--sea)]/40 underline-offset-2"
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
