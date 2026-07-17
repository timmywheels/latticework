interface PlatePlaceholderProps {
  caption: string
  height: number
  inset?: number
}

/** Hatched stand-in for plates whose engraving hasn't been drawn yet. */
export function PlatePlaceholder({ caption, height, inset = 6 }: PlatePlaceholderProps) {
  return (
    <div
      className="relative flex items-center justify-center border border-ink"
      style={{
        height,
        background:
          'repeating-linear-gradient(0deg, transparent 0 7px, rgba(198,90,46,.13) 7px 8px)',
      }}
    >
      <div
        className="pointer-events-none absolute border border-dotted border-ink/35"
        style={{ inset }}
      />
      <span className="relative max-w-[260px] bg-card px-2.5 py-1 text-center font-mono text-[9.5px] leading-[1.6] text-drab">
        {caption}
      </span>
    </div>
  )
}
