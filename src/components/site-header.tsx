import { headers } from "next/headers";
import { wholesalePasswordConfigured } from "@/lib/wholesale-auth";

const navLink =
  "rounded-md px-2 py-1.5 text-[color:var(--cream)]/75 transition hover:bg-[color:var(--cream)]/6 hover:text-[color:var(--cream)] sm:px-2.5";

export async function SiteHeader() {
  await headers();
  const wholesaleOpen = wholesalePasswordConfigured();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[color:var(--ink)]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 sm:px-4 md:px-6">
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
        <nav
          className="flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0.5 text-[13px] sm:text-sm"
          aria-label="Dock Posted"
        >
          <a className={navLink} href="/" aria-label="The board">
            The board
          </a>
          <a className={navLink} href="/haul-out" aria-label="Named storm">
            Named storm
          </a>
          <a className={navLink} href="/report" aria-label="Post a number">
            Post a number
          </a>
          <a className={navLink} href="/safe-fuel" aria-label="E15">
            E15
          </a>
          <a className={navLink} href="/about" data-testid="nav-about" aria-label="About">
            About
          </a>
          {wholesaleOpen ? (
            <a
              className={navLink}
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
