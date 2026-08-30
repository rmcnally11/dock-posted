export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-harbor/95 text-foam backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-wake text-xs font-bold tracking-tight">
            DP
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg leading-none">Dock Posted</span>
            <span className="block text-[11px] uppercase tracking-[0.16em] text-foam/60">
              Gulf + Keys fuel
            </span>
          </span>
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a className="rounded-md px-3 py-2 text-foam/80 hover:bg-white/5 hover:text-foam" href="/">
            Map
          </a>
          <a className="rounded-md px-3 py-2 text-foam/80 hover:bg-white/5 hover:text-foam" href="/report">
            Report
          </a>
          <a className="rounded-md px-3 py-2 text-foam/80 hover:bg-white/5 hover:text-foam" href="/safe-fuel">
            Safe fuel
          </a>
        </nav>
      </div>
    </header>
  );
}
