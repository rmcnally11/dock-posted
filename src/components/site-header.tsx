import { headers } from "next/headers";
import { BrandSpine, Wordmark } from "@/components/wordmark";
import { wholesalePasswordConfigured } from "@/lib/wholesale-auth";

const navLink =
  "nav-link inline-flex h-12 shrink-0 items-center whitespace-nowrap px-2 text-[color:var(--ink)]/75 transition hover:bg-[color:var(--navy)]/6 hover:text-[color:var(--navy)] md:h-14";

export async function SiteHeader() {
  await headers();
  const wholesaleOpen = wholesalePasswordConfigured();

  return (
    <header className="sticky top-0 z-30 bg-[color:var(--cream)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-x-3 px-3 md:h-14 md:px-6">
        <a href="/" className="flex min-w-0 shrink-0 items-baseline gap-2" aria-label="Dock Posted">
          <Wordmark />
        </a>
        <nav
          className="chip-scroll flex min-w-0 flex-1 items-center justify-end gap-x-0.5 overflow-x-auto"
          aria-label="Dock Posted"
        >
          <a className={navLink} href="/#board" aria-label="Today">
            Today
          </a>
          <a className={navLink} href="/haul-out" aria-label="Yard seats">
            Yard seats
          </a>
          <a className={navLink} href="/pin" data-testid="nav-pin" aria-label="Your dock">
            Your dock
          </a>
          <a className={navLink} href="/run" data-testid="nav-run" aria-label="This trip">
            This trip
          </a>
          <a className={navLink} href="/report" aria-label="I was there">
            I was there
          </a>
          <a className={navLink} href="/safe-fuel" aria-label="What’s in the hose">
            What’s in the hose
          </a>
          <a className={navLink} href="/about" data-testid="nav-about" aria-label="Who writes this">
            Who writes this
          </a>
          {wholesaleOpen ? (
            <a className="sr-only" href="/wholesale" data-testid="nav-wholesale">
              Locked door
            </a>
          ) : null}
        </nav>
      </div>
      <BrandSpine />
    </header>
  );
}
