"use client";

import { useEffect, useState } from "react";
import { NavScroll } from "@/components/nav-scroll";
import { BrandSpine, Wordmark } from "@/components/wordmark";

const NAV_LINKS = [
  { href: "/board", label: "Fuel Prices" },
  { href: "/report", label: "Report a Price" },
  { href: "/run", label: "Trip Fuel Cost", testId: "nav-run" },
  { href: "/safe-fuel", label: "Ethanol Guide" },
  { href: "/haul-out", label: "Storm Haul-Out" },
  { href: "/pin", label: "For Marinas", testId: "nav-pin" },
  { href: "/about", label: "About", testId: "nav-about" },
  { href: "/wholesale", label: "Wholesale", testId: "nav-wholesale" },
] as const;

const navLink =
  "nav-link inline-flex h-12 shrink-0 items-center whitespace-nowrap px-2 text-[color:var(--ink)]/75 transition hover:bg-[color:var(--navy)]/6 hover:text-[color:var(--navy)] md:h-14";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 bg-[color:var(--cream)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-x-3 px-3 md:h-14 md:px-6">
        <a href="/" className="flex min-w-0 shrink-0 items-baseline gap-2" aria-label="Dock Posted">
          <Wordmark />
        </a>
        <div className="hidden min-w-0 flex-1 md:flex">
          <NavScroll>
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                className={navLink}
                href={item.href}
                data-testid={"testId" in item ? item.testId : undefined}
              >
                {item.label}{" "}
              </a>
            ))}
          </NavScroll>
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-[color:var(--navy)] hover:bg-[color:var(--navy)]/6 md:hidden"
          aria-expanded={open}
          aria-controls="site-menu"
          data-testid="nav-menu"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>
      <BrandSpine />
      <nav
        id="site-menu"
        data-testid="nav-menu-list"
        aria-label="Dock Posted"
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 flex flex-col border-b border-[color:var(--line)] bg-[color:var(--cream)] px-3 py-2 md:hidden"
      >
        {NAV_LINKS.map((item) => (
          <a
            key={item.href}
            className="inline-flex min-h-12 items-center px-2 text-base text-[color:var(--navy)]"
            href={item.href}
            data-testid={"testId" in item ? item.testId : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}{" "}
          </a>
        ))}
      </nav>
    </header>
  );
}
