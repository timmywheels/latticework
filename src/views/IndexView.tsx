import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import {
  ART_READY_ID,
  DISCIPLINE_ORDER,
  MODELS,
  MODELS_BY_ID,
  PLANNED_COUNTS,
  capTitle,
  neighborModel,
} from '../data/models'
import { PlateArt } from '../components/PlateArt'
import { PlatePlaceholder } from '../components/PlatePlaceholder'

const MUNGER_CORE = MODELS.filter(
  (m) => m.provenance === 'munger-named' || m.provenance === 'munger-used',
).length

/** past this the preview's link list outgrows the panel and buries the button */
const PREVIEW_LINKS = 6

interface IndexViewProps {
  studied: string[]
  saved: string[]
  showConnections?: boolean
  density?: 'comfortable' | 'compact'
}

export function IndexView({
  studied,
  saved,
  showConnections = true,
  density = 'comfortable',
}: IndexViewProps) {
  const navigate = useNavigate()
  // discipline + selected plate live in the URL, so back/forward and a shared
  // link all land where the reader actually was
  const [params, setParams] = useSearchParams()
  const disc = params.get('disc') ?? 'ALL'
  const sel = params.get('sel') ?? ART_READY_ID
  const [hover, setHover] = useState<string | null>(null)

  const setDisc = (d: string) => {
    const next = new URLSearchParams(params)
    if (d === 'ALL') next.delete('disc')
    else next.set('disc', d)
    setParams(next, { replace: true })
  }
  const setSel = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('sel', id)
    setParams(next, { replace: true })
  }

  const hovM = hover ? MODELS_BY_ID[hover] : null
  // a stale or filtered-out id must never blank the preview panel
  const selM = MODELS_BY_ID[sel] ?? MODELS[0]
  const pM = hovM ?? selM
  const rowPadding = density === 'compact' ? '8px 20px' : '13px 20px'

  const openModel = (id: string) =>
    navigate(`/models/${id}`, { state: { from: `/?${params.toString()}` } })

  const rail = [
    { name: 'ALL', count: MODELS.length },
    ...DISCIPLINE_ORDER.map((d) => ({ name: d, count: PLANNED_COUNTS[d] })),
  ]

  const groups = DISCIPLINE_ORDER.filter((d) => disc === 'ALL' || d === disc)
    .map((d) => ({
      name: d,
      count: PLANNED_COUNTS[d],
      rows: MODELS.filter((m) => m.disc === d),
    }))
    .filter((g) => g.rows.length > 0)

  const previewLinks = pM.links.map((id) => MODELS_BY_ID[id]).filter(Boolean)

  // arrows step through plates in plate-number order, mirroring the detail page
  const prevM = neighborModel(pM.id, -1)
  const nextM = neighborModel(pM.id, 1)

  return (
    <div>
      {/* hero */}
      <div className="border-b border-ink/16">
        <div className="mx-auto flex max-w-[1280px] items-end justify-between gap-10 px-7 pb-9 pt-10">
          <div className="max-w-[640px]">
            <div className="font-serif text-[44px] font-medium leading-[1.08] tracking-[-0.015em] text-pretty">
              {MODELS.length} mental models, hung on a single lattice.
            </div>
            <div className="mt-3 font-serif text-[15px] italic leading-[1.6] text-umber">
              The big ideas from the big disciplines — each one a plate, each plate wired to its
              neighbors.
            </div>
          </div>
          <div className="flex-none text-right font-mono text-[10px] leading-[1.8] tracking-[0.1em] text-stone">
            DRAFT SCAFFOLD
            <br />
            {MODELS.length} MODELS · {MUNGER_CORE} FROM MUNGER&apos;S OWN WORDS
            <br />
            VOL. I — JULY MMXXVI
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-[720px] max-w-[1280px] items-start">
        {/* discipline rail — sticky, so the reader can switch discipline from
            anywhere in a 752-row ledger */}
        <div className="sticky top-0 max-h-[100svh] w-[200px] flex-none overflow-y-auto border-r border-ink/16 py-[22px]">
          <div className="px-[22px] pb-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            DISCIPLINES
          </div>
          {rail.map((d) => {
            const active = disc === d.name
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => setDisc(d.name)}
                className="flex w-full cursor-pointer items-baseline justify-between px-[22px] py-[7px] transition-colors duration-150 hover:bg-ember/5"
                style={{ background: active ? 'rgba(198,90,46,.08)' : undefined }}
              >
                <span
                  className={`font-mono text-[11px] font-medium ${active ? 'text-ink' : 'text-drab'}`}
                >
                  {active ? '▸' : ' '} {d.name}
                </span>
                <span className="font-mono text-[10.5px] text-stone">{d.count}</span>
              </button>
            )
          })}
          <div className="px-[22px] pt-5 font-mono text-[9.5px] leading-[1.7] text-faded">
            ✦ STUDIED
            <br />
            ❖ SAVED
            <br />
            ⁘ N CONNECTIONS
          </div>
        </div>

        {/* ledger — hover clears at the column edge, so row-to-row moves never flash */}
        <div className="min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
          {groups.map((g) => (
            <div key={g.name}>
              <div className="sticky top-0 z-10 flex justify-between border-b border-ink/14 bg-paper px-5 pb-2.5 pt-3.5">
                <span className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
                  {g.name}
                </span>
                <span className="font-mono text-[9.5px] text-faded">{g.count} MODELS</span>
              </div>
              {g.rows.map((m) => {
                const isStudied = studied.includes(m.id)
                const isSaved = saved.includes(m.id)
                return (
                  <div
                    key={m.id}
                    onClick={() => openModel(m.id)}
                    onMouseEnter={() => setHover(m.id)}
                    className="flex cursor-pointer items-baseline gap-3.5 border-b border-dotted border-ink/20 transition-[background-color] duration-150 hover:bg-card"
                    style={{ padding: rowPadding }}
                  >
                    <span className="w-[38px] flex-none font-mono text-[11px] font-medium text-ember">
                      {m.id}
                    </span>
                    <span className="w-[186px] flex-none font-serif text-[17px] font-medium">
                      {m.name}
                    </span>
                    <span className="min-w-0 flex-1 font-serif text-[12.5px] italic leading-[1.4] text-drab">
                      {m.blurb}
                    </span>
                    <span className="w-[88px] flex-none text-right font-mono text-[9.5px] text-prussian">
                      {showConnections ? `⁘ ${m.links.length}` : ''}
                    </span>
                    <span
                      className="w-[16px] flex-none text-right font-serif text-[12px]"
                      style={{ color: isSaved ? '#c65a2e' : 'transparent' }}
                    >
                      ❖
                    </span>
                    <span
                      className="flex-none font-serif text-[13px]"
                      style={{ color: isStudied ? '#c65a2e' : '#d8d2c2' }}
                    >
                      {isStudied ? '✦' : '✧'}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
          <div className="px-5 py-3.5 font-mono text-[10px] text-faded">
            HOVER A ROW TO PREVIEW ITS PLATE · CLICK TO OPEN THE FULL
            PLATE
          </div>
        </div>

        {/* preview panel — sticky, self-scrolling, and always full viewport height,
            so the button bar sits at the bottom edge no matter how short the plate */}
        <div className="sticky top-0 flex h-[100svh] w-[348px] flex-none flex-col border-l border-ink/16 bg-card">
          <motion.div
            key={pM.id}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="min-h-0 flex-1 overflow-y-auto px-[26px] py-6"
          >
            <div className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              PLATE NO. {pM.id} — {pM.disc}
            </div>
            <div className="mt-2 font-serif text-[28px] font-medium leading-[1.1]">{pM.name}</div>
            <div className="mt-1 font-serif text-sm italic leading-[1.5] text-ember">
              {pM.blurb}
            </div>
            <div className="mt-3.5">
              {pM.id === ART_READY_ID ? (
                <PlateArt inset={6} />
              ) : (
                <PlatePlaceholder
                  height={150}
                  caption={pM.cap ? `retro-futurist plate — ${pM.cap}` : 'plate not yet typeset'}
                />
              )}
            </div>
            {pM.cap && (
              <div className="mt-2 text-center font-mono text-[10px] tracking-[0.08em] text-stone">
                «{capTitle(pM)}»
              </div>
            )}
            <div className="mt-3 font-serif text-[13px] leading-[1.65] text-umber">{pM.long}</div>
            <div className="mt-4 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              SEE ALSO
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5">
              {previewLinks.slice(0, PREVIEW_LINKS).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSel(m.id)}
                  className="cursor-pointer border-b border-prussian/50 text-left font-serif text-[13px] italic text-prussian transition-colors duration-150 hover:border-ember hover:text-ember"
                >
                  {m.name.length > 32 ? m.name.slice(0, 31).toLowerCase() + '…' : m.name.toLowerCase()}
                </button>
              ))}
              {previewLinks.length > PREVIEW_LINKS && (
                <span className="font-mono text-[10px] text-faded">
                  +{previewLinks.length - PREVIEW_LINKS} more
                </span>
              )}
            </div>
          </motion.div>
          <div className="m-[26px] mt-3 flex flex-none items-stretch gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSel(prevM.id)}
              title={`◂ ${prevM.id}`}
              aria-label={`Previous plate — ${prevM.id}`}
              className="w-[38px] flex-none cursor-pointer rounded-[2px] border border-ink/30 font-mono text-[11px] font-medium text-ink transition-colors duration-150 hover:border-ember hover:text-ember"
            >
              ◂
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => openModel(pM.id)}
              className="min-w-0 flex-1 cursor-pointer rounded-[2px] bg-ink py-[9px] text-center font-mono text-[10.5px] font-medium tracking-[0.1em] text-card transition-colors duration-150 hover:bg-ember"
            >
              READ THE FULL PLATE ▸
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSel(nextM.id)}
              title={`${nextM.id} ▸`}
              aria-label={`Next plate — ${nextM.id}`}
              className="w-[38px] flex-none cursor-pointer rounded-[2px] border border-ink/30 font-mono text-[11px] font-medium text-ink transition-colors duration-150 hover:border-ember hover:text-ember"
            >
              ▸
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
