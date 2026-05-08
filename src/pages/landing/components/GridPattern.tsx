type GridPatternProps = {
  opacity?: number
}

export default function GridPattern({ opacity = 0.05 }: GridPatternProps) {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ opacity }}
      aria-hidden
    >
      <defs>
        <pattern id="lg" width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M 48 0 L 0 0 0 48"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lg)" />
    </svg>
  )
}
