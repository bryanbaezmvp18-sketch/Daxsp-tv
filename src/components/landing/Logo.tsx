export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset=".5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="28" height="22" rx="7" fill="url(#logo-g)" />
      <path d="M13 11.5v9l8-4.5z" fill="#fff" />
    </svg>
  );
}
