export function Waterline({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`waterline-svg h-4 w-full overflow-hidden text-[color:var(--sea)] ${className}`}
      viewBox="0 0 240 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="waterline-a"
        d="M0 8 Q 20 2 40 8 T 80 8 T 120 8 T 160 8 T 200 8 T 240 8"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
      <path
        className="waterline-b"
        d="M0 11 Q 20 16 40 11 T 80 11 T 120 11 T 160 11 T 200 11 T 240 11"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.2"
      />
    </svg>
  );
}
