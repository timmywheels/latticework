interface HotkeysPanelProps {
  open: boolean
  onToggle: () => void
}

const SECTIONS: { name: string; keys: [string, string][] }[] = [
  {
    name: 'ANYWHERE',
    keys: [
      ['?', 'this panel'],
      ['i', 'almanack'],
      ['l', 'lattice'],
      ['s', 'shelf'],
    ],
  },
  {
    name: 'ALMANACK',
    keys: [
      ['j k', 'walk the ledger'],
      ['← →', 'step by number'],
      ['↵', 'open the model'],
    ],
  },
  {
    name: 'MODEL',
    keys: [
      ['← →', 'prev · next'],
      ['esc', 'back to index'],
      ['m', 'mark studied ✦'],
      ['b', 'save ❖'],
    ],
  },
  {
    name: 'LATTICE',
    keys: [
      ['esc', 'close the card'],
      ['r', 'reset the view'],
      ['f', 'full screen'],
    ],
  },
]

function Kbd({ children }: { children: string }) {
  return (
    <span className="inline-block min-w-[26px] rounded-[2px] border border-ink/25 bg-paper px-1 py-[1px] text-center font-mono text-[9px] text-umber">
      {children}
    </span>
  )
}

/** Bottom-left so it never sits on the index preview's CTA. */
export function HotkeysPanel({ open, onToggle }: HotkeysPanelProps) {
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block">
      {open && (
        <div className="mb-2 w-[228px] border border-ink bg-card p-3 shadow-[3px_3px_0_rgba(33,29,20,.12)]">
          {SECTIONS.map((s) => (
            <div key={s.name} className="mb-2.5 last:mb-0">
              <div className="mb-1 font-mono text-[8.5px] font-medium tracking-[0.18em] text-stone">
                {s.name}
              </div>
              {s.keys.map(([k, desc]) => (
                <div key={k} className="flex items-baseline justify-between py-[2px]">
                  <Kbd>{k}</Kbd>
                  <span className="font-serif text-[12px] italic text-drab">{desc}</span>
                </div>
              ))}
            </div>
          ))}
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
