import { headers } from "next/headers";
import { BrandSpine, Wordmark } from "@/components/wordmark";
import { wholesalePasswordConfigured } from "@/lib/wholesale-auth";

const navLink =
  "inline-flex h-11 shrink-0 items-center rounded-md px-2 text-[color:var(--ink)]/75 transition hover:bg-[color:var(--navy)]/6 hover:text-[color:var(--navy)] sm:h-auto sm:px-2.5 sm:py-1.5";

export async function SiteHeader() {
  await headers();
  const wholesaleOpen = wholesalePasswordConfigured();

  return (
    <header className="sticky top-0 z-30 bg-[color:var(--cream)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-x-3 px-3 py-1.5 sm:px-4 sm:py-2.5 md:px-6">
        <a href="/" className="flex min-w-0 shrink-0 items-baseline gap-2" aria-label="Dock Posted">
          <Wordmark />
        </a>
        <nav
          className="chip-scroll flex min-w-0 flex-nowrap items-center gap-x-0.5 overflow-x-auto overscroll-x-contain text-[13px] sm:text-sm"
          aria-label="Dock Posted"
        >
          <a className={navLink} href="/#board" aria-label="The board">
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
      <BrandSpine />
    </header>
  );
}
