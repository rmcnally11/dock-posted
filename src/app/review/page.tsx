import { approveReview, loginReview, logoutReview, rejectReview } from "@/app/review/actions";
import { formatDate, formatGallonPrice } from "@/lib/format";
import { gradeLabel } from "@/lib/price-report";
import { readDocks, readReviewQueue } from "@/lib/store";
import { isReviewAuthed } from "./gate";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const params = await searchParams;
  const authed = await isReviewAuthed();
  if (!authed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-16">
        <h1 className="font-heading text-2xl text-[color:var(--navy)]">Reports waiting</h1>
        <p className="mt-2 text-sm text-[color:var(--ink)]/70">Check a number before it goes on the board.</p>
        <form action={loginReview} className="mt-8 space-y-4" autoComplete="off" data-testid="review-login">
          {params.error ? <p className="text-sm text-[#8a2c12]">{params.error}</p> : null}
          <label className="block text-sm">
            <span className="text-black/60">Password</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="mt-1 h-11 w-full border border-black/20 bg-white px-3 text-base md:text-sm"
            />
          </label>
          <button type="submit" className="h-11 border border-black bg-black px-4 text-sm text-white">
            Continue
          </button>
        </form>
      </main>
    );
  }

  const [queue, docks] = await Promise.all([readReviewQueue(), readDocks()]);
  const waiting = queue.submissions.filter((report) => report.status === "pending");
  const dockById = new Map(docks.map((dock) => [dock.id, dock]));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8" data-testid="review-queue">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-[color:var(--navy)]">Reports waiting</h1>
          <p className="mt-2 text-sm text-[color:var(--ink)]/70">
            {waiting.length === 0 ? "Nothing waiting." : `${waiting.length} waiting for a look.`}
          </p>
        </div>
        <form action={logoutReview}>
          <button type="submit" className="h-11 border border-black/20 bg-white px-3 text-sm">
            Lock
          </button>
        </form>
      </div>
      {params.error ? <p className="mt-4 text-sm text-[#8a2c12]">{params.error}</p> : null}
      {params.done === "approved" ? (
        <p className="mt-4 text-sm text-[color:var(--navy)]">On the board.</p>
      ) : null}
      {params.done === "rejected" ? (
        <p className="mt-4 text-sm text-[color:var(--navy)]">Set aside. It stays off the board.</p>
      ) : null}

      <ul className="mt-8 space-y-6">
        {waiting.map((report) => {
          const dock = dockById.get(report.dockId);
          const hose = gradeLabel(report);
          return (
            <li
              key={report.id}
              data-testid={`review-card-${report.id}`}
              className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-5"
            >
              <p className="text-sm text-[color:var(--ink)]/60">
                {dock ? `${dock.city} ${dock.state}` : report.dockId}
              </p>
              <h2 className="mt-1 font-heading text-xl text-[color:var(--navy)]">
                {dock?.name ?? report.dockId}
              </h2>
              <p className="mt-3 text-sm">
                {hose} · {formatGallonPrice(report.pricePerGallon)} · {formatDate(report.seenAt)}
              </p>
              <p className="mt-1 text-sm text-[color:var(--ink)]/70">
                {report.marinaOwned ? "I run this dock." : "I fueled here."}
              </p>
              {report.note ? <p className="mt-2 text-sm">{report.note}</p> : null}
              {report.photoPath ? (
                // The photo route checks the review cookie. The image optimizer would fetch it without that cookie.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/review/photo/${report.id}`}
                  alt={`Photo from ${dock?.name ?? "the dock"}`}
                  className="mt-4 max-h-80 w-full rounded-md border border-[color:var(--line)] bg-white object-contain"
                />
              ) : (
                <p className="mt-4 text-sm text-[color:var(--ink)]/55">No photo.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={approveReview}>
                  <input type="hidden" name="id" value={report.id} />
                  <button
                    type="submit"
                    data-testid={`review-approve-${report.id}`}
                    className="h-11 border border-black bg-black px-4 text-sm text-white"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectReview}>
                  <input type="hidden" name="id" value={report.id} />
                  <button
                    type="submit"
                    data-testid={`review-reject-${report.id}`}
                    className="h-11 border border-black/20 bg-white px-4 text-sm"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
