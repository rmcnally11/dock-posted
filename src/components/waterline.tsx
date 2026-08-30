const PAIR =
  "M0 14 C 150 6, 300 6, 450 14 S 750 28, 900 18 1050 8, 1200 14";

export function Waterline({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1200 32"
      className={`waterline-svg pointer-events-none w-full ${compact ? "h-2" : "h-6"} ${className}`}
      preserveAspectRatio="none"
      aria-hidden
      data-testid="waterline"
    >
      <path
        className="waterline-pair"
        d={PAIR}
        fill="none"
        stroke="#E23B3B"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        className="waterline-pair"
        d={PAIR}
        transform="translate(0 8)"
        fill="none"
        stroke="#2F8FD6"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
