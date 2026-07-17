/** The brand mark: a 3×3 weave whose ember thread turns the corner into an L.
 *  Bare threads — the favicon adds its own paper tile. */
export function StitchMark({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g strokeWidth="5.5" strokeLinecap="round" fill="none">
        <path d="M8 18 L56 18" stroke="#211d14" />
        <path d="M8 32 L56 32" stroke="#211d14" />
        <path d="M8 46 L56 46" stroke="#c65a2e" />
        <path d="M18 8 L18 56" stroke="#c65a2e" />
        <path d="M32 8 L32 56" stroke="#211d14" />
        <path d="M46 8 L46 56" stroke="#211d14" />
        <path d="M11.5 32 L24.5 32" stroke="#211d14" />
        <path d="M25.5 18 L38.5 18" stroke="#211d14" />
        <path d="M25.5 46 L38.5 46" stroke="#c65a2e" />
        <path d="M39.5 32 L52.5 32" stroke="#211d14" />
      </g>
    </svg>
  )
}
