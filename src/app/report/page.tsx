import Link from "next/link";
import { ReportForm } from "@/components/report-form";
import { readDocks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ dock?: string }>;
}) {
  const docks = await readDocks();
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wake-deep">
        Public report
      </p>
      <h1 className="mt-2 font-serif text-4xl text-harbor">Report a price</h1>
      <p className="mt-3 text-sm leading-6 text-harbor/70">
        If you just fueled or read the board, post it. This updates the dock card after
        refresh. No account. Invented numbers get the whole map ignored — only post what
        you saw.
      </p>
      <div className="mt-8 rounded-2xl border border-harbor/10 bg-white p-5 shadow-sm">
        {docks.length === 0 ? (
          <p className="text-sm text-harbor/70">
            No marinas loaded. Run <code>npm run seed</code> and reload.
          </p>
        ) : (
          <ReportForm docks={docks} initialDockId={params.dock} />
        )}
      </div>
      <p className="mt-6 text-sm text-harbor/55">
        Need the ethanol rules first?{" "}
        <Link className="text-wake underline-offset-2 hover:underline" href="/safe-fuel">
          Read safe fuel
        </Link>
        .
      </p>
    </main>
  );
}
