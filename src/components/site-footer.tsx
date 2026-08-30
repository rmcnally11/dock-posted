export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={
        compact
          ? "border-t border-harbor/10 px-3 py-2 text-[11px] leading-4 text-harbor/45"
          : "border-t border-harbor/15 px-4 py-8 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-center"
      }
    >
      <p className={compact ? "" : "text-xs leading-5 text-harbor/50"}>
        A public board, not a fuel desk. Call the dock. We do not sell gallons.
      </p>
    </footer>
  );
}
