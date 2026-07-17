import type { ReactNode } from 'react'
import { ART_READY_ID, type Discipline, type Model } from '../data/models'
import { PlateArt } from './PlateArt'

const INK = '#211d14'
const EMBER = '#c65a2e'
const PRUSSIAN = '#3f5d7a'
const STONE = '#8a8272'

/** the little surveyor's crosses PlateArt scatters through empty field */
function Mark({ x, y, o = 0.4 }: { x: number; y: number; o?: number }) {
  return (
    <path
      d={`M ${x - 4} ${y} L ${x + 4} ${y} M ${x} ${y - 4} L ${x} ${y + 4}`}
      stroke={INK}
      strokeWidth="1"
      opacity={o}
    />
  )
}

/** the triple ground rule from PlateArt, for plates whose subject stands on land */
function Ground() {
  return (
    <>
      <line x1="24" y1="240" x2="376" y2="240" stroke={INK} strokeWidth="1.2" />
      <line x1="24" y1="247" x2="376" y2="247" stroke={INK} strokeWidth="0.6" opacity="0.4" />
      <line x1="24" y1="252" x2="376" y2="252" stroke={INK} strokeWidth="0.6" opacity="0.2" />
    </>
  )
}

function Frame({
  inset,
  title,
  disc,
  children,
}: {
  inset: number
  title: string
  disc: Discipline
  children: ReactNode
}) {
  return (
    <div className="relative border border-ink bg-card">
      <div
        className="pointer-events-none absolute border border-dotted border-ink/35"
        style={{ inset }}
      />
      <svg viewBox="0 0 400 280" className="block h-auto w-full">
        {children}
        <text x="24" y="268" fill={STONE} fontSize="8" fontFamily="'IBM Plex Mono', monospace">
          «{title}»
        </text>
        <text
          x="376"
          y="268"
          textAnchor="end"
          fill={STONE}
          fontSize="8"
          fontFamily="'IBM Plex Mono', monospace"
        >
          SERIES PLATE — {disc}
        </text>
      </svg>
    </div>
  )
}

