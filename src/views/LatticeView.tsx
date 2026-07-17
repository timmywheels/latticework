import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  CLUSTER_LABELS,
  DISCIPLINE_ORDER,
  LATTICE_H,
  LATTICE_W,
  MODELS,
  MODELS_BY_ID,
  PEOPLE,
  modelPath,
  type Discipline,
  type Model,
  type Provenance,
} from '../data/models'
import { Bust } from '../components/Bust'
import { ModelPopover } from '../components/ModelPopover'
import { useKeys } from '../hooks/useKeys'

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

/** Munger's own words vs. everything the compilers and this catalog added. */
const PROV_DOT: Record<Provenance, string> = {
  'munger-named': '#c65a2e',
  'munger-used': '#d98b64',
  'munger-adjacent': '#3f5d7a',
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
            stroke={e.cross ? 'rgba(63,93,122,.07)' : 'rgba(33,29,20,.13)'}
            strokeWidth={0.75}
            // hairline at every zoom — SVG-unit strokes fatten as the viewBox shrinks
            vectorEffect="non-scaling-stroke"
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
  const [full, setFull] = useState(false)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  // filters live in the URL so back/forward and shared links restore the view
  const [params, setParams] = useSearchParams()
  const who = params.get('who') ?? ''
  const rawDiscipline = (params.get('discipline') ?? '').toUpperCase()
  const disc = (DISCIPLINE_ORDER as string[]).includes(rawDiscipline)
    ? (rawDiscipline as Discipline)
    : 'ALL'

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (!v || v === 'ALL') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const matches = useCallback(
    (m: Model) =>
      (disc === 'ALL' || m.disc === disc) && (!who || (m.thinkers ?? []).includes(who)),
    [disc, who],
  )

  const visible = useMemo(() => {
    if (disc === 'ALL' && !who) return null
    return new Set(MODELS.filter(matches).map((m) => m.id))
  }, [disc, who, matches])

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

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
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
  }, [])

  // the wheel listener is native and stable, so it reads the box through a ref
  const boxRef = useRef(box)
  useLayoutEffect(() => {
    boxRef.current = box
  })

  const toSvg = (clientX: number, clientY: number) => {
    const b = boxRef.current
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    return {
      x: b.x + ((clientX - r.left) / r.width) * b.w,
      y: b.y + ((clientY - r.top) / r.height) * b.h,
    }
  }

  // Zoom rides the actual wheel delta: a trackpad's stream of small events nudges
  // the view a hair each, a mouse notch steps ~1.15× — instead of the old flat
  // 1.18× per event, which compounded trackpad streams into overshoot. Native and
  // non-passive because React's onWheel can't preventDefault the page scroll.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const dy = Math.max(-240, Math.min(240, e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY))
      const p = toSvg(e.clientX, e.clientY)
      zoomAt(p.x, p.y, Math.exp(-dy * 0.0014))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomAt])

  useKeys((e) => {
    if (e.key === 'Escape') {
      if (picked) {
        setPicked(null)
      } else if (full) {
        setFull(false)
      } else {
        setBox(FULL)
      }
    } else if (e.key === 'r') {
      setBox(FULL)
    } else if (e.key === 'f') {
      setFull((v) => !v)
    }
  })

  // fullscreen locks the page scroll behind the map
  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [full])

  // touch: one finger pans (drag), two fingers pinch about their midpoint
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchDist = useRef<number | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y)
      drag.current = null
    } else {
      drag.current = { px: e.clientX, py: e.clientY, ox: box.x, oy: box.y }
    }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
    if (pinchDist.current !== null && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (dist > 0 && pinchDist.current > 0) {
        const mid = toSvg((a.x + b.x) / 2, (a.y + b.y) / 2)
        zoomAt(mid.x, mid.y, dist / pinchDist.current)
      }
      pinchDist.current = dist
      return
    }
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

  const endDrag = (e?: React.PointerEvent) => {
    if (e) {
      pointers.current.delete(e.pointerId)
    } else {
      pointers.current.clear()
    }
    if (pointers.current.size < 2) {
      pinchDist.current = null
    }
    drag.current = null
  }

  // when a filter narrows the set, frame what survives — nine Roosevelt models
  // marooned across a 3200×2000 plate is technically correct and useless
  const filterKey = `${who}|${disc}`
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

  return (
    <div className="mx-auto w-full max-w-[1280px] box-border px-4 pb-12 pt-6 md:px-7 md:pt-[30px]">
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div className="font-serif text-[26px] font-medium tracking-[-0.01em] md:text-[32px]">
          The lattice itself.
        </div>
        <div className="hidden font-mono text-[10px] tracking-[0.1em] text-stone md:block">
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
        <div className="no-scrollbar flex gap-x-1 gap-y-3 overflow-x-auto pb-1">
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

      <div className="no-scrollbar mt-2.5 flex items-center gap-x-1.5 gap-y-2 overflow-x-auto md:flex-wrap md:overflow-visible">
        <span className="mr-1 flex-none font-mono text-[9.5px] font-medium tracking-[0.18em] text-stone">
          DISCIPLINE
        </span>
        {(['ALL', ...DISCIPLINE_ORDER] as (Discipline | 'ALL')[]).map((d) => {
          const active = disc === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => setParam('discipline', d === 'ALL' ? '' : d.toLowerCase())}
              className="flex-none cursor-pointer rounded-[2px] px-2 py-[3px] font-mono text-[9.5px] transition-colors duration-150 hover:bg-ember/8"
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
          className="ml-2 flex flex-none cursor-pointer items-center gap-1.5 rounded-[2px] border px-2 py-[3px] font-mono text-[9.5px] transition-colors duration-150"
          style={{
            borderColor: showCross ? 'rgba(63,93,122,.5)' : 'rgba(33,29,20,.2)',
            color: showCross ? '#3f5d7a' : '#8a8272',
          }}
        >
          {showCross ? '◉' : '○'} CROSS-LINKS {CROSS_COUNT}
        </button>
      </div>

      <div className={full ? 'fixed inset-0 z-50 bg-card' : 'relative mt-3 border border-ink bg-card'}>
        <div className="pointer-events-none absolute inset-2 z-10 border border-dotted border-ink/30" />
        {pickedM && (
          <div className="absolute left-2 right-2 top-2 z-30 md:left-auto md:right-3 md:top-3">
            <ModelPopover
              className="w-full md:w-[290px]"
              model={pickedM}
              onOpen={() => navigate(modelPath(pickedM), { state: { from: `/lattice?${params.toString()}` } })}
              onClose={() => setPicked(null)}
            />
          </div>
        )}
        {!pickedM && (
          <div className="absolute right-3 top-3 z-20 flex gap-2">
            {(box.w !== FULL.w || box.x !== 0 || box.y !== 0) && (
              <button
                type="button"
                onClick={() => setBox(FULL)}
                className="cursor-pointer rounded-[2px] border border-ink/30 bg-card px-2.5 py-1 font-mono text-[9.5px] tracking-[0.08em] text-drab transition-colors duration-150 hover:border-ink hover:text-ink"
              >
                RESET VIEW
              </button>
            )}
            <button
              type="button"
              onClick={() => setFull((v) => !v)}
              className="cursor-pointer rounded-[2px] border border-ink/30 bg-card px-2.5 py-1 font-mono text-[9.5px] tracking-[0.08em] text-drab transition-colors duration-150 hover:border-ink hover:text-ink"
            >
              {full ? '✕ EXIT' : '⛶ FULL SCREEN'}
            </button>
          </div>
        )}
        <svg
          ref={svgRef}
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          className={`block w-full touch-none select-none ${full ? 'h-full' : 'h-auto'}`}
          style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
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
                stroke="rgba(63,93,122,.8)"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
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
            const stroke = isHov ? '#c65a2e' : isNeighbor ? '#3f5d7a' : '#211d14'
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
      <div className="mt-3 hidden min-h-[42px] items-start gap-4 border-t border-ink/14 pt-3 md:flex">
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
            <span className="flex-none font-mono text-[9.5px] text-prussian">
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
