export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-harbor bg-sand/95 text-harbor backdrop-blur paper-grain">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <a href="/" className="min-w-0 leading-tight">
          <span className="block font-serif text-xl leading-none text-harbor">Dock Posted</span>
          <span className="mt-1 block text-[11px] font-medium text-harbor/55">
            What the dock posted
          </span>
        </a>
        <nav className="flex items-center gap-0.5 text-sm">
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/">
            Board
          </a>
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/report">
            Report
          </a>
          <a className="rounded-sm px-2.5 py-2 text-harbor/75 hover:bg-harbor/5 hover:text-harbor" href="/safe-fuel">
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
