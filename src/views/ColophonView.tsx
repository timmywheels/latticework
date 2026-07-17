const SWATCHES = [
  { color: '#f3efe4', border: 'rgba(33,29,20,.25)' },
  { color: '#fbf8f0', border: 'rgba(33,29,20,.15)' },
  { color: '#211d14' },
  { color: '#c65a2e' },
  { color: '#3f5d7a' },
]

export function ColophonView() {
  return (
    <div className="mx-auto w-full max-w-[660px] box-border px-7 pb-16 pt-12">
      <div className="text-center font-mono text-[10px] font-medium tracking-[0.22em] text-ember">
        COLOPHON
      </div>
      <div className="mt-3 text-center font-serif text-[38px] font-medium leading-[1.15] tracking-[-0.01em] text-pretty">
        On the making of this almanack.
      </div>
      <div className="mt-[26px] font-serif text-base leading-[1.75] text-umber">
        Latticework is a visual field guide to one hundred mental models — the big ideas from the
        big disciplines. It takes its name and its charge from Charles T. Munger, who observed that
        experience, however vast, hangs together only when hung upon a lattice of theory. Each
        model is set as a plate: named, numbered, defined, illustrated, and wired to its neighbors.
      </div>
      <div className="mt-4 font-serif text-base leading-[1.75] text-umber">
        Read it in any order. Mark what you have studied. Follow the prussian threads — the
        connections are the point.
      </div>
      <div className="mt-8 flex flex-col gap-4 border-t border-ink/16 pt-[22px]">
        <div className="flex items-baseline gap-5">
          <span className="w-[90px] flex-none font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            TYPE
          </span>
          <span className="font-serif text-sm">
            Newsreader, for the prose &amp; plates ·{' '}
            <span className="font-mono text-xs">IBM Plex Mono, for the apparatus</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="w-[90px] flex-none font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            COLOR
          </span>
          <div className="flex items-center gap-2">
            {SWATCHES.map((s) => (
              <div
                key={s.color}
                className="h-5 w-[34px]"
                style={{
                  background: s.color,
                  border: s.border ? `1px solid ${s.border}` : undefined,
                }}
              />
            ))}
            <span className="ml-1.5 font-mono text-[10px] text-stone">
              paper · card · ink · ember · prussian
            </span>
          </div>
        </div>
        <div className="flex items-baseline gap-5">
          <span className="w-[90px] flex-none font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            MARKS
          </span>
          <span className="font-mono text-xs text-umber">
            ✦ studied · ✧ unread · ⁘ n connections · «…» plate captions
          </span>
        </div>
        <div className="flex items-baseline gap-5">
          <span className="w-[90px] flex-none font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            PLATES
          </span>
          <span className="font-serif text-sm text-umber">
            Retro-futurist engravings: thin ink linework, ember suns, prussian trajectories, ruled
            ground. One per model, in time.
          </span>
        </div>
      </div>
    </div>
  )
}
