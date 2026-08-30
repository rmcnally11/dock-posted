export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-harbor/15 bg-paper print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <a href="/" className="min-w-0" data-testid="wordmark">
          <span className="inline-block border-2 border-harbor bg-sand px-2.5 py-1 font-serif text-[1.05rem] leading-none text-harbor">
            Dock Posted
          </span>
        </a>
        <nav className="flex items-center gap-0.5 text-sm">
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/">
            Board
          </a>
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/haul-out">
            Haul-out
          </a>
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/report">
            Report
          </a>
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/safe-fuel">
            Safe fuel
          </a>
        </nav>
      </div>
    </header>
  );
}
