export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[color:var(--ink)]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="/" className="flex min-w-0 items-baseline gap-2">
          <span className="font-heading text-lg tracking-tight text-[color:var(--cream)]">
            Dock Posted
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-[color:var(--sea)] sm:inline">
            Sabine to Key West
          </span>
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 hover:text-[color:var(--cream)]" href="/">
            Today
          </a>
          <a className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 hover:text-[color:var(--cream)]" href="/report">
            Report
          </a>
          <a className="rounded-md px-2.5 py-1.5 text-[color:var(--cream)]/75 hover:text-[color:var(--cream)]" href="/safe-fuel">
            Safe fuel
          </a>
          <a
            className="hidden rounded-md px-2.5 py-1.5 text-[color:var(--sea)] sm:inline"
            href="https://onthiswater.com"
          >
            On This Water
          </a>
        </nav>
      </div>
    </header>
  );
}
