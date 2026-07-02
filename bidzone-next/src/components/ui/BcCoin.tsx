/**
 * BidZone Currency (BC) coin — inline SVG so it scales crisply everywhere.
 */
export function BcCoin({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bc-rim" x1="8" y1="6" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.45" stopColor="#f0b429" />
          <stop offset="1" stopColor="#9c6a10" />
        </linearGradient>
        <linearGradient id="bc-face" x1="14" y1="12" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd766" />
          <stop offset="0.5" stopColor="#e8a820" />
          <stop offset="1" stopColor="#c07f12" />
        </linearGradient>
        <linearGradient id="bc-shine" x1="16" y1="10" x2="34" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff6d9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6d9" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="32" cy="32" r="30" fill="url(#bc-rim)" />
      {/* Inner face */}
      <circle cx="32" cy="32" r="24" fill="url(#bc-face)" stroke="#8a5c0c" strokeWidth="1.5" />
      {/* Ridge dots */}
      <g fill="#8a5c0c" opacity="0.55">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          return <circle key={i} cx={32 + Math.cos(a) * 27} cy={32 + Math.sin(a) * 27} r="1.3" />
        })}
      </g>
      {/* BC monogram */}
      <text
        x="32"
        y="39.5"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="19"
        fill="#7c5209"
        stroke="#fff3c9"
        strokeWidth="0.6"
        letterSpacing="-1"
      >
        BC
      </text>
      {/* Top shine */}
      <ellipse cx="24" cy="18" rx="12" ry="7" fill="url(#bc-shine)" transform="rotate(-24 24 18)" />
    </svg>
  )
}
