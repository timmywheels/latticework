/**
 * Build step: pre-render every share card into dist/og/ as static assets, so
 * the Worker never rasterizes at request time (keeps it inside free-tier CPU).
 * Runs after `vite build`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { MODEL_SLUGS } from '../src/data/models'
import { SITE_SLUG, ogSvg } from '../server/og-svg'

const DIR = dirname(fileURLToPath(import.meta.url))
const OUT = join(DIR, '..', 'dist', 'og')
const FONT_FILES = [
  join(DIR, '..', 'server', 'fonts', 'Newsreader-var.ttf'),
  join(DIR, '..', 'server', 'fonts', 'IBMPlexMono-Regular.ttf'),
  join(DIR, '..', 'server', 'fonts', 'IBMPlexMono-Medium.ttf'),
]

mkdirSync(OUT, { recursive: true })
const slugs = [SITE_SLUG, ...Object.values(MODEL_SLUGS)]
const started = Date.now()
for (const slug of slugs) {
  const svg = ogSvg(slug)
  if (!svg) {
    throw new Error(`no og content for slug: ${slug}`)
  }
  const resvg = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Newsreader' },
  })
  writeFileSync(join(OUT, `${slug}.png`), resvg.render().asPng())
}
console.log(`og: rendered ${slugs.length} cards in ${((Date.now() - started) / 1000).toFixed(1)}s`)
