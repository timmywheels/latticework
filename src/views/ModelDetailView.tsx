import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import {
  MODEL_SLUGS,
  MODELS,
  MODELS_BY_ID,
  MODELS_BY_SLUG,
  PEOPLE,
  PROVENANCE_LABELS,
  capTitle,
  modelPath,
  neighborModel,
  type Provenance,
} from '../data/models'
import { ModelPlate } from '../components/DisciplinePlates'
import { MiniLattice } from '../components/MiniLattice'
import { useKeys } from '../hooks/useKeys'
import { useCopy } from '../hooks/useCopy'
import { SubscribeForm } from '../components/SubscribeForm'
import { Examples } from '../components/Examples'
import { CopyPrompt } from '../components/CopyPrompt'
import { SourceList } from '../components/SourceList'

interface ModelDetailViewProps {
  studied: string[]
  onToggleStudied: (id: string) => void
  saved: string[]
  onToggleSaved: (id: string) => void
}

const RING = 16

const PROV_DOT: Record<Provenance, string> = {
  'munger-named': '#c65a2e',
  'munger-used': '#d98b64',
  'munger-adjacent': '#3f5d7a',
  community: '#8a8272',
  'canon-addition': '#b0a894',
}

export function ModelDetailView({
  studied,
  onToggleStudied,
  saved,
  onToggleSaved,
}: ModelDetailViewProps) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const selM = slug ? (MODELS_BY_SLUG[slug] ?? MODELS_BY_ID[slug]) : undefined

  // the index hands us its querystring on the way in, so "back" returns to the
  // discipline the reader was actually browsing
  const backTo = (location.state as { from?: string } | null)?.from ?? '/'

  // plate-number order, carrying `from` forward so BACK TO INDEX still works
  const goPrev = () => {
    if (selM) {
      navigate(modelPath(neighborModel(selM.id, -1)), { state: { from: backTo } })
    }
  }
  const goNext = () => {
    if (selM) {
      navigate(modelPath(neighborModel(selM.id, 1)), { state: { from: backTo } })
    }
  }

  // hooks must run before the redirect guards below
  useKeys((e) => {
    if (!selM) {
      return
    }
    if (e.key === 'ArrowLeft') {
      goPrev()
    } else if (e.key === 'ArrowRight') {
      goNext()
    } else if (e.key === 'Escape') {
      navigate(backTo)
    } else if (e.key === 'm') {
      onToggleStudied(selM.id)
    } else if (e.key === 'b') {
      onToggleSaved(selM.id)
    }
  })

  // every hook must run before the redirect guards below, or the hook count
  // changes between renders (React #310) when a legacy /models/M123 link redirects
  const { copied, copy } = useCopy()

  if (!slug || !selM) return <Navigate to="/" replace />
  // legacy /models/M123 links land here; send them on to the canonical slug
  if (slug !== MODEL_SLUGS[selM.id]) {
    return <Navigate to={modelPath(selM)} replace state={location.state} />
  }

  const id = selM.id
  const share = () => {
    const url = `${window.location.origin}${modelPath(selM)}`
    if (navigator.share) {
      navigator.share({ title: selM.name, text: selM.blurb, url }).catch(() => {})
    } else {
      copy(url)
    }
  }
  const isStudied = studied.includes(id)
  const isSaved = saved.includes(id)

  const neighbors = selM.links.map((l) => MODELS_BY_ID[l]).filter(Boolean)
  const rest = neighbors.slice(RING)
  const thinkers = (selM.thinkers ?? [])
    .map((t) => PEOPLE.find((p) => p.slug === t))
    .filter((t): t is (typeof PEOPLE)[number] => Boolean(t))

  return (
    <div className="mx-auto w-full max-w-[1120px] box-border px-4 pb-12 pt-[20px] md:px-7 md:pt-[26px]">
      <div className="flex items-baseline justify-between border-b border-ink/16 pb-3.5">
        <Link
          to={backTo}
          className="cursor-pointer font-mono text-[10px] font-medium tracking-[0.1em] text-stone transition-colors duration-150 hover:text-ember"
        >
          ◂ BACK TO THE ALMANACK
        </Link>
        <span className="hidden font-mono text-[10px] font-medium tracking-[0.18em] text-ember sm:inline">
          MODEL NO. {selM.id} — {selM.disc}
        </span>
        <div className="flex gap-[18px]">
          <button
            type="button"
            onClick={goPrev}
            className="cursor-pointer font-mono text-[10px] font-medium text-stone transition-colors duration-150 hover:text-ember"
          >
            ◂ PREV
          </button>
          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer font-mono text-[10px] font-medium text-stone transition-colors duration-150 hover:text-ember"
          >
            NEXT ▸
          </button>
        </div>
      </div>

      <motion.div
        key={selM.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="mt-6 flex flex-col gap-9 md:mt-[34px] md:flex-row md:items-start md:gap-11"
      >
        {/* plate — sticky: the prose column always outruns it, so let it track
            the reading instead of stranding whitespace at the bottom left */}
        <div className="w-full md:sticky md:top-4 md:w-[470px] md:flex-none md:self-start">
          <ModelPlate model={selM} inset={8} />
          <div className="mt-2.5 flex justify-between">
            <span className="font-mono text-[10px] tracking-[0.08em] text-stone">
              {selM.cap ? `«${capTitle(selM)}»` : ''}
            </span>
            <span className="font-mono text-[10px] text-faded">
              NO. {selM.id} OF {MODELS.length}
            </span>
          </div>

          {selM.demo && (
            <div
              className="mt-[22px] flex h-[110px] items-center justify-center border border-dashed border-ink/30"
              style={{
                background:
                  'repeating-linear-gradient(45deg, transparent 0 6px, rgba(63,93,122,.07) 6px 7px)',
              }}
            >
              <span className="font-mono text-[10px] text-drab">
                [ interactive demo: {selM.demo} ]
              </span>
            </div>
          )}

          {/* prompt + record ride the left column on desktop; on mobile they
              follow the prose so the model itself comes first */}
          <div className="hidden md:block">
          <CopyPrompt id={selM.id} />

          {/* the specimen record — everything about the plate that isn't prose */}
          <dl className="mt-[22px] border-t border-ink/14 pt-3">
            <dt className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              PROVENANCE
            </dt>
            <dd className="mt-1.5 flex items-center gap-1.5 font-serif text-[13px] text-umber">
              <span
                className="inline-block h-[7px] w-[7px] flex-none rounded-full"
                style={{ background: PROV_DOT[selM.provenance] }}
              />
              {PROVENANCE_LABELS[selM.provenance]}
            </dd>
            {selM.mungerQuote && (
              <dd className="mt-2 border-l-2 border-ember/40 pl-2.5 font-serif text-[12.5px] italic leading-[1.5] text-drab">
                “{selM.mungerQuote}”
              </dd>
            )}
            {selM.mungerCitation && (
              <dd className="mt-2 font-mono text-[9px] leading-[1.6] text-faded">
                {selM.mungerCitation}
              </dd>
            )}

            {thinkers.length > 0 && (
              <>
                <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
                  THINKERS
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {thinkers.map((t) => (
                    <Link
                      key={t.slug}
                      to={`/thinkers/${t.slug}`}
                      className="cursor-pointer rounded-[2px] border border-ink/20 px-1.5 py-[2px] font-mono text-[9.5px] text-drab transition-colors duration-150 hover:border-ember hover:text-ember"
                    >
                      {t.name}
                    </Link>
                  ))}
                </dd>
              </>
            )}

            {(selM.aka?.length ?? 0) > 0 && (
              <>
                <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
                  ALSO KNOWN AS
                </dt>
                <dd className="mt-1.5 font-serif text-[12.5px] italic leading-[1.5] text-drab">
                  {selM.aka!.slice(0, 4).join(' · ')}
                </dd>
              </>
            )}

            <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              WIRED TO
            </dt>
            <dd className="mt-1.5 font-mono text-[11px] text-prussian">
              ⁘ {selM.links.length} NEIGHBORS
            </dd>

            <SourceList model={selM} />
          </dl>
          </div>
        </div>

        {/* prose */}
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[36px] font-medium leading-[1.05] tracking-[-0.015em] text-pretty md:text-[52px] [font-optical-sizing:none]">
            {selM.name}
          </div>
          <div className="mt-2.5 font-serif text-[19px] italic leading-[1.45] text-ember">
            {selM.blurb}
          </div>
          <div className="mt-5 font-serif text-base leading-[1.7] text-umber">
            <span className="float-left pr-2.5 pt-1.5 font-serif text-[40px] font-medium leading-[0.82] text-ember md:text-[54px]">
              {selM.long.charAt(0)}
            </span>
            {selM.long.slice(1)}
          </div>

          <div className="clear-both" />
          <Examples id={selM.id} />

          {/* actions sit above the lattice, so a well-wired plate can't push them off-screen */}
          <div className="mt-[26px] flex flex-wrap gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggleStudied(id)}
              className="cursor-pointer rounded-[2px] px-[22px] py-[11px] text-center font-mono text-[11px] font-medium tracking-[0.1em] text-card transition-colors duration-200 hover:opacity-[0.88]"
              style={{ background: isStudied ? '#3f5d7a' : '#c65a2e' }}
            >
              {isStudied ? 'STUDIED ✦' : 'MARK STUDIED ✦'}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onToggleSaved(id)}
              className="cursor-pointer rounded-[2px] border px-[18px] py-[11px] font-mono text-[11px] font-medium tracking-[0.1em] transition-colors duration-150"
              style={{
                borderColor: isSaved ? '#c65a2e' : 'rgba(33,29,20,.3)',
                color: isSaved ? '#c65a2e' : '#211d14',
                background: isSaved ? 'rgba(198,90,46,.07)' : 'transparent',
              }}
            >
              {isSaved ? 'SAVED ❖' : 'SAVE ❖'}
            </motion.button>
            {selM.demo && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className="cursor-pointer rounded-[2px] border border-ink/30 px-[18px] py-[11px] font-mono text-[11px] font-medium transition-colors duration-150 hover:border-ink"
              >
                RUN THE DEMO ▸
              </motion.button>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={share}
              className="cursor-pointer rounded-[2px] border px-[18px] py-[11px] font-mono text-[11px] font-medium tracking-[0.1em] transition-colors duration-150"
              style={{
                borderColor: copied ? '#3f5d7a' : 'rgba(33,29,20,.3)',
                color: copied ? '#3f5d7a' : '#211d14',
              }}
            >
              {copied ? 'LINK COPIED ✓' : 'SHARE ⁘'}
            </motion.button>
          </div>

          <div className="md:hidden">
          <CopyPrompt id={selM.id} />

          {/* the specimen record — everything about the plate that isn't prose */}
          <dl className="mt-[22px] border-t border-ink/14 pt-3">
            <dt className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              PROVENANCE
            </dt>
            <dd className="mt-1.5 flex items-center gap-1.5 font-serif text-[13px] text-umber">
              <span
                className="inline-block h-[7px] w-[7px] flex-none rounded-full"
                style={{ background: PROV_DOT[selM.provenance] }}
              />
              {PROVENANCE_LABELS[selM.provenance]}
            </dd>
            {selM.mungerQuote && (
              <dd className="mt-2 border-l-2 border-ember/40 pl-2.5 font-serif text-[12.5px] italic leading-[1.5] text-drab">
                “{selM.mungerQuote}”
              </dd>
            )}
            {selM.mungerCitation && (
              <dd className="mt-2 font-mono text-[9px] leading-[1.6] text-faded">
                {selM.mungerCitation}
              </dd>
            )}

            {thinkers.length > 0 && (
              <>
                <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
                  THINKERS
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {thinkers.map((t) => (
                    <Link
                      key={t.slug}
                      to={`/thinkers/${t.slug}`}
                      className="cursor-pointer rounded-[2px] border border-ink/20 px-1.5 py-[2px] font-mono text-[9.5px] text-drab transition-colors duration-150 hover:border-ember hover:text-ember"
                    >
                      {t.name}
                    </Link>
                  ))}
                </dd>
              </>
            )}

            {(selM.aka?.length ?? 0) > 0 && (
              <>
                <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
                  ALSO KNOWN AS
                </dt>
                <dd className="mt-1.5 font-serif text-[12.5px] italic leading-[1.5] text-drab">
                  {selM.aka!.slice(0, 4).join(' · ')}
                </dd>
              </>
            )}

            <dt className="mt-4 border-t border-ink/10 pt-3 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
              WIRED TO
            </dt>
            <dd className="mt-1.5 font-mono text-[11px] text-prussian">
              ⁘ {selM.links.length} NEIGHBORS
            </dd>

            <SourceList model={selM} />
          </dl>
          </div>
        </div>
      </motion.div>

      {/* see also — the ego lattice, full width beneath both columns */}
      <div className="mt-9 border-t border-ink/14 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            SEE ALSO — WIRED TO {selM.links.length} NEIGHBORS
          </span>
          <span className="font-mono text-[9.5px] text-faded">CLICK A NODE TO FOLLOW THE WIRE</span>
        </div>
        <div className="mt-2 border border-dotted border-ink/25 bg-card/60 px-2 py-1">
          <MiniLattice model={selM} max={RING} />
        </div>
        {rest.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
            {rest.map((m) => (
              <Link
                key={m.id}
                to={modelPath(m)}
                className="cursor-pointer rounded-[2px] border border-prussian/30 px-2 py-[3px] font-serif text-[12px] italic text-prussian transition-colors duration-150 hover:border-ember hover:text-ember"
              >
                {m.name.length > 40 ? m.name.slice(0, 39) + '…' : m.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* the reader who arrived from a friend's link never saw the hero form */}
      <div className="mt-10 border border-dotted border-ink/30 bg-card/60 px-5 py-4 md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <div className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            ONE MODEL A DAY
          </div>
          <div className="mt-1 font-serif text-[14px] italic leading-[1.5] text-umber">
            Liked this one? There are {MODELS.length} more — one lands in your inbox every
            morning.
          </div>
        </div>
        <div className="md:w-[320px] md:flex-none">
          <SubscribeForm variant="band" />
        </div>
      </div>
    </div>
  )
}
