import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { dropFiledPin, submitDeskPassword } from "@/app/desk/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DESK_BASE_URL } from "@/lib/airtable-desk";
import { DESK_COOKIE, deskPasswordConfigured, deskSessionValid } from "@/lib/desk-auth";
import { PIN_PRICE_LABEL, pinPitch, weekOfIso } from "@/lib/income";
import { readDocks, readIncomeStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monday list",
  description: "Eight docks to phone. Not the public page.",
  robots: { index: false, follow: false },
};

export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!deskPasswordConfigured()) notFound();
  const jar = await cookies();
  const open = deskSessionValid(jar.get(DESK_COOKIE)?.value);
  const params = await searchParams;

  if (!open) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
        <h1 className="font-heading text-3xl text-[color:var(--navy)]">Monday list</h1>
        <p className="mt-2 text-sm text-[color:var(--ink)]/70">Locked door.</p>
        <form action={submitDeskPassword} className="mt-6 space-y-4">
          {params.error ? (
            <p className="rounded-md bg-[color:var(--signal)]/10 px-3 py-2 text-sm text-[color:var(--signal)]">
              {params.error}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit">Open</Button>
        </form>
      </main>
    );
  }

  const [docks, income] = await Promise.all([readDocks(), readIncomeStore()]);
  const weekOf = weekOfIso();
  const calls = income.calls.filter((call) => call.weekOf === weekOf);
  const filed = income.pins.filter((pin) => pin.status === "filed" || pin.status === "billed");
  const paid = income.pins.filter((pin) => pin.status === "paid");
  const watches = income.watches.filter((watch) => watch.status !== "stopped");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6" data-testid="desk">
      <p className="kicker text-[color:var(--signal)]">
        Monday list
      </p>
      <h1 className="page-title mt-3 text-[color:var(--navy)]">Eight docks to phone</h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--ink)]/70">
        Week of {weekOf}. {PIN_PRICE_LABEL}. Home waters first. We don’t sell a gallon.
      </p>
      <p className="mt-3 text-sm">
        <a
          className="text-[color:var(--diesel)] underline decoration-[color:var(--diesel)]/40 underline-offset-2"
          href={DESK_BASE_URL}
        >
          Airtable desk
        </a>
      </p>

      <section className="mt-8">
        <h2 className="font-heading text-2xl text-[color:var(--navy)]">This week</h2>
        {calls.length === 0 ? (
          <p className="mt-3 text-sm text-[color:var(--ink)]/60">No calls queued. Cron writes Monday.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {calls.map((call) => {
              const dock = docks.find((row) => row.id === call.dockId);
              return (
                <li key={call.id} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--fog)] p-4">
                  <p className="font-heading text-lg text-[color:var(--navy)]">{call.dockName}</p>
                  <p className="text-sm text-[color:var(--ink)]/70">
                    {call.water}
                    {call.phone ? ` · ${call.phone}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]/80">
                    {pinPitch(call.dockName)}
                  </p>
                  {dock?.phone ? (
                    <p className="mt-2 text-sm">
                      <a className="text-[color:var(--diesel)] underline-offset-2 hover:underline" href={`tel:${call.phone}`}>
                        Call
                      </a>
                      {" · "}
                      <a
                        className="text-[color:var(--diesel)] underline-offset-2 hover:underline"
                        href={`/pin?dock=${call.dockId}`}
                      >
                        File
                      </a>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-heading text-xl text-[color:var(--navy)]">Pins filed</h2>
          <p className="mt-1 text-sm text-[color:var(--ink)]/60">{filed.length} open. {paid.length} paid.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {income.pins.slice(0, 12).map((pin) => (
              <li key={pin.id} className="flex items-baseline justify-between gap-3">
                <span>
                  {pin.dockName} · {pin.status} · {pin.contactName}
                </span>
                {pin.status === "filed" || pin.status === "billed" ? (
                  <form action={dropFiledPin}>
                    <input type="hidden" name="pinId" value={pin.id} />
                    <button
                      type="submit"
                      className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--signal)] underline-offset-2 hover:underline"
                    >
                      Drop
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-xl text-[color:var(--navy)]">Watches</h2>
          <p className="mt-1 text-sm text-[color:var(--ink)]/60">{watches.length} on the list.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {watches.slice(0, 12).map((watch) => (
              <li key={watch.id}>
                {watch.email} · {watch.status}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
