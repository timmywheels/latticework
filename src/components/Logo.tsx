interface LogoProps {
  /** rendered height in px; width follows the mark's intrinsic aspect */
  size?: number
  className?: string
}

/** The Latticework brand mark — the woven-lattice "L" from public/icon.png
 *  (transparent PNG, so it drops straight onto the paper background).
 *  Sized by height with width auto so the non-square mark never distorts. */
export function Logo({ size = 24, className }: LogoProps) {
  return (
    <img
      src="/icon.png"
      alt="Latticework"
      style={{ height: size, width: 'auto' }}
      className={className}
      draggable={false}
    />
  )
}
