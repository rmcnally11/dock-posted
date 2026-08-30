export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={
        compact
          ? "border-t border-[color:var(--line)] px-3 py-2 text-[11px] leading-4 text-[color:var(--cream)]/45"
          : "border-t border-[color:var(--line)] px-4 py-8 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-center"
      }
    >
      <p className={compact ? "" : "text-xs leading-5 text-[color:var(--cream)]/50"}>
        What the boater saw. Call the dock.
      </p>
    </footer>
  );
}
