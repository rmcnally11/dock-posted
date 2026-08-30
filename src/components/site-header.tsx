import { headers } from "next/headers";
import { wholesalePasswordConfigured } from "@/lib/wholesale-auth";

export async function SiteHeader() {
  await headers();
  const wholesaleOpen = wholesalePasswordConfigured();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[color:var(--ink)]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="/" className="flex min-w-0 items-baseline gap-2" aria-label="Dock Posted">
          <span
            data-testid="wordmark"
            className="font-heading text-lg tracking-tight text-[color:var(--cream)]"
          >
            Dock Posted
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-[color:var(--sea)] sm:inline">
            Sabine to Key West
          </span>
        </a>
        <nav className="flex items-center gap-1 text-sm" aria-label="Dock Posted">
          <a
            className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 transition hover:bg-[color:var(--cream)]/6 hover:text-[color:var(--cream)]"
            href="/"
            aria-label="The board"
          >
            The board
          </a>
          <a
            className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 transition hover:bg-[color:var(--cream)]/6 hover:text-[color:var(--cream)]"
            href="/haul-out"
            aria-label="Named storm"
          >
            Named storm
          </a>
          <a
            className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 transition hover:bg-[color:var(--cream)]/6 hover:text-[color:var(--cream)]"
            href="/report"
            aria-label="Post a number"
          >
            Post a number
          </a>
          <a
            className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 transition hover:bg-[color:var(--cream)]/6 hover:text-[color:var(--cream)]"
            href="/safe-fuel"
            aria-label="E15"
          >
            E15
          </a>
          {wholesaleOpen ? (
            <a
              className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 transition hover:bg-[color:var(--cream)]/6 hover:text-[color:var(--cream)]"
              href="/wholesale"
              data-testid="nav-wholesale"
              aria-label="Wholesale"
            >
              Wholesale
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