const PLATES: Record<Discipline, { title: string; art: ReactNode }> = {
  MATHEMATICS: {
    title: 'the shape of chance',
    art: (
      <>
        {/* axes */}
        <line x1="56" y1="230" x2="352" y2="230" stroke={INK} strokeWidth="1.2" />
        <line x1="64" y1="66" x2="64" y2="230" stroke={INK} strokeWidth="1.2" />
        {/* sigma ticks */}
        {[100, 150, 200, 250, 300].map((x) => (
          <line key={x} x1={x} y1="227" x2={x} y2="233" stroke={INK} strokeWidth="0.9" />
        ))}
        {/* the bell */}
        <path
          d="M 72 228 C 140 226 152 96 200 96 C 248 96 260 226 328 228"
          fill="none"
          stroke={INK}
          strokeWidth="1.4"
        />
        {/* mean */}
        <line
          x1="200"
          y1="96"
          x2="200"
          y2="230"
          stroke={PRUSSIAN}
          strokeWidth="1.1"
          strokeDasharray="4 4"
        />
        {/* the tail that ruins you, hatched ember */}
        {[288, 296, 304, 312, 320].map((x, i) => (
          <line
            key={x}
            x1={x}
            y1={214 - i * -2}
            x2={x}
            y2="228"
            stroke={EMBER}
            strokeWidth="1.1"
            opacity="0.8"
          />
        ))}
        <circle cx="200" cy="96" r="3" fill={EMBER} />
        <Mark x={110} y={120} />
        <Mark x={310} y={80} o={0.3} />
      </>
    ),
  },

  THINKING: {
    title: 'structure under the lens',
    art: (
      <>
        {/* unexamined field */}
        {[
          [70, 70],
          [104, 52],
          [326, 62],
          [346, 118],
          [70, 210],
          [110, 236],
          [330, 214],
          [300, 52],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill={INK} opacity="0.4" />
        ))}
        {/* the lens */}
        <circle cx="192" cy="132" r="74" fill="none" stroke={INK} strokeWidth="1.4" />
        <circle cx="192" cy="132" r="67" fill="none" stroke={INK} strokeWidth="0.7" opacity="0.5" />
        <line x1="245" y1="185" x2="300" y2="240" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        {/* what the lens reveals: the lattice */}
        {(() => {
          const pts: [number, number][] = [
            [160, 100],
            [226, 108],
            [186, 146],
            [150, 160],
            [222, 168],
            [196, 88],
          ]
          const links = [
            [0, 2],
            [1, 2],
            [2, 3],
            [2, 4],
            [0, 5],
            [1, 5],
            [3, 4],
          ]
          return (
            <>
              {links.map(([a, b]) => (
                <line
                  key={`${a}-${b}`}
                  x1={pts[a][0]}
                  y1={pts[a][1]}
                  x2={pts[b][0]}
                  y2={pts[b][1]}
                  stroke={PRUSSIAN}
                  strokeWidth="1"
                />
              ))}
              {pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={i === 2 ? EMBER : '#fbf8f0'}
                  stroke={i === 2 ? EMBER : INK}
                  strokeWidth="1.1"
                />
              ))}
            </>
          )
        })()}
        <Mark x={330} y={170} o={0.35} />
        <Mark x={64} y={140} o={0.35} />
      </>
    ),
  },

  PSYCHOLOGY: {
    title: 'the fast and the slow',
    art: (
      <>
        {/* head and shoulders, bust-fashion */}
        <circle cx="196" cy="122" r="72" fill="none" stroke={INK} strokeWidth="1.4" />
        <path d="M 184 192 L 182 212 M 208 192 L 210 212" stroke={INK} strokeWidth="1.2" />
        <path d="M 132 240 Q 196 204 260 240" fill="none" stroke={INK} strokeWidth="1.4" />
        {/* system one: the bolt */}
        <path
          d="M 150 168 L 186 130 L 168 122 L 232 78"
          fill="none"
          stroke={EMBER}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M 232 78 L 220 82 M 232 78 L 228 90" stroke={EMBER} strokeWidth="1.6" />
        {/* system two: the long way round */}
        <path
          d="M 150 100 Q 130 128 158 146 Q 196 168 226 150 Q 252 132 236 108"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <path d="M 236 108 L 234 118 M 236 108 L 228 112" stroke={PRUSSIAN} strokeWidth="1.2" />
        <Mark x={80} y={70} />
        <Mark x={318} y={196} o={0.35} />
        <circle cx="312" cy="70" r="2.2" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.5" />
      </>
    ),
  },

  ECONOMICS: {
    title: 'where the curves cross',
    art: (
      <>
        <line x1="56" y1="232" x2="352" y2="232" stroke={INK} strokeWidth="1.2" />
        <line x1="64" y1="60" x2="64" y2="232" stroke={INK} strokeWidth="1.2" />
        {/* supply rises, demand falls */}
        <path d="M 84 208 Q 200 176 322 76" fill="none" stroke={INK} strokeWidth="1.4" />
        <path d="M 84 76 Q 200 120 322 208" fill="none" stroke={INK} strokeWidth="1.4" />
        <text x="330" y="74" fill={STONE} fontSize="9" fontFamily="'IBM Plex Mono', monospace">
          S
        </text>
        <text x="330" y="214" fill={STONE} fontSize="9" fontFamily="'IBM Plex Mono', monospace">
          D
        </text>
        {/* the clearing price */}
        <circle cx="203" cy="144" r="5" fill={EMBER} stroke={INK} strokeWidth="1" />
        <line
          x1="203"
          y1="144"
          x2="203"
          y2="232"
          stroke={PRUSSIAN}
          strokeWidth="1.1"
          strokeDasharray="4 4"
        />
        <line
          x1="64"
          y1="144"
          x2="203"
          y2="144"
          stroke={PRUSSIAN}
          strokeWidth="1.1"
          strokeDasharray="4 4"
        />
        <Mark x={300} y={130} o={0.35} />
        <Mark x={110} y={100} o={0.35} />
      </>
    ),
  },

  BUSINESS: {
    title: 'the moat holds',
    art: (
      <>
        {/* the moat */}
        <ellipse cx="200" cy="196" rx="130" ry="34" fill="none" stroke={PRUSSIAN} strokeWidth="1.3" />
        <ellipse cx="200" cy="196" rx="96" ry="23" fill="none" stroke={PRUSSIAN} strokeWidth="1" />
        {[
          [110, 196],
          [140, 210],
          [258, 212],
          [292, 198],
          [200, 224],
        ].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M ${x - 7} ${y} Q ${x} ${y - 4} ${x + 7} ${y}`}
            fill="none"
            stroke={PRUSSIAN}
            strokeWidth="0.9"
            opacity="0.7"
          />
        ))}
        {/* the keep */}
        <rect x="168" y="112" width="64" height="76" fill="#fbf8f0" stroke={INK} strokeWidth="1.4" />
        <path
          d="M 168 112 L 168 100 L 180 100 L 180 112 M 194 112 L 194 100 L 206 100 L 206 112 M 220 112 L 220 100 L 232 100 L 232 112"
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
        />
        <path d="M 192 188 L 192 164 Q 200 156 208 164 L 208 188" fill="none" stroke={INK} strokeWidth="1.1" />
        <line x1="172" y1="184" x2="188" y2="168" stroke={INK} strokeWidth="0.7" opacity="0.45" />
        <line x1="212" y1="184" x2="228" y2="168" stroke={INK} strokeWidth="0.7" opacity="0.45" />
        {/* the pennant */}
        <line x1="200" y1="100" x2="200" y2="72" stroke={INK} strokeWidth="1.1" />
        <path d="M 200 72 L 224 79 L 200 86 Z" fill={EMBER} />
        {/* the bridge, drawn up */}
        <line x1="200" y1="230" x2="200" y2="219" stroke={INK} strokeWidth="1.1" />
        <line x1="196" y1="230" x2="196" y2="221" stroke={INK} strokeWidth="0.8" opacity="0.6" />
        <line x1="204" y1="230" x2="204" y2="221" stroke={INK} strokeWidth="0.8" opacity="0.6" />
        <Mark x={80} y={90} />
        <Mark x={320} y={110} o={0.35} />
      </>
    ),
  },

  INVESTING: {
    title: 'the eighth wonder',
    art: (
      <>
        <Ground />
        {/* seven periods, compounding */}
        {[8, 12, 18, 27, 40, 60, 90].map((h, i) => {
          const x = 66 + i * 38
          return (
            <rect
              key={i}
              x={x}
              y={240 - h}
              width="22"
              height={h}
              fill={i === 6 ? EMBER : 'none'}
              fillOpacity={i === 6 ? 0.18 : undefined}
              stroke={i === 6 ? EMBER : INK}
              strokeWidth="1.2"
            />
          )
        })}
        {/* the curve through their shoulders */}
        <path
          d="M 77 232 C 160 228 240 210 305 150"
          fill="none"
          stroke={INK}
          strokeWidth="1.3"
        />
        {/* where it goes if you leave it alone */}
        <path
          d="M 305 150 Q 340 116 352 78"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <path d="M 352 78 L 344 84 M 352 78 L 352 89" stroke={PRUSSIAN} strokeWidth="1.2" />
        <Mark x={100} y={120} />
        <Mark x={230} y={80} o={0.35} />
      </>
    ),
  },

  ACCOUNTING: {
    title: 'the double entry',
    art: (
      <>
        {/* the T */}
        <line x1="88" y1="76" x2="312" y2="76" stroke={INK} strokeWidth="1.6" />
        <line x1="200" y1="76" x2="200" y2="222" stroke={INK} strokeWidth="1.3" />
        {/* entries */}
        {[100, 122, 144, 166].map((y) => (
          <line key={y} x1="104" y1={y} x2="186" y2={y} stroke={INK} strokeWidth="0.8" opacity="0.55" />
        ))}
        {[100, 122, 144].map((y) => (
          <line key={y} x1="214" y1={y} x2="296" y2={y} stroke={INK} strokeWidth="0.8" opacity="0.55" />
        ))}
        {/* the entry and its mirror */}
        <line x1="104" y1="188" x2="186" y2="188" stroke={EMBER} strokeWidth="1.4" />
        <line x1="214" y1="166" x2="296" y2="166" stroke={EMBER} strokeWidth="1.4" />
        <path
          d="M 186 188 Q 200 178 214 168"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.1"
          strokeDasharray="3 3"
        />
        {/* ruled off, in balance */}
        <line x1="104" y1="206" x2="186" y2="206" stroke={INK} strokeWidth="1" />
        <line x1="104" y1="210" x2="186" y2="210" stroke={INK} strokeWidth="1" />
        <line x1="214" y1="206" x2="296" y2="206" stroke={INK} strokeWidth="1" />
        <line x1="214" y1="210" x2="296" y2="210" stroke={INK} strokeWidth="1" />
        <Mark x={70} y={130} o={0.35} />
        <Mark x={330} y={120} o={0.35} />
      </>
    ),
  },

  SOCIOLOGY: {
    title: 'the currents of the crowd',
    art: (
      <>
        {/* the currents */}
        <path d="M 48 190 Q 160 150 250 158 Q 320 164 356 140" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.4" />
        <path d="M 44 150 Q 150 116 244 122 Q 316 128 352 104" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.4" />
        <path d="M 56 226 Q 170 190 262 196 Q 326 200 360 178" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.4" />
        {/* the crowd, drifting along them */}
        {[
          [90, 178],
          [128, 164],
          [166, 155],
          [206, 153],
          [246, 157],
          [286, 158],
          [108, 136],
          [150, 122],
          [196, 118],
          [242, 121],
          [120, 210],
          [168, 196],
          [220, 194],
          [272, 197],
        ].map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="5"
            fill="#fbf8f0"
            stroke={INK}
            strokeWidth="1.1"
          />
        ))}
        {/* the one the current follows */}
        <circle cx="322" cy="150" r="6" fill={EMBER} stroke={INK} strokeWidth="1" />
        <path d="M 330 147 L 352 140 M 352 140 L 343 138 M 352 140 L 345 147" fill="none" stroke={EMBER} strokeWidth="1.3" />
        {/* the one who leaves it */}
        <path
          d="M 286 158 Q 310 186 342 196"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.1"
          strokeDasharray="4 4"
        />
        <path d="M 342 196 L 332 196 M 342 196 L 335 190" stroke={PRUSSIAN} strokeWidth="1.1" />
        <Mark x={64} y={80} />
        <Mark x={330} y={64} o={0.35} />
      </>
    ),
  },

  LAW: {
    title: 'the balance held',
    art: (
      <>
        <Ground />
        {/* column and finial */}
        <line x1="200" y1="92" x2="200" y2="240" stroke={INK} strokeWidth="2.4" />
        <circle cx="200" cy="84" r="5" fill="none" stroke={INK} strokeWidth="1.3" />
        <path d="M 178 240 L 222 240 L 214 226 L 186 226 Z" fill="none" stroke={INK} strokeWidth="1.2" />
        {/* beam */}
        <line x1="112" y1="100" x2="288" y2="100" stroke={INK} strokeWidth="1.6" />
        {/* plumb true */}
        <line
          x1="200"
          y1="100"
          x2="200"
          y2="130"
          stroke={PRUSSIAN}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* chains and pans */}
        {[112, 288].map((x) => (
          <g key={x}>
            <line x1={x} y1="100" x2={x - 16} y2="150" stroke={INK} strokeWidth="0.8" />
            <line x1={x} y1="100" x2={x + 16} y2="150" stroke={INK} strokeWidth="0.8" />
            <path
              d={`M ${x - 22} 150 Q ${x} 174 ${x + 22} 150`}
              fill="none"
              stroke={INK}
              strokeWidth="1.3"
            />
          </g>
        ))}
        {/* the weight of the case */}
        <circle cx="112" cy="153" r="7" fill={EMBER} stroke={INK} strokeWidth="1" />
        <Mark x={70} y={70} />
        <Mark x={326} y={190} o={0.35} />
      </>
    ),
  },

  HISTORY: {
    title: 'the sand keeps running',
    art: (
      <>
        {/* frame */}
        <line x1="148" y1="58" x2="252" y2="58" stroke={INK} strokeWidth="1.5" />
        <line x1="148" y1="234" x2="252" y2="234" stroke={INK} strokeWidth="1.5" />
        <line x1="154" y1="58" x2="154" y2="234" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        <line x1="246" y1="58" x2="246" y2="234" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        {/* glass */}
        <path d="M 160 64 L 240 64 L 204 143 L 196 143 Z" fill="none" stroke={INK} strokeWidth="1.2" />
        <path d="M 160 228 L 240 228 L 204 149 L 196 149 Z" fill="none" stroke={INK} strokeWidth="1.2" />
        {/* sand above, sand below */}
        {[118, 124, 130].map((y, i) => (
          <line
            key={y}
            x1={178 + i * 6}
            y1={y}
            x2={222 - i * 6}
            y2={y}
            stroke={INK}
            strokeWidth="0.9"
            opacity="0.5"
          />
        ))}
        <path d="M 176 228 L 200 204 L 224 228 Z" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.7" />
        {/* the falling grain */}
        <line x1="200" y1="146" x2="200" y2="200" stroke={EMBER} strokeWidth="1.3" strokeDasharray="2 4" />
        <circle cx="200" cy="204" r="2" fill={EMBER} />
        {/* it turns over, and repeats */}
        <path
          d="M 292 110 A 42 42 0 1 1 278 176"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <path d="M 278 176 L 288 172 M 278 176 L 282 166" stroke={PRUSSIAN} strokeWidth="1.2" />
        <Mark x={92} y={90} />
        <Mark x={100} y={190} o={0.35} />
      </>
    ),
  },

  PHILOSOPHY: {
    title: 'the lamp in the dark',
    art: (
      <>
        <Ground />
        {/* plinth */}
        <rect x="158" y="222" width="84" height="18" fill="none" stroke={INK} strokeWidth="1.3" />
        <rect x="170" y="208" width="60" height="14" fill="none" stroke={INK} strokeWidth="1.1" />
        {/* the vessel */}
        <ellipse cx="196" cy="192" rx="38" ry="16" fill="none" stroke={INK} strokeWidth="1.4" />
        <path d="M 232 186 Q 252 182 258 174" fill="none" stroke={INK} strokeWidth="1.3" />
        <circle cx="152" cy="188" r="9" fill="none" stroke={INK} strokeWidth="1.1" />
        {/* the flame */}
        <path d="M 258 174 Q 252 156 262 146 Q 268 158 264 168 Z" fill={EMBER} fillOpacity="0.2" stroke={EMBER} strokeWidth="1.3" />
        {/* what it lets you see */}
        {[
          [261, 136, 261, 110],
          [276, 142, 295, 124],
          [284, 158, 312, 152],
          [246, 140, 230, 122],
        ].map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={PRUSSIAN}
            strokeWidth="1.1"
            strokeDasharray="3 3"
          />
        ))}
        <Mark x={82} y={100} />
        <Mark x={120} y={150} o={0.35} />
        <circle cx="330" cy="80" r="2.2" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.5" />
      </>
    ),
  },

  ART: {
    title: 'the golden section',
    art: (
      <>
        {/* the divided rectangle */}
        <rect x="86" y="62" width="228" height="141" fill="none" stroke={INK} strokeWidth="1.4" />
        <line x1="227" y1="62" x2="227" y2="203" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        <line x1="227" y1="149" x2="314" y2="149" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        <line x1="260" y1="149" x2="260" y2="203" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        <line x1="227" y1="170" x2="260" y2="170" stroke={INK} strokeWidth="0.9" opacity="0.6" />
        {/* the spiral through it */}
        <path d="M 86 203 A 141 141 0 0 1 227 62" fill="none" stroke={INK} strokeWidth="1.3" />
        <path d="M 227 62 A 87 87 0 0 1 314 149" fill="none" stroke={INK} strokeWidth="1.3" />
        <path d="M 314 149 A 54 54 0 0 1 260 203" fill="none" stroke={INK} strokeWidth="1.3" />
        <path d="M 260 203 A 33 33 0 0 1 227 170" fill="none" stroke={EMBER} strokeWidth="1.6" />
        {/* the diagonal check */}
        <line
          x1="86"
          y1="203"
          x2="314"
          y2="62"
          stroke={PRUSSIAN}
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.8"
        />
        <Mark x={60} y={230} o={0.35} />
        <Mark x={344} y={226} o={0.35} />
      </>
    ),
  },

  MILITARY: {
    title: 'the indirect approach',
    art: (
      <>
        {/* the hill they hold */}
        <path d="M 120 120 Q 170 86 224 108 Q 258 124 240 148 Q 200 170 152 156 Q 112 142 120 120 Z" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.5" />
        <path d="M 140 122 Q 176 100 216 116 Q 238 128 226 142 Q 196 156 160 146 Q 134 136 140 122 Z" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.4" />
        <path d="M 160 126 Q 184 114 206 122 Q 218 130 210 138 Q 190 146 170 140 Q 156 134 160 126 Z" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.3" />
        {/* the line that waits for a frontal attack */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={126 + i * 34}
            y={186}
            width="22"
            height="10"
            fill="none"
            stroke={PRUSSIAN}
            strokeWidth="1.2"
          />
        ))}
        {/* the attack that never gives it one */}
        <path
          d="M 96 236 Q 300 244 330 170 Q 344 128 300 92 Q 280 78 252 74"
          fill="none"
          stroke={EMBER}
          strokeWidth="2"
        />
        <path d="M 252 74 L 264 70 M 252 74 L 262 82" fill="none" stroke={EMBER} strokeWidth="1.6" />
        <Mark x={70} y={80} />
        <Mark x={92} y={160} o={0.35} />
      </>
    ),
  },

  BIOLOGY: {
    title: 'the branching descent',
    art: (
      <>
        <Ground />
        {/* strata of time */}
        {[190, 140, 90].map((y) => (
          <line
            key={y}
            x1="40"
            y1={y}
            x2="360"
            y2={y}
            stroke={PRUSSIAN}
            strokeWidth="0.8"
            strokeDasharray="3 5"
            opacity="0.5"
          />
        ))}
        {/* the tree */}
        <path d="M 200 240 L 200 196 M 200 196 Q 160 176 148 142 M 200 196 Q 240 176 254 144" fill="none" stroke={INK} strokeWidth="1.4" />
        <path d="M 148 142 Q 128 118 122 88 M 148 142 Q 158 116 172 92" fill="none" stroke={INK} strokeWidth="1.2" />
        <path d="M 254 144 Q 244 116 244 90 M 254 144 Q 282 122 296 94" fill="none" stroke={INK} strokeWidth="1.2" />
        <path d="M 296 94 Q 308 80 324 70" fill="none" stroke={INK} strokeWidth="1.1" />
        {/* the lines that ended */}
        <path d="M 116 84 L 128 78 M 118 76 L 126 86" stroke={INK} strokeWidth="1.1" opacity="0.6" />
        <path d="M 238 84 L 250 78 M 240 76 L 248 86" stroke={INK} strokeWidth="1.1" opacity="0.6" />
        {/* the ones still running */}
        {[
          [172, 88],
          [324, 66],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="#fbf8f0" stroke={INK} strokeWidth="1.1" />
        ))}
        <circle cx="296" cy="90" r="5" fill={EMBER} stroke={INK} strokeWidth="1" />
        <Mark x={72} y={120} o={0.35} />
        <Mark x={340} y={180} o={0.35} />
      </>
    ),
  },

  PHYSICS: {
    title: 'the pendulum knows',
    art: (
      <>
        {/* ceiling */}
        <line x1="130" y1="52" x2="270" y2="52" stroke={INK} strokeWidth="1.4" />
        {[138, 156, 174, 192, 210, 228, 246, 264].map((x) => (
          <line key={x} x1={x} y1="52" x2={x - 9} y2="42" stroke={INK} strokeWidth="0.8" opacity="0.5" />
        ))}
        <circle cx="200" cy="58" r="3" fill="none" stroke={INK} strokeWidth="1.1" />
        {/* rest line and swing */}
        <line
          x1="200"
          y1="58"
          x2="200"
          y2="216"
          stroke={PRUSSIAN}
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <path
          d="M 118 178 Q 200 236 282 178"
          fill="none"
          stroke={INK}
          strokeWidth="0.9"
          strokeDasharray="3 4"
          opacity="0.7"
        />
        <path d="M 118 178 L 124 168 M 282 178 L 276 168" stroke={INK} strokeWidth="0.9" opacity="0.7" />
        {/* rod, bob, and the angle it must obey */}
        <line x1="200" y1="58" x2="276" y2="172" stroke={INK} strokeWidth="1.4" />
        <circle cx="281" cy="180" r="12" fill={EMBER} fillOpacity="0.16" stroke={EMBER} strokeWidth="1.4" />
        <path d="M 200 96 A 38 38 0 0 1 221 90" fill="none" stroke={PRUSSIAN} strokeWidth="1.1" />
        <Mark x={90} y={90} />
        <Mark x={322} y={110} o={0.35} />
      </>
    ),
  },

  ENGINEERING: {
    title: 'the load finds the member',
    art: (
      <>
        <Ground />
        {/* chords */}
        <line x1="72" y1="196" x2="328" y2="196" stroke={INK} strokeWidth="1.5" />
        <line x1="110" y1="140" x2="290" y2="140" stroke={INK} strokeWidth="1.5" />
        {/* web */}
        <path
          d="M 72 196 L 110 140 L 148 196 L 186 140 L 224 196 L 262 140 L 300 196 M 290 140 L 328 196"
          fill="none"
          stroke={INK}
          strokeWidth="1.1"
        />
        {[148, 186, 224, 262].map((x) => (
          <line key={x} x1={x} y1="140" x2={x} y2="196" stroke={INK} strokeWidth="0.8" opacity="0.5" />
        ))}
        {/* supports */}
        <path d="M 72 196 L 62 216 L 82 216 Z" fill="none" stroke={INK} strokeWidth="1.1" />
        <circle cx="322" cy="206" r="6" fill="none" stroke={INK} strokeWidth="1.1" />
        <circle cx="336" cy="206" r="6" fill="none" stroke={INK} strokeWidth="1.1" />
        {/* the load */}
        <line x1="200" y1="86" x2="200" y2="132" stroke={EMBER} strokeWidth="2" />
        <path d="M 200 136 L 193 122 M 200 136 L 207 122" fill="none" stroke={EMBER} strokeWidth="1.6" />
        {/* the reactions */}
        {[72, 328].map((x) => (
          <g key={x}>
            <line x1={x} y1="232" x2={x} y2="210" stroke={PRUSSIAN} strokeWidth="1.2" strokeDasharray="3 3" />
            <path d={`M ${x} 208 L ${x - 5} 218 M ${x} 208 L ${x + 5} 218`} fill="none" stroke={PRUSSIAN} strokeWidth="1.1" />
          </g>
        ))}
        <Mark x={90} y={90} />
        <Mark x={310} y={76} o={0.35} />
      </>
    ),
  },

  SYSTEMS: {
    title: 'the loop that governs',
    art: (
      <>
        {/* the two states */}
        <rect x="76" y="112" width="92" height="52" fill="none" stroke={INK} strokeWidth="1.4" />
        <rect x="232" y="112" width="92" height="52" fill="none" stroke={INK} strokeWidth="1.4" />
        <line x1="84" y1="132" x2="160" y2="132" stroke={INK} strokeWidth="0.7" opacity="0.4" />
        <line x1="84" y1="144" x2="148" y2="144" stroke={INK} strokeWidth="0.7" opacity="0.4" />
        <line x1="240" y1="132" x2="316" y2="132" stroke={INK} strokeWidth="0.7" opacity="0.4" />
        <line x1="240" y1="144" x2="304" y2="144" stroke={INK} strokeWidth="0.7" opacity="0.4" />
        {/* the reinforcing run */}
        <path d="M 168 104 Q 200 66 232 104" fill="none" stroke={EMBER} strokeWidth="1.8" />
        <path d="M 232 104 L 222 100 M 232 104 L 228 94" fill="none" stroke={EMBER} strokeWidth="1.4" />
        {/* the valve on the flow */}
        <path d="M 194 84 L 206 92 M 194 92 L 206 84" stroke={EMBER} strokeWidth="1.2" />
        {/* the balancing return */}
        <path
          d="M 232 172 Q 200 210 168 172"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.3"
          strokeDasharray="4 4"
        />
        <path d="M 168 172 L 178 176 M 168 172 L 172 182" fill="none" stroke={PRUSSIAN} strokeWidth="1.2" />
        <circle cx="200" cy="196" r="7" fill="none" stroke={PRUSSIAN} strokeWidth="1.1" />
        <line x1="196" y1="196" x2="204" y2="196" stroke={PRUSSIAN} strokeWidth="1.1" />
        <Mark x={62} y={70} />
        <Mark x={338} y={216} o={0.35} />
      </>
    ),
  },

  COMPUTING: {
    title: 'the tape and the gate',
    art: (
      <>
        {/* the tape */}
        <path d="M 40 96 C 110 78 160 132 236 112" fill="none" stroke={INK} strokeWidth="1.3" />
        <path d="M 40 122 C 110 104 160 158 236 138" fill="none" stroke={INK} strokeWidth="1.3" />
        {[
          [64, 100],
          [92, 96],
          [120, 100],
          [148, 110],
          [176, 118],
          [204, 120],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={INK} opacity="0.75" />
        ))}
        {[
          [64, 112],
          [92, 108],
          [120, 112],
          [148, 122],
          [176, 130],
          [204, 132],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill={INK} opacity="0.45" />
        ))}
        {/* the gate */}
        <path d="M 252 98 L 280 98 A 27 27 0 0 1 280 152 L 252 152 Z" fill="none" stroke={INK} strokeWidth="1.4" />
        <line x1="236" y1="112" x2="252" y2="112" stroke={INK} strokeWidth="1.1" />
        <line x1="236" y1="138" x2="252" y2="138" stroke={INK} strokeWidth="1.1" />
        <line x1="307" y1="125" x2="332" y2="125" stroke={INK} strokeWidth="1.1" />
        {/* the lamp it lights */}
        <circle cx="344" cy="125" r="9" fill={EMBER} fillOpacity="0.16" stroke={EMBER} strokeWidth="1.4" />
        <path d="M 344 108 L 344 100 M 358 118 L 365 114 M 358 132 L 365 136" stroke={EMBER} strokeWidth="1.2" />
        {/* the clock beneath it all */}
        <path
          d="M 60 208 L 92 208 L 92 190 L 124 190 L 124 208 L 156 208 L 156 190 L 188 190 L 188 208 L 220 208"
          fill="none"
          stroke={PRUSSIAN}
          strokeWidth="1.1"
        />
        <Mark x={310} y={70} />
        <Mark x={64} y={160} o={0.35} />
      </>
    ),
  },
}

/** Raw series art + title, for server-side OG image rendering. */
export function disciplineArt(disc: Discipline): ReactNode {
  return PLATES[disc].art
}
export function disciplineTitle(disc: Discipline): string {
  return PLATES[disc].title
}

/** Bare miniature of the series art for tile strips — captions would be illegible this small. */
export function DisciplineThumb({ disc }: { disc: Discipline }) {
  return (
    <svg viewBox="0 0 400 280" className="block h-auto w-full bg-card">
      {PLATES[disc].art}
    </svg>
  )
}

/** The discipline's series engraving — the default plate for models without their own. */
export function DisciplinePlate({ disc, inset = 8 }: { disc: Discipline; inset?: number }) {
  const p = PLATES[disc]
  return (
    <Frame inset={inset} title={p.title} disc={disc}>
      {p.art}
    </Frame>
  )
}

/** A model's plate: its own engraving when one exists, its discipline's series plate otherwise. */
export function ModelPlate({ model, inset = 8 }: { model: Model; inset?: number }) {
  // model-specific engravings register here as they're drawn
  if (model.id === ART_READY_ID) {
    return <PlateArt inset={inset} />
  }
  return <DisciplinePlate disc={model.disc} inset={inset} />
}
