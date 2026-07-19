import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import {
  ART_READY_ID,
  DISCIPLINE_ORDER,
  MODEL_SLUGS,
  MODELS,
  MODELS_BY_ID,
  MODELS_BY_SLUG,
  PLANNED_COUNTS,
  PLATE_ORDER,
  capTitle,
  modelOfTheDay,
  modelPath,
  randomModel,
  neighborModel,
} from '../data/models'
import { DisciplineThumb, ModelPlate } from '../components/DisciplinePlates'
import { SubscribeForm } from '../components/SubscribeForm'
import { useKeys } from '../hooks/useKeys'
import mungerFrontispiece from '../assets/munger-frontispiece.jpg'

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
  // discipline + selected model live in the URL, so back/forward and a shared
  // link all land where the reader actually was
  const [params, setParams] = useSearchParams()
  const rawDiscipline = (params.get('discipline') ?? '').toUpperCase()
  const disc = (DISCIPLINE_ORDER as string[]).includes(rawDiscipline) ? rawDiscipline : 'ALL'
  const modelSlug = params.get('model') ?? ''
  const [hover, setHover] = useState<string | null>(null)

  const setDisc = (d: string) => {
    const next = new URLSearchParams(params)
    if (d === 'ALL') {
      next.delete('discipline')
    } else {
      next.set('discipline', d.toLowerCase())
      // landing on a discipline always previews its first model
      const first = MODELS.find((m) => m.disc === d)
      if (first) {
        next.set('model', MODEL_SLUGS[first.id])
      }
    }
    setParams(next, { replace: true })
  }
  const setSel = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('model', MODEL_SLUGS[id])
    setParams(next, { replace: true })
  }

  const hovM = hover ? MODELS_BY_ID[hover] : null
  // a stale or unknown slug must never blank the preview panel — and a shared
  // /?discipline=law link with no model should preview law, not the global default
  let selM = MODELS_BY_SLUG[modelSlug] ?? MODELS_BY_ID[ART_READY_ID] ?? MODELS[0]
  if (disc !== 'ALL' && selM.disc !== disc) {
    selM = MODELS.find((m) => m.disc === disc) ?? selM
  }
  const pM = hovM ?? selM

  const openModel = (id: string) =>
    navigate(modelPath(MODELS_BY_ID[id]), { state: { from: `/?${params.toString()}` } })

  const rail = [
    { name: 'ALL', count: MODELS.length },
    ...DISCIPLINE_ORDER.map((d) => ({ name: d, count: PLANNED_COUNTS[d] })),
  ]

  // the ledger reads in model-number order (M001↑). Ids are shuffled so that
  // order is an eclectic mix of disciplines, not one discipline at a time — so
  // there are no discipline sections, just a per-row tag. The rail still filters.
  const rows = PLATE_ORDER.filter((m) => disc === 'ALL' || m.disc === disc)

  const previewLinks = pM.links.map((id) => MODELS_BY_ID[id]).filter(Boolean)

  // arrows step through plates in plate-number order, mirroring the detail page
  const prevM = neighborModel(pM.id, -1)
  const nextM = neighborModel(pM.id, 1)

  // j/k walk the visible ledger; ←/→ step by number; ↵ opens the selection
  const walk = (step: 1 | -1) => {
    const idx = rows.findIndex((m) => m.id === selM.id)
    const next = rows[(idx + step + rows.length) % rows.length]
    setSel(next.id)
    document.getElementById(`row-${next.id}`)?.scrollIntoView({ block: 'nearest' })
  }
  useKeys((e) => {
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault()
      walk(1)
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault()
      walk(-1)
    } else if (e.key === 'ArrowLeft') {
      setSel(prevM.id)
    } else if (e.key === 'ArrowRight') {
      setSel(nextM.id)
    } else if (e.key === 'Enter') {
      openModel(selM.id)
    }
  })

  return (
    <div>
      {/* hero */}
      <div>
        <div className="relative mx-auto flex max-w-[1280px] items-center gap-8 px-4 pb-6 pt-8 md:px-7 md:pb-7 md:pt-10">
          {/* a whisper of a trellis in the empty middle-right — the latticework
              motif itself, angled and dashed, faded so it never fights the text */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="hero-lattice"
                width="26"
                height="26"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <path
                  d="M13 0V26 M0 13H26"
                  fill="none"
                  stroke="#211d14"
                  strokeOpacity="0.7"
                  strokeWidth="1"
                  strokeDasharray="5 6"
                />
              </pattern>
              <radialGradient id="hero-lattice-fade" cx="63%" cy="50%" r="30%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="58%" stopColor="white" stopOpacity="0.72" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <mask id="hero-lattice-mask">
                <rect width="100%" height="100%" fill="url(#hero-lattice-fade)" />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#hero-lattice)"
              mask="url(#hero-lattice-mask)"
              opacity="0.22"
            />
          </svg>
          <div className="relative z-10 max-w-[680px]">
            <div className="font-serif text-[32px] font-medium leading-[1.08] tracking-[-0.015em] text-pretty md:text-[44px] [font-optical-sizing:none]">
              {MODELS.length} mental models to build your own latticework.
            </div>
            <blockquote className="mt-5 border-l-2 border-ember/40 pl-4 font-serif text-[16px] italic leading-[1.55] text-umber md:text-[18px]">
              “If the facts don’t hang together on a latticework of theory, you don’t
              have them in a usable form. You’ve got to have mental models in your head.”
              <span className="mt-2 block font-mono text-[9.5px] not-italic tracking-[0.16em] text-stone">
                — CHARLIE MUNGER, USC BUSINESS SCHOOL, 1994
              </span>
            </blockquote>
          </div>
          {/* the patron himself — engraved frontispiece, desktop only so the mobile
              hero stays lean (the quote already credits him there) */}
          <figure className="relative z-10 ml-auto hidden flex-none flex-col items-center md:flex">
            <div className="relative h-[176px] w-[176px] lg:h-[212px] lg:w-[212px]">
              <div className="absolute inset-0 rounded-full border border-ink/25" />
              <div className="absolute inset-[6px] overflow-hidden rounded-full border border-ink/15 bg-card shadow-[0_1px_10px_rgba(33,29,20,0.10)]">
                <img
                  src={mungerFrontispiece}
                  alt="Engraved portrait of Charlie Munger"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
            </div>
            <figcaption className="mt-3 text-center font-mono text-[8.5px] not-italic tracking-[0.22em] text-stone">
              AFTER C. T. MUNGER
              <span className="mt-0.5 block text-[8px] tracking-[0.16em] text-faded">
                1924 — 2023
              </span>
            </figcaption>
          </figure>
        </div>
        {/* dark utility bar — today's model on the left, subscribe on the right */}
        <div className="mx-auto max-w-[1280px] px-4 pb-8 md:px-7 md:pb-9">
          <div className="flex flex-col gap-4 bg-ink px-5 py-4 text-card md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-3.5">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <button
                type="button"
                onClick={() => openModel(modelOfTheDay().id)}
                className="group flex cursor-pointer items-baseline gap-2.5 text-left"
              >
                <span className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-ember">
                  TODAY&apos;S MODEL
                </span>
                <span className="font-serif text-[15px] italic text-card transition-colors duration-150 group-hover:text-ember">
                  {modelOfTheDay().name} ▸
                </span>
              </button>
              <button
                type="button"
                onClick={() => openModel(randomModel().id)}
                title="Jump to a random model — or press R"
                className="group flex cursor-pointer items-baseline gap-1.5 font-mono text-[9.5px] font-medium tracking-[0.18em] text-faded transition-colors duration-150 hover:text-ember"
              >
                <span className="text-[11px] leading-none transition-transform duration-300 group-hover:rotate-180">
                  ↻
                </span>
                SURPRISE ME
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="hidden font-mono text-[9px] tracking-[0.15em] text-faded lg:inline">
                ONE MODEL IN YOUR INBOX, DAILY
              </span>
              <SubscribeForm variant="band" />
            </div>
          </div>
        </div>
      </div>

      {/* the plate cabinet — one tile per discipline, doubling as the filter */}
      <div className="border-b border-ink/16">
        <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-7">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {DISCIPLINE_ORDER.map((d) => {
              const active = disc === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDisc(active ? 'ALL' : d)}
                  className="group w-[124px] flex-none cursor-pointer text-left"
                >
                  <div
                    className={`border transition-colors duration-150 ${
                      active ? 'border-ember' : 'border-ink/30 group-hover:border-ink'
                    }`}
                  >
                    <DisciplineThumb disc={d} />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-1">
                    <span
                      className={`truncate font-mono text-[8.5px] font-medium tracking-[0.08em] ${
                        active ? 'text-ember' : 'text-drab'
                      }`}
                    >
                      {d}
                    </span>
                    <span className="flex-none font-mono text-[8.5px] text-faded">
                      {PLANNED_COUNTS[d]}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1280px] items-start md:min-h-[720px]">
        {/* discipline rail — sticky, so the reader can switch discipline from
            anywhere in a 752-row ledger */}
        <div className="sticky top-0 hidden max-h-[100svh] w-[200px] flex-none overflow-y-auto border-r border-ink/16 py-[22px] lg:block">
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
          <div className="sticky top-0 z-10 flex justify-between border-b border-ink/14 bg-paper px-5 pb-2.5 pt-3.5">
            <span className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              {disc === 'ALL' ? 'ALL DISCIPLINES' : disc}
            </span>
            <span className="font-mono text-[9.5px] text-faded">{rows.length} MODELS</span>
          </div>
          {rows.map((m) => {
            const isStudied = studied.includes(m.id)
            const isSaved = saved.includes(m.id)
            const isSelected = m.id === selM.id
            return (
              <div
                key={m.id}
                id={`row-${m.id}`}
                onClick={() => openModel(m.id)}
                onMouseEnter={() => setHover(m.id)}
                className="flex cursor-pointer items-center gap-3.5 border-b border-dotted border-ink/20 transition-[background-color] duration-150 hover:bg-card"
                style={{
                  // fixed height (not padding) → every row identical, whether the
                  // title is one line or clamped at two
                  height: density === 'compact' ? 56 : 70,
                  paddingInline: 20,
                  background: isSelected ? 'rgba(198,90,46,.07)' : undefined,
                }}
              >
                {/* number over discipline tag — the ledger has no section headers,
                    so each row carries its own discipline */}
                <span className="flex w-[82px] flex-none flex-col gap-[3px]">
                  <span className="font-mono text-[11px] font-medium text-ember">{m.id}</span>
                  <span className="truncate font-mono text-[8px] tracking-[0.12em] text-stone">
                    {m.disc}
                  </span>
                </span>
                {/* fixed row height + title clamped to 2 lines + blurb to 1 keeps
                    every row the same height. full name on hover. */}
                <span
                  title={m.name}
                  className="min-w-0 flex-[3] font-serif text-[16px] font-medium leading-tight md:text-[17px] line-clamp-2"
                >
                  {m.name}
                </span>
                <span className="hidden min-w-0 flex-[2] truncate font-serif text-[12.5px] italic text-drab md:block">
                  {m.blurb}
                </span>
                <span className="hidden w-[88px] flex-none text-right font-mono text-[9.5px] text-prussian sm:block">
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
          <div className="hidden px-5 py-3.5 font-mono text-[10px] text-faded md:block">
            HOVER A ROW TO PREVIEW IT · CLICK TO OPEN THE FULL ENTRY
          </div>
        </div>

        {/* preview panel — sticky, self-scrolling, and always full viewport height,
            so the button bar sits at the bottom edge no matter how short the plate */}
        <div className="sticky top-0 hidden h-[100svh] w-[348px] flex-none flex-col border-l border-ink/16 bg-card md:flex">
          <motion.div
            key={pM.id}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="min-h-0 flex-1 overflow-y-auto px-[26px] py-6"
          >
            <div className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              MODEL NO. {pM.id} — {pM.disc}
            </div>
            <div className="mt-2 font-serif text-[28px] font-medium leading-[1.1]">{pM.name}</div>
            <div className="mt-1 font-serif text-sm italic leading-[1.5] text-ember">
              {pM.blurb}
            </div>
            <div className="mt-3.5">
              <ModelPlate model={pM} inset={6} />
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
              aria-label={`Previous model — ${prevM.id}`}
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
              READ THE FULL ENTRY ▸
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setSel(nextM.id)}
              title={`${nextM.id} ▸`}
              aria-label={`Next model — ${nextM.id}`}
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
