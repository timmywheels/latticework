import { renderToStaticMarkup } from 'react-dom/server'
import { MODELS_BY_SLUG, type Discipline, type Model } from '../src/data/models'
import { disciplineArt } from '../src/components/DisciplinePlates'

const INK = '#211d14'
const EMBER = '#c65a2e'
const STONE = '#8a8272'

/** The synthetic slug for the site-wide share card. */
export const SITE_SLUG = '_site'

function wrap(text: string, charsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (candidate.length <= charsPerLine || !line) {
      line = candidate
    } else {
      lines.push(line)
      line = w
    }
  }
  if (line) {
    lines.push(line)
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\W*$/, '') + '…'
    return kept
  }
  return lines
}

interface OgContent {
  kicker: string
  name: string
  blurb: string
  disc: Discipline
}

function contentFor(slug: string): OgContent | null {
  if (slug === SITE_SLUG) {
    return {
      kicker: '963 MODELS · 18 DISCIPLINES',
      name: 'The big ideas from the big disciplines.',
      blurb: 'Each model named, numbered, illustrated, and wired to its neighbors.',
      disc: 'THINKING',
    }
  }
  const m: Model | undefined = MODELS_BY_SLUG[slug]
  if (!m) {
    return null
  }
  return { kicker: `MODEL NO. ${m.id} — ${m.disc}`, name: m.name, blurb: m.blurb, disc: m.disc }
}

/** The 1200×630 share card as an SVG string; null for unknown slugs. */
export function ogSvg(slug: string): string | null {
  const c = contentFor(slug)
  if (!c) {
    return null
  }
  const nameSize = c.name.length <= 18 ? 64 : c.name.length <= 44 ? 50 : 40
  const nameLh = Math.round(nameSize * 1.14)
  const nameLines = wrap(c.name, Math.floor(620 / (nameSize * 0.47)), 3)
  const blurbLines = wrap(c.blurb, 44, 2)
  const nameTop = 252
  const nameBottom = nameTop + (nameLines.length - 1) * nameLh
  return renderToStaticMarkup(
    <svg width={1200} height={630} viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width={1200} height={630} fill="#f3efe4" />
      <rect x={28} y={28} width={1144} height={574} fill="none" stroke={INK} strokeWidth={2.5} />
      <rect
        x={42}
        y={42}
        width={1116}
        height={546}
        fill="none"
        stroke={INK}
        strokeOpacity={0.35}
        strokeWidth={1.2}
        strokeDasharray="2 4"
      />
      <text x={70} y={116} fontFamily="IBM Plex Mono" fontWeight={500} fontSize={20} letterSpacing="4" fill={STONE}>
        LATTICEWORK — A FIELD GUIDE TO MENTAL MODELS
      </text>
      <text x={70} y={172} fontFamily="IBM Plex Mono" fontWeight={500} fontSize={18} letterSpacing="3" fill={EMBER}>
        {c.kicker}
      </text>
      {nameLines.map((l, i) => (
        <text key={i} x={70} y={nameTop + i * nameLh} fontFamily="Newsreader" fontSize={nameSize} fill={INK}>
          {l}
        </text>
      ))}
      {blurbLines.map((l, i) => (
        <text
          key={i}
          x={70}
          y={nameBottom + 58 + i * 36}
          fontFamily="Newsreader"
          fontStyle="italic"
          fontSize={27}
          fill={EMBER}
        >
          {l}
        </text>
      ))}
      <text x={70} y={556} fontFamily="IBM Plex Mono" fontSize={16} letterSpacing="2" fill={STONE}>
        ONE MODEL A DAY · EVERY MODEL WIRED TO ITS NEIGHBORS
      </text>
      <rect x={716} y={158} width={412} height={288} fill="#fbf8f0" stroke={INK} strokeWidth={2} />
      <svg x={722} y={162} width={400} height={280} viewBox="0 0 400 280">
        {disciplineArt(c.disc)}
      </svg>
    </svg>,
  )
}
