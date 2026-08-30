export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={
        compact
          ? "border-t border-[color:var(--line)] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[11px] leading-4 text-[color:var(--cream)]/45"
          : "border-t border-[color:var(--line)] px-4 py-8 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-center"
      }
    >
      <p className={compact ? "" : "text-xs leading-5 text-[color:var(--cream)]/50"}>
        If they didn’t post it, it’s Call.{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="underline-offset-2 hover:underline"
        >
          © OpenStreetMap
        </a>
      </p>
      <p
        data-testid="waterdog-credit"
        className={compact ? "mt-1" : "mt-2 text-xs leading-5 text-[color:var(--cream)]/45"}
      >
        <a href="https://coastalcavaliers.com" className="underline-offset-2 hover:underline">
          Waterdog Fuel. Rack to dock.
        </a>
      </p>
    </footer>
  );
}
