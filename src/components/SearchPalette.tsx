import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { DISCIPLINE_LABELS, MODELS, PEOPLE, modelPath, type Model } from '../data/models'

interface SearchPaletteProps {
  open: boolean
  onClose: () => void
}

const PERSON = new Map(PEOPLE.map((p) => [p.slug, p.name]))
const SEP = ''

// Precomputed once: name (for ranking) + a lowercase haystack spanning every
// searchable field, so keystrokes are a cheap includes() over 963 short strings.
const INDEX = MODELS.map((m) => ({
  m,
  name: m.name.toLowerCase(),
  hay: [
    m.name,
    ...(m.aka ?? []),
    m.blurb,
    m.long,
    m.disc,
    ...(m.thinkers ?? []).map((s) => PERSON.get(s) ?? ''),
  ]
    .join(SEP)
    .toLowerCase(),
}))

function search(q: string): Model[] {
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  const phrase = tokens.join(' ')
  const scored: { m: Model; s: number }[] = []
  for (const e of INDEX) {
    if (!tokens.every((t) => e.hay.includes(t))) continue
    let s = 0
    if (e.name === phrase) s += 1000
    else if (e.name.startsWith(tokens[0])) s += 200
    if (e.name.includes(phrase)) s += 120
    for (const t of tokens) if (e.name.includes(t)) s += 40
    s -= e.name.length * 0.05 // nudge shorter, more-specific names up
    scored.push({ m: e.m, s })
  }
  scored.sort((a, b) => b.s - a.s || a.m.name.length - b.m.name.length)
  return scored.slice(0, 25).map((x) => x.m)
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => search(q), [q])

  // reset and focus each time it opens
  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      // focus after the mount/paint so the caret actually lands
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setSel(0)
  }, [q])

  // keep the highlighted row in view as you arrow through
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-i="${sel}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  if (!open) return null

  const openModel = (m: Model) => {
    onClose()
    navigate(modelPath(m))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[sel]) openModel(results[sel])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onMouseDown={onClose}
        className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-[1px]"
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: -8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-[560px] overflow-hidden border border-ink bg-card shadow-[4px_4px_0_rgba(33,29,20,.2)]"
          role="dialog"
          aria-label="Search models"
        >
          <div className="flex items-center gap-2.5 border-b border-ink/14 px-4 py-3">
            <span className="font-mono text-[13px] text-stone">⌕</span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={`Search ${MODELS.length} models — by name, idea, or thinker…`}
              className="w-full bg-transparent font-serif text-[17px] text-ink placeholder:text-faded focus:outline-none"
            />
            <kbd className="hidden flex-none rounded-[2px] border border-ink/20 px-1.5 py-0.5 font-mono text-[9px] text-stone sm:block">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[54vh] overflow-y-auto">
            {q.trim() === '' ? (
              <div className="px-4 py-6 font-mono text-[10px] leading-[1.8] tracking-[0.08em] text-faded">
                TYPE TO SEARCH ACROSS NAMES, DEFINITIONS, AND THINKERS.
                <br />↑↓ TO MOVE · ↵ TO OPEN · ESC TO CLOSE
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 font-serif text-[14px] italic text-drab">
                No model matches “{q.trim()}”.
              </div>
            ) : (
              results.map((m, i) => (
                <button
                  key={m.id}
                  data-i={i}
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => openModel(m)}
                  className="flex w-full cursor-pointer items-baseline gap-3 border-b border-dotted border-ink/12 px-4 py-2.5 text-left transition-colors duration-100"
                  style={{ background: i === sel ? 'rgba(198,90,46,.09)' : 'transparent' }}
                >
                  <span className="w-[92px] flex-none font-mono text-[8.5px] tracking-[0.1em] text-stone">
                    {DISCIPLINE_LABELS[m.disc]?.split(/[ ,&]/)[0].toUpperCase() ?? m.disc}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-serif text-[15px] font-medium text-ink">{m.name}</span>
                    <span className="ml-2 font-serif text-[12px] italic text-drab">{m.blurb}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          {results.length > 0 && (
            <div className="border-t border-ink/12 px-4 py-1.5 text-right font-mono text-[9px] text-faded">
              {results.length === 25 ? 'TOP 25' : `${results.length} RESULT${results.length === 1 ? '' : 'S'}`}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
