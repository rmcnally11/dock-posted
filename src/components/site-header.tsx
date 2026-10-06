import { NavScroll } from "@/components/nav-scroll";
import { BrandSpine, Wordmark } from "@/components/wordmark";

const navLink =
  "nav-link inline-flex h-12 shrink-0 items-center whitespace-nowrap px-2 text-[color:var(--ink)]/75 transition hover:bg-[color:var(--navy)]/6 hover:text-[color:var(--navy)] md:h-14";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 bg-[color:var(--cream)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-x-3 px-3 md:h-14 md:px-6">
        <a href="/" className="flex min-w-0 shrink-0 items-baseline gap-2" aria-label="Dock Posted">
          <Wordmark />
        </a>
        <NavScroll>
          <a className={navLink} href="/#board">
            Fuel Prices
          </a>{" "}
          <a className={navLink} href="/report">
            Report a Price
          </a>{" "}
          <a className={navLink} href="/run" data-testid="nav-run">
            Trip Fuel Cost
          </a>{" "}
          <a className={navLink} href="/safe-fuel">
            Ethanol Guide
          </a>{" "}
          <a className={navLink} href="/haul-out">
            Storm Haul-Out
          </a>{" "}
          <a className={navLink} href="/pin" data-testid="nav-pin">
            For Marinas
          </a>{" "}
          <a className={navLink} href="/about" data-testid="nav-about">
            About
          </a>
        </NavScroll>
      </div>
      <BrandSpine />
    </header>
  );
}
