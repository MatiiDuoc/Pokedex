interface PokeballMarkProps {
  className?: string;
}

/** Poké Ball decorativa, sin dependencias ni estado. */
export default function PokeballMark({ className = '' }: PokeballMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="#f8fafc" />
      <path d="M2 32a30 30 0 0 1 60 0Z" fill="#ef4444" />
      <rect x="2" y="29" width="60" height="6" fill="#0f172a" />
      <circle cx="32" cy="32" r="12" fill="#0f172a" />
      <circle cx="32" cy="32" r="8" fill="#f8fafc" />
      <circle cx="32" cy="32" r="3.2" fill="#cbd5e1" />
      <ellipse
        cx="22"
        cy="16"
        rx="8"
        ry="3.5"
        fill="#ffffff"
        opacity="0.28"
        transform="rotate(-28 22 16)"
      />
    </svg>
  );
}
