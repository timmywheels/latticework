import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  CLUSTER_LABELS,
  DISCIPLINE_ORDER,
  LATTICE_H,
  LATTICE_W,
  MODELS,
  MODELS_BY_ID,
  PEOPLE,
  PROVENANCE_LABELS,
  type Discipline,
  type Model,
  type Provenance,
} from '../data/models'
import { Bust } from '../components/Bust'
import { ModelPopover } from '../components/ModelPopover'

interface LatticeViewProps {
  studied: string[]
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

const FULL: Box = { x: 0, y: 0, w: LATTICE_W, h: LATTICE_H }
const MIN_W = 380
const PROVENANCES = Object.keys(PROVENANCE_LABELS) as Provenance[]

/** Munger's own words vs. everything the compilers and this catalog added. */
const PROV_DOT: Record<Provenance, string> = {
  'munger-named': '#c65a2e',
  'munger-used': '#d98b64',
  'munger-adjacent': '#2e7f74',
  community: '#8a8272',
  'canon-addition': '#b0a894',
}

const DEGREE = new Map(MODELS.map((m) => [m.id, m.links.length]))

interface Edge {
  a: string
  b: string
  x1: number
  y1: number
  x2: number
  y2: number
  cross: boolean
}

const ALL_EDGES: Edge[] = (() => {
  const seen = new Set<string>()
  const out: Edge[] = []
  for (const m of MODELS) {
    for (const id of m.links) {
      const o = MODELS_BY_ID[id]
      if (!o) continue
      const key = m.id < id ? `${m.id}-${id}` : `${id}-${m.id}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ a: m.id, b: id, x1: m.lx, y1: m.ly, x2: o.lx, y2: o.ly, cross: m.disc !== o.disc })
    }
  }
  return out
})()

const CROSS_COUNT = ALL_EDGES.filter((e) => e.cross).length

/**
 * Static under-layer. Re-renders only when filters change — never on hover.
 * Cross-discipline edges are drawn fainter: at 2.9k edges they otherwise wash
 * the whole plate grey and bury the island structure.
 */
const BaseEdges = memo(function BaseEdges({
  visible,
  showCross,
}: {
  visible: Set<string> | null
  showCross: boolean
}) {
  return (
    <g>
      {ALL_EDGES.map((e, i) => {
        if (e.cross && !showCross) return null
        if (visible && !(visible.has(e.a) && visible.has(e.b))) return null
        return (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={e.cross ? 'rgba(46,127,116,.09)' : 'rgba(33,29,20,.2)'}
            strokeWidth={1}
          />
        )
      })}
    </g>
  )
})

export function LatticeView({ studied }: LatticeViewProps) {
  const navigate = useNavigate()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [box, setBox] = useState<Box>(FULL)
  const [hover, setHover] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [showCross, setShowCross] = useState(true)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  // filters live in the URL so back/forward and shared links restore the view
  const [params, setParams] = useSearchParams()
  const who = params.get('who') ?? ''
  const prov = (params.get('prov') as Provenance | null) ?? 'ALL'
  const disc = (params.get('disc') as Discipline | null) ?? 'ALL'

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (!v || v === 'ALL') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const matches = useCallback(
    (m: Model) =>
      (prov === 'ALL' || m.provenance === prov) &&
      (disc === 'ALL' || m.disc === disc) &&
      (!who || (m.thinkers ?? []).includes(who)),
    [prov, disc, who],
  )

  const visible = useMemo(() => {
    if (prov === 'ALL' && disc === 'ALL' && !who) return null
    return new Set(MODELS.filter(matches).map((m) => m.id))
  }, [prov, disc, who, matches])

  const shown = useMemo(() => (visible ? MODELS.filter((m) => visible.has(m.id)) : MODELS), [visible])

  const hovM = hover ? MODELS_BY_ID[hover] : null
  const neighbors = useMemo(() => new Set(hovM ? hovM.links : []), [hovM])

  const hotEdges = useMemo(() => {
    if (!hovM) return []
    return ALL_EDGES.filter(
      (e) =>
        (e.a === hovM.id || e.b === hovM.id) &&
        (!visible || (visible.has(e.a) && visible.has(e.b))),
    )
  }, [hovM, visible])

  // scale: 1 = fully zoomed out. Labels earn their space as you zoom in — but a
  // filter that leaves only a handful of nodes should name them immediately,
  // otherwise "Roosevelt" reads as nine anonymous dots on an empty plate.
  const scale = LATTICE_W / box.w
  const labelAll = scale > 2.6 || shown.length <= 60

  const zoomAt = (cx: number, cy: number, factor: number) => {
    setBox((b) => {
      const w = Math.min(LATTICE_W, Math.max(MIN_W, b.w / factor))
      const h = w * (LATTICE_H / LATTICE_W)
      const rx = (cx - b.x) / b.w
      const ry = (cy - b.y) / b.h
      return {
        w,
        h,
        x: Math.min(LATTICE_W - w, Math.max(0, cx - rx * w)),
        y: Math.min(LATTICE_H - h, Math.max(0, cy - ry * h)),
      }
    })
  }

  const toSvg = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
    return {
      x: box.x + ((clientX - r.left) / r.width) * box.w,
      y: box.y + ((clientY - r.top) / r.height) * box.h,
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    const p = toSvg(e.clientX, e.clientY)
    zoomAt(p.x, p.y, e.deltaY < 0 ? 1.18 : 1 / 1.18)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, ox: box.x, oy: box.y }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return
    const dx = ((e.clientX - d.px) / r.width) * box.w
    const dy = ((e.clientY - d.py) / r.height) * box.h
    setBox((b) => ({
      ...b,
      x: Math.min(LATTICE_W - b.w, Math.max(0, d.ox - dx)),
      y: Math.min(LATTICE_H - b.h, Math.max(0, d.oy - dy)),
    }))
  }

  const endDrag = () => {
    drag.current = null
  }

  // when a filter narrows the set, frame what survives — nine Roosevelt models
  // marooned across a 3200×2000 plate is technically correct and useless
  const filterKey = `${who}|${prov}|${disc}`
  useEffect(() => {
    setPicked(null)
    if (!visible) {
      setBox(FULL)
      return
    }
    const pts = MODELS.filter((m) => visible.has(m.id))
    if (!pts.length) return
    const xs = pts.map((m) => m.lx)
    const ys = pts.map((m) => m.ly)
    const pad = 180
    const x0 = Math.max(0, Math.min(...xs) - pad)
    const x1 = Math.min(LATTICE_W, Math.max(...xs) + pad)
    const y0 = Math.max(0, Math.min(...ys) - pad)
    const y1 = Math.min(LATTICE_H, Math.max(...ys) + pad)
    // grow the box to the plate's aspect so the SVG never letterboxes
    let w = Math.max(x1 - x0, (y1 - y0) * (LATTICE_W / LATTICE_H), MIN_W)
    w = Math.min(w, LATTICE_W)
    const h = w * (LATTICE_H / LATTICE_W)
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    setBox({
      w,
      h,
      x: Math.min(LATTICE_W - w, Math.max(0, cx - w / 2)),
      y: Math.min(LATTICE_H - h, Math.max(0, cy - h / 2)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const pickedM = picked ? MODELS_BY_ID[picked] : null
  const whoM = who ? (PEOPLE.find((p) => p.slug === who) ?? null) : null
  const rail: (Provenance | 'ALL')[] = ['ALL', ...PROVENANCES]
  const provCount = (p: Provenance | 'ALL') =>
    p === 'ALL' ? MODELS.length : MODELS.filter((m) => m.provenance === p).length

  return (
    <div className="mx-auto w-full max-w-[1280px] box-border px-7 pb-12 pt-[30px]">
      <div className="flex items-baseline justify-between">
        <div className="font-serif text-[32px] font-medium tracking-[-0.01em]">
          The lattice itself.
        </div>
        <div className="font-mono text-[10px] tracking-[0.1em] text-stone">
          {shown.length} OF {MODELS.length} MODELS · SCROLL TO ZOOM · DRAG TO PAN · CLICK A NODE
        </div>
      </div>

      {/* thinkers — the primary way in. Munger is one bust among many, not the frame. */}
      <div className="mt-4 border-y border-ink/12 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
            THINKERS
          </span>
          {who && (
            <button
              type="button"
              onClick={() => setParam('who', '')}
              className="cursor-pointer font-mono text-[9.5px] text-ember transition-colors duration-150 hover:text-ink"
            >
              CLEAR ✕
            </button>
          )}
        </div>
        <div className="flex gap-x-1 gap-y-3 overflow-x-auto pb-1">
          {PEOPLE.map((p) => (
            <Bust
              key={p.slug}
              slug={p.slug}
              name={p.name}
              count={p.count}
              active={who === p.slug}
              onClick={() => setParam('who', who === p.slug ? '' : p.slug)}
            />
          ))}
        </div>
        {whoM && (
          <div className="mt-1 font-serif text-[13px] italic text-drab">
            {whoM.name} — {whoM.count} models on the lattice.{' '}
            <span className="font-mono text-[10px] not-italic text-faded">
              PORTRAIT ART TO COME
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        <span className="mr-1 font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
          DISCIPLINE
        </span>
        {(['ALL', ...DISCIPLINE_ORDER] as (Discipline | 'ALL')[]).map((d) => {
          const active = disc === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => setParam('disc', d)}
              className="cursor-pointer rounded-[2px] px-2 py-[3px] font-mono text-[9.5px] transition-colors duration-150 hover:bg-ember/8"
              style={{
                background: active ? 'rgba(198,90,46,.12)' : 'transparent',
                color: active ? '#211d14' : '#8a8272',
                fontWeight: active ? 500 : 400,
              }}
            >
              {d}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setShowCross((v) => !v)}
          className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-[2px] border px-2 py-[3px] font-mono text-[9.5px] transition-colors duration-150"
          style={{
            borderColor: showCross ? 'rgba(46,127,116,.5)' : 'rgba(33,29,20,.2)',
            color: showCross ? '#2e7f74' : '#8a8272',
          }}
        >
          {showCross ? '◉' : '○'} CROSS-LINKS {CROSS_COUNT}
        </button>
      </div>

      {/* provenance — demoted to a quiet sub-filter; it is a footnote about sourcing,
          not the organising idea of the lattice */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        <span className="mr-1 font-mono text-[9.5px] font-medium tracking-[0.18em] text-faded">
          SOURCING
        </span>
        {rail.map((p) => {
          const active = prov === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setParam('prov', p)}
              className="flex cursor-pointer items-center gap-1 rounded-[2px] px-1.5 py-[2px] font-mono text-[9px] transition-colors duration-150 hover:bg-ink/5"
              style={{ color: active ? '#211d14' : '#b0a894', fontWeight: active ? 500 : 400 }}
            >
              {p !== 'ALL' && (
                <span
                  className="inline-block h-[6px] w-[6px] rounded-full"
                  style={{ background: PROV_DOT[p], opacity: active ? 1 : 0.5 }}
                />
              )}
              {p === 'ALL' ? 'ALL' : PROVENANCE_LABELS[p].toUpperCase()} {provCount(p)}
            </button>
          )
        })}
      </div>

      <div className="relative mt-3 border border-ink bg-card">
        <div className="pointer-events-none absolute inset-2 z-10 border border-dotted border-ink/30" />
        {pickedM && (
          <div className="absolute right-3 top-3 z-30">
            <ModelPopover
              model={pickedM}
              onOpen={() => navigate(`/models/${pickedM.id}`, { state: { from: `/lattice?${params.toString()}` } })}
              onClose={() => setPicked(null)}
            />
          </div>
        )}
        {!pickedM && (box.w !== FULL.w || box.x !== 0 || box.y !== 0) && (
          <button
            type="button"
            onClick={() => setBox(FULL)}
            className="absolute right-3 top-3 z-20 cursor-pointer rounded-[2px] border border-ink/30 bg-card px-2.5 py-1 font-mono text-[9.5px] tracking-[0.08em] text-drab transition-colors duration-150 hover:border-ink hover:text-ink"
          >
            RESET VIEW
          </button>
        )}
        <svg
          ref={svgRef}
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          className="block h-auto w-full touch-none select-none"
          style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={() => {
            endDrag()
            setHover(null)
          }}
        >
          <BaseEdges visible={visible} showCross={showCross} />

          {/* hovered node's edges, lit */}
          <g>
            {hotEdges.map((e, i) => (
              <line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke="rgba(46,127,116,.9)"
                strokeWidth={2.4 / scale}
              />
            ))}
          </g>

          {shown.map((m) => {
            const isStudied = studied.includes(m.id)
            const isHov = hover === m.id || picked === m.id
            const isNeighbor = neighbors.has(m.id)
            const dim = !!hovM && !isHov && !isNeighbor
            // sqrt-damped: full size zoomed out, growing gently as you zoom in — linear
            // scaling balloons the nodes past their labels, dividing it out shrinks them to dots
            const r = (5 + Math.min(DEGREE.get(m.id) ?? 0, 24) * 0.42) / Math.sqrt(scale)
            const stroke = isHov ? '#c65a2e' : isNeighbor ? '#2e7f74' : '#211d14'
            return (
              <g
                key={m.id}
                onMouseEnter={() => setHover(m.id)}
                onClick={() => !drag.current && setPicked(m.id)}
                style={{ cursor: 'pointer', opacity: dim ? 0.28 : 1 }}
              >
                <circle
                  cx={m.lx}
                  cy={m.ly}
                  r={r}
                  fill={isStudied ? '#c65a2e' : '#fbf8f0'}
                  stroke={stroke}
                  strokeWidth={(isHov || isNeighbor ? 2.4 : 1.2) / Math.sqrt(scale)}
                />
                {/* a fatter invisible target so small nodes stay clickable when zoomed out */}
                <circle cx={m.lx} cy={m.ly} r={Math.max(r, 12 / scale)} fill="transparent" />
                {(labelAll || isHov || isNeighbor) && (
                  <text
                    x={m.lx}
                    y={m.ly + r + 17 / scale}
                    textAnchor="middle"
                    className="pointer-events-none font-serif"
                    style={{
                      // SVG units are ~0.5 screen px at full zoom-out, so 13 units
                      // rendered at ~6px — under the legibility floor
                      fontSize: 21 / scale,
                      fill: isHov ? '#c65a2e' : '#211d14',
                      fontWeight: 500,
                      paintOrder: 'stroke',
                      stroke: '#fbf8f0',
                      strokeWidth: 5 / scale,
                    }}
                  >
                    {m.name.length > 34 ? m.name.slice(0, 33) + '…' : m.name}
                  </text>
                )}
              </g>
            )
          })}

          {/* island labels render last so they sit above the nodes, not under them */}
          {CLUSTER_LABELS.filter((l) => disc === 'ALL' || l.name === disc).map((l) => (
            <text
              key={l.name}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              className="pointer-events-none font-mono"
              style={{
                fontSize: Math.min(26, 22 / Math.min(scale, 1.8)),
                letterSpacing: '0.18em',
                fill: '#8a8272',
                fontWeight: 500,
                paintOrder: 'stroke',
                stroke: '#fbf8f0',
                strokeWidth: 6 / Math.min(scale, 1.8),
              }}
            >
              {l.name}
            </text>
          ))}
        </svg>
      </div>

      {/* hover readout — keeps the graph legible without tooltips fighting the edges */}
      <div className="mt-3 flex min-h-[42px] items-start gap-4 border-t border-ink/14 pt-3">
        {hovM ? (
          <>
            <span className="w-[44px] flex-none font-mono text-[11px] font-medium text-ember">
              {hovM.id}
            </span>
            <span className="w-[210px] flex-none font-serif text-[16px] font-medium leading-tight">
              {hovM.name}
            </span>
            <span className="min-w-0 flex-1 font-serif text-[13px] italic leading-[1.4] text-drab">
              {hovM.blurb}
            </span>
            <span className="flex-none font-mono text-[9.5px] text-verdigris">
              ⁘ {hovM.links.length}
            </span>
            <span className="flex w-[190px] flex-none items-center justify-end gap-1.5 font-mono text-[9.5px] text-stone">
              {(hovM.thinkers ?? []).length > 0 && (
                <span className="truncate text-ember">
                  {(hovM.thinkers ?? [])
                    .map((t) => PEOPLE.find((p) => p.slug === t)?.name ?? t)
                    .join(' · ')}
                </span>
              )}
              <span
                className="inline-block h-[7px] w-[7px] flex-none rounded-full"
                style={{ background: PROV_DOT[hovM.provenance] }}
              />
            </span>
          </>
        ) : (
          <span className="font-mono text-[10px] text-faded">
            HOVER A NODE TO LIGHT ITS EDGES · NODE SIZE = CONNECTIONS · ✦ EMBER = STUDIED
          </span>
        )}
      </div>
    </div>
  )
}
