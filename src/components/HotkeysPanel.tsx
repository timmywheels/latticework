import { useLocation } from 'react-router'

interface HotkeysPanelProps {
  open: boolean
  onToggle: () => void
}

type Section = { name: string; keys: [string, string][] }

const ANYWHERE: Section = {
  name: 'ANYWHERE',
  keys: [
    ['?', 'this panel'],
    ['/', 'search'],
    ['i', 'almanack'],
    ['l', 'lattice'],
    ['s', 'shelf'],
    ['r', 'random model'],
  ],
}

// keyed by the page they apply to; only the current page's block is shown
const PAGE: Record<'ALMANACK' | 'MODEL' | 'LATTICE', Section> = {
  ALMANACK: {
    name: 'THE ALMANACK',
    keys: [
      ['j k', 'walk the ledger'],
      ['← →', 'step by number'],
      ['↵', 'open the model'],
    ],
  },
  MODEL: {
    name: 'THIS MODEL',
    keys: [
      ['← →', 'prev · next'],
      ['esc', 'back to index'],
      ['m', 'mark studied ✦'],
      ['b', 'save ❖'],
    ],
  },
  LATTICE: {
    name: 'THE LATTICE',
    // r resets the view here, so it overrides the global "random" binding
    keys: [
      ['esc', 'close the card'],
      ['r', 'reset the view'],
      ['f', 'full screen'],
    ],
  },
}

function pageOf(pathname: string): keyof typeof PAGE | null {
  if (pathname.startsWith('/models')) return 'MODEL'
  if (pathname.startsWith('/lattice')) return 'LATTICE'
  if (pathname === '/') return 'ALMANACK'
  return null // shelf / colophon have no page-specific keys
}

function Kbd({ children }: { children: string }) {
  return (
    <span className="inline-block min-w-[26px] rounded-[2px] border border-ink/25 bg-paper px-1 py-[1px] text-center font-mono text-[9px] text-umber">
      {children}
    </span>
  )
}

function Rows({ section, muted }: { section: Section; muted?: boolean }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 font-mono text-[8.5px] font-medium tracking-[0.18em] text-stone">
        {section.name}
        {muted && <span className="ml-1.5 text-faded">· here</span>}
      </div>
      {section.keys.map(([k, desc]) => (
        <div key={k + desc} className="flex items-baseline justify-between py-[2px]">
          <Kbd>{k}</Kbd>
          <span className="font-serif text-[12px] italic text-drab">{desc}</span>
        </div>
      ))}
    </div>
  )
}

/** Bottom-left so it never sits on the index preview's CTA. Context-aware:
 *  shows the global keys plus only the block that applies to the current page. */
export function HotkeysPanel({ open, onToggle }: HotkeysPanelProps) {
  const { pathname } = useLocation()
  const page = pageOf(pathname)

  // on the lattice, r resets the view, so drop the global "random" row to avoid
  // documenting a binding that's overridden here
  const anywhere: Section =
    page === 'LATTICE'
      ? { ...ANYWHERE, keys: ANYWHERE.keys.filter(([k]) => k !== 'r') }
      : ANYWHERE

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block">
      {open && (
        <div className="mb-2 w-[228px] border border-ink bg-card p-3 shadow-[3px_3px_0_rgba(33,29,20,.12)]">
          {page && <Rows section={PAGE[page]} muted />}
          <Rows section={anywhere} />
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer rounded-[2px] border border-ink/30 bg-card px-2.5 py-1 font-mono text-[9.5px] font-medium tracking-[0.1em] text-drab transition-colors duration-150 hover:border-ink hover:text-ink"
      >
        {open ? '✕ KEYS' : '? KEYS'}
      </button>
    </div>
  )
}
