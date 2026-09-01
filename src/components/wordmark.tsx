import { Waterline } from "@/components/waterline";
import { cn } from "@/lib/utils";

export function Wordmark({
  invert = false,
  className = "",
}: {
  invert?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-baseline gap-2", className)}>
      <span
        data-testid="wordmark"
        className={cn(
          "wordmark",
          invert ? "text-[color:var(--cream)]" : "text-[color:var(--navy)]",
        )}
      >
        Dock Posted
      </span>
      <span
        className={cn(
          "geo-lockup hidden sm:inline",
          invert ? "text-[color:var(--cream)]/55" : "text-[color:var(--diesel)]",
        )}
      >
        Sabine to Key West
      </span>
    </span>
  );
}

export function Masthead({ className = "" }: { className?: string }) {
  return (
    <div
      data-testid="masthead"
      className={cn("flex max-w-xl flex-col items-start", className)}
    >
      <img
        src="/logo.svg"
        alt="Dock Posted. Marina fuel. Sabine to Key West."
        width={720}
        height={280}
        className="h-24 w-auto md:h-32"
      />
      <span className="sr-only">Clear space: one capital D on every side.</span>
    </div>
  );
}

export function BrandSpine({ className = "" }: { className?: string }) {
  return <Waterline compact className={className} />;
}
