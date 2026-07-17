interface BustProps {
  slug: string
  name: string
  count: number
  active: boolean
  size?: number
  onClick: () => void
}

/**
 * A thinker's medallion. Portrait art doesn't exist yet, so this follows the
 * same convention as PlatePlaceholder: an engraved silhouette that is honestly
 * a placeholder, not a fake likeness. Swap the <use> target for real art later.
 */
export function Bust({ slug, name, count, active, size = 46, onClick }: BustProps) {
  // deterministic hatch angle per thinker, so the roster reads as a set of
  // distinct plates rather than 40 identical discs
  const angle = (slug.charCodeAt(0) * 37 + slug.length * 13) % 180
  const last = name.split(' ').slice(-1)[0]

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${name} — ${count} model${count === 1 ? '' : 's'}`}
      className="group flex w-[64px] flex-none cursor-pointer flex-col items-center gap-1"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 46 46"
        className="transition-transform duration-150 group-hover:-translate-y-[2px]"
      >
        <defs>
          <pattern
            id={`h-${slug}`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${angle})`}
          >
            <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(33,29,20,.18)" strokeWidth="1" />
          </pattern>
        </defs>
        <circle
          cx="23"
          cy="23"
          r="21"
          fill={active ? 'rgba(198,90,46,.12)' : '#fbf8f0'}
          stroke={active ? '#c65a2e' : 'rgba(33,29,20,.45)'}
          strokeWidth={active ? 2 : 1.1}
        />
        <circle cx="23" cy="23" r="21" fill={`url(#h-${slug})`} />
        {/* generic engraved bust silhouette: head + shoulders */}
        <g fill={active ? '#c65a2e' : '#211d14'} opacity={active ? 0.9 : 0.62}>
          <circle cx="23" cy="18.5" r="6.2" />
          <path d="M11.5 37.5c1.2-6.6 6-10.2 11.5-10.2s10.3 3.6 11.5 10.2z" />
        </g>
        <circle
          cx="23"
          cy="23"
          r="17.5"
          fill="none"
          stroke="rgba(33,29,20,.22)"
          strokeDasharray="1 3"
        />
      </svg>
      <span
        className="w-full truncate text-center font-mono text-[8.5px] leading-tight transition-colors duration-150"
        style={{ color: active ? '#c65a2e' : '#6b6455' }}
      >
        {last.toUpperCase()}
      </span>
      <span className="font-mono text-[8px] leading-none text-faded">{count}</span>
    </button>
  )
}
