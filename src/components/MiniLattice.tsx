import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MODELS_BY_ID, type Model } from '../data/models'
import { ModelPopover } from './ModelPopover'

interface MiniLatticeProps {
  model: Model
  /** hubs wire to 20+ neighbours; past this the ring turns to mush */
  max?: number
}

const W = 720
const H = 300

/**
 * The ego network of one model: the plate at centre, its neighbours on rings
 * around it. Two rings once past eight, so a hub doesn't crush its own labels.
 */
export function MiniLattice({ model, max = 16 }: MiniLatticeProps) {
  const navigate = useNavigate()
  const [hov, setHov] = useState<string | null>(null)

  const neighbors = model.links.map((id) => MODELS_BY_ID[id]).filter(Boolean)
  const shown = neighbors.slice(0, max)
  const overflow = neighbors.length - shown.length

  const cx = W / 2
  const cy = H / 2
  const inner = shown.slice(0, Math.min(8, shown.length))
  const outer = shown.slice(8)

  const place = (i: number, n: number, rx: number, ry: number) => {
    // start at the top and walk clockwise; offset the outer ring so the two
    // rings don't line up radially and collide
    const a = (i / n) * Math.PI * 2 - Math.PI / 2 + (rx > 200 ? Math.PI / n : 0)
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }
  }

  const nodes = [
    ...inner.map((m, i) => ({ m, ...place(i, inner.length, 158, 82) })),
    ...outer.map((m, i) => ({ m, ...place(i, outer.length, 292, 132) })),
  ]

  const short = (s: string, n = 26) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
  const hovNode = nodes.find((n) => n.m.id === hov)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none">
        {nodes.map(({ m, x, y }) => (
          <line
            key={'e' + m.id}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={hov === m.id ? 'rgba(198,90,46,.85)' : 'rgba(63,93,122,.42)'}
            strokeWidth={hov === m.id ? 1.8 : 1}
          />
        ))}

        {nodes.map(({ m, x, y }) => {
          const on = hov === m.id
          return (
            <g
              key={m.id}
              onMouseEnter={() => setHov(m.id)}
              onMouseLeave={() => setHov(null)}
              onClick={() => navigate(`/models/${m.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={5.5}
                fill="#fbf8f0"
                stroke={on ? '#c65a2e' : '#3f5d7a'}
                strokeWidth={on ? 2.2 : 1.3}
              />
              <circle cx={x} cy={y} r={13} fill="transparent" />
              <text
                x={x}
                y={y + (y < cy ? -12 : 20)}
                textAnchor="middle"
                className="font-serif"
                style={{
                  fontSize: 11,
                  fontStyle: 'italic',
                  fill: on ? '#c65a2e' : '#4a443a',
                  paintOrder: 'stroke',
                  stroke: '#f3efe4',
                  strokeWidth: 3.5,
                }}
              >
                {short(m.name)}
              </text>
            </g>
          )
        })}

        {/* the plate itself */}
        <circle cx={cx} cy={cy} r={9} fill="#c65a2e" stroke="#211d14" strokeWidth={1.4} />
        <text
          x={cx}
          y={cy + 25}
          textAnchor="middle"
          className="font-serif"
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            fill: '#211d14',
            paintOrder: 'stroke',
            stroke: '#f3efe4',
            strokeWidth: 4,
          }}
        >
          {short(model.name, 30)}
        </text>

        {overflow > 0 && (
          <text
            x={W - 6}
            y={H - 6}
            textAnchor="end"
            className="font-mono"
            style={{ fontSize: 9.5, fill: '#b0a894' }}
          >
            +{overflow} MORE BELOW
          </text>
        )}
      </svg>

      {/* hover card, positioned in HTML over the SVG so it can't be clipped by
          the viewBox. Flips side and vertical anchor near the edges. */}
      {hovNode && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: `${(hovNode.x / W) * 100}%`,
            top: `${(hovNode.y / H) * 100}%`,
            transform: `translate(${hovNode.x > W * 0.6 ? '-100%' : '0'}, ${
              hovNode.y > H * 0.5 ? '-100%' : '0'
            }) translate(${hovNode.x > W * 0.6 ? '-14px' : '14px'}, ${
              hovNode.y > H * 0.5 ? '-14px' : '14px'
            })`,
          }}
        >
          <ModelPopover model={hovNode.m} />
        </div>
      )}
    </div>
  )
}
