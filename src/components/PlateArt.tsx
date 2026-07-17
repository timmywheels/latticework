interface PlateArtProps {
  /** inset of the dotted inner frame, matches the design's 6px / 8px variants */
  inset?: number
}

/** Retro-futurist engraving for plate 012 — Incentives («the machinery of reward»). */
export function PlateArt({ inset = 8 }: PlateArtProps) {
  return (
    <div className="relative border border-ink bg-card">
      <div
        className="pointer-events-none absolute border border-dotted border-ink/35"
        style={{ inset }}
      />
      <svg viewBox="0 0 400 280" className="block h-auto w-full">
        {/* ruled ground */}
        <line x1="24" y1="248" x2="376" y2="248" stroke="#211d14" strokeWidth="1.2" />
        <line x1="24" y1="256" x2="376" y2="256" stroke="#211d14" strokeWidth="0.6" opacity="0.4" />
        <line x1="24" y1="262" x2="376" y2="262" stroke="#211d14" strokeWidth="0.6" opacity="0.2" />
        {/* ember sun with orbit */}
        <ellipse
          cx="308"
          cy="72"
          rx="58"
          ry="17"
          fill="none"
          stroke="#211d14"
          strokeWidth="0.7"
          opacity="0.5"
          strokeDasharray="3 3"
          transform="rotate(-18 308 72)"
        />
        <circle cx="308" cy="72" r="34" fill="none" stroke="#c65a2e" strokeWidth="1.4" />
        <circle cx="308" cy="72" r="25" fill="none" stroke="#c65a2e" strokeWidth="0.9" opacity="0.7" />
        <circle cx="308" cy="72" r="16" fill="#c65a2e" opacity="0.16" />
        <line x1="308" y1="24" x2="308" y2="12" stroke="#c65a2e" strokeWidth="1.2" />
        <line x1="308" y1="120" x2="308" y2="132" stroke="#c65a2e" strokeWidth="1.2" />
        <line x1="260" y1="72" x2="248" y2="72" stroke="#c65a2e" strokeWidth="1.2" />
        <line x1="356" y1="72" x2="368" y2="72" stroke="#c65a2e" strokeWidth="1.2" />
        <line x1="274" y1="38" x2="266" y2="30" stroke="#c65a2e" strokeWidth="1.2" />
        <line x1="342" y1="106" x2="350" y2="114" stroke="#c65a2e" strokeWidth="1.2" />
        <line x1="342" y1="38" x2="350" y2="30" stroke="#c65a2e" strokeWidth="1.2" />
        {/* the lever */}
        <line x1="60" y1="212" x2="300" y2="142" stroke="#211d14" strokeWidth="3" strokeLinecap="round" />
        <path d="M 183 177 L 163 248 L 203 248 Z" fill="#211d14" />
        {/* counterweight */}
        <rect x="44" y="216" width="34" height="32" fill="none" stroke="#211d14" strokeWidth="1.4" />
        <line x1="48" y1="244" x2="74" y2="220" stroke="#211d14" strokeWidth="0.8" />
        <line x1="44" y1="238" x2="66" y2="216" stroke="#211d14" strokeWidth="0.8" />
        <line x1="56" y1="248" x2="78" y2="226" stroke="#211d14" strokeWidth="0.8" />
        <line x1="61" y1="212" x2="61" y2="216" stroke="#211d14" strokeWidth="1.2" />
        {/* the reward, lifted */}
        <circle cx="300" cy="132" r="10" fill="#c65a2e" stroke="#211d14" strokeWidth="1.2" />
        <path d="M 306 118 Q 316 96 296 84" fill="none" stroke="#2e7f74" strokeWidth="1.3" strokeDasharray="4 4" />
        <path d="M 296 84 L 305 86 M 296 84 L 299 93" fill="none" stroke="#2e7f74" strokeWidth="1.3" />
        {/* field marks */}
        <path d="M 96 92 L 104 92 M 100 88 L 100 96" stroke="#211d14" strokeWidth="1" opacity="0.45" />
        <path d="M 148 56 L 156 56 M 152 52 L 152 60" stroke="#211d14" strokeWidth="1" opacity="0.35" />
        <path d="M 236 210 L 244 210 M 240 206 L 240 214" stroke="#211d14" strokeWidth="1" opacity="0.35" />
        <circle cx="126" cy="136" r="2.2" fill="none" stroke="#211d14" strokeWidth="0.9" opacity="0.5" />
        <text x="376" y="240" textAnchor="end" fill="#8a8272" fontSize="8" fontFamily="'IBM Plex Mono', monospace">
          FIG. 012 — DRAFT
        </text>
      </svg>
    </div>
  )
}
