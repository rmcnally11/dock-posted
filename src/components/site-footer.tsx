import { BrandSpine } from "@/components/wordmark";
import { ON_THIS_WATER } from "@/lib/sister";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={
        compact
          ? "px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[11px] leading-4 text-[color:var(--ink)]/55"
          : "px-4 py-8 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-center"
      }
    >
      {compact ? null : <BrandSpine className="mx-auto mb-4 max-w-xs" />}
      <p className={compact ? "" : "text-xs leading-5 text-[color:var(--ink)]/60"}>
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
        className={compact ? "mt-1" : "mt-2 text-xs leading-5 text-[color:var(--ink)]/50"}
      >
        <a href="https://coastalcavaliers.com" className="underline-offset-2 hover:underline">
          Waterdog Fuel. Rack to dock.
        </a>
        {" · "}
        <a href="/pin" className="underline-offset-2 hover:underline">
          The pin
        </a>
        {" · "}
        <a href="/run" className="underline-offset-2 hover:underline">
          The run
        </a>
        {" · "}
        <a href="/how" className="underline-offset-2 hover:underline">
          How it works
        </a>
        {" · "}
        <a href="/haul-out" className="underline-offset-2 hover:underline">
          Named storm
        </a>
      </p>
      <p className={compact ? "mt-1" : "mt-2 text-xs leading-5 text-[color:var(--ink)]/50"}>
        <a href={ON_THIS_WATER} className="underline-offset-2 hover:underline">
          On This Water
        </a>
        . Tide and wind on the same coast.
      </p>
    </footer>
  );
}
