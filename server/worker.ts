import { Hono } from 'hono'
import { MODELS, MODELS_BY_SLUG, modelPath } from '../src/data/models'
import { modelOfTheDay, renderDailyEmail, sendDaily } from './daily'
import { siteUrl, tokenSecret, type AppEnv } from './env'
import { createMailer } from './mailer'
import { signEmailToken, verifyEmailToken } from './tokens'

const app = new Hono<{ Bindings: AppEnv }>()

// ------------------------------------------------------- shell meta injection
// index.html carries the default meta between markers; model pages swap it out.
let shellCache: string | null = null

async function shell(env: AppEnv, reqUrl: string): Promise<string> {
  if (shellCache === null) {
    const res = await env.ASSETS.fetch(new URL('/index.html', reqUrl))
    shellCache = await res.text()
  }
  return shellCache
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function metaBlock(title: string, description: string, url: string, image: string): string {
  return `<title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Latticework" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />`
}

app.get('/models/:slug', async (c) => {
  const html = await shell(c.env, c.req.url)
  const m = MODELS_BY_SLUG[c.req.param('slug')]
  if (!m) {
    return c.html(html)
  }
  const site = siteUrl(c.env)
  const url = `${site}${modelPath(m)}`
  const block = metaBlock(`${m.name} — Latticework`, m.blurb, url, `${site}/og/${c.req.param('slug')}.png`)
  return c.html(html.replace(/<!-- meta -->[\s\S]*?<!-- \/meta -->/, `<!-- meta -->\n    ${block}\n    <!-- /meta -->`))
})

// ------------------------------------------------------------------------ seo
app.get('/sitemap.xml', (c) => {
  const site = siteUrl(c.env)
  const urls = [site, `${site}/lattice`, ...MODELS.map((m) => `${site}${modelPath(m)}`)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>`
  return c.body(xml, 200, { 'content-type': 'application/xml' })
})

app.get('/robots.txt', (c) => {
  return c.text(`User-agent: *\nAllow: /\nSitemap: ${siteUrl(c.env)}/sitemap.xml\n`)
})

// ---------------------------------------------------------------- mailing list
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

app.post('/api/subscribe', async (c) => {
  const body = await c.req.json<{ email?: unknown }>().catch(() => null)
  const email = String(body?.email ?? '')
    .trim()
    .toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: 'invalid email' }, 400)
  }
  const token = await signEmailToken(tokenSecret(c.env), email)
  const confirmUrl = `${siteUrl(c.env)}/api/confirm?token=${token}`
  await createMailer(c.env).sendEmail(
    email,
    'Confirm your subscription — one mental model a day',
    `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#211d14;">
      <p>One mental model in your inbox, every morning. Tap to confirm it was you:</p>
      <p><a href="${confirmUrl}" style="color:#c65a2e;">Confirm subscription</a></p>
      <p style="color:#8a8272;font-size:13px;">If you didn't ask for this, ignore it and nothing happens.</p>
    </div>`,
  )
  return c.json({ ok: true })
})

app.get('/api/confirm', async (c) => {
  const email = await verifyEmailToken(tokenSecret(c.env), c.req.query('token') ?? '')
  if (!email) {
    return c.html(confirmPage(siteUrl(c.env), 'That link has expired.', 'Subscribe again from the site and use the fresh link.'), 400)
  }
  await createMailer(c.env).addContact(email)
  return c.html(confirmPage(siteUrl(c.env), "You're on the list.", 'One model arrives tomorrow morning. Until then, wander the lattice.'))
})

function confirmPage(site: string, heading: string, sub: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(heading)} — Latticework</title></head>
<body style="margin:0;background:#f3efe4;font-family:Georgia,serif;color:#211d14;">
  <div style="max-width:520px;margin:18vh auto 0;padding:36px;background:#fbf8f0;border:1px solid #211d14;">
    <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#8a8272;">LATTICEWORK</div>
    <div style="font-size:30px;font-weight:600;margin-top:10px;">${esc(heading)}</div>
    <div style="font-style:italic;color:#4a443a;margin-top:8px;">${esc(sub)}</div>
    <a href="${esc(site)}" style="display:inline-block;margin-top:22px;background:#211d14;color:#fbf8f0;padding:10px 22px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:1.5px;text-decoration:none;">TO THE LATTICE ▸</a>
  </div>
</body></html>`
}

// ----------------------------------------------------------------- daily send
app.get('/api/preview-daily', (c) => {
  return c.html(renderDailyEmail(modelOfTheDay(), siteUrl(c.env)).html)
})

app.post('/api/send-daily', async (c) => {
  const key = c.req.header('x-cron-key')
  if (!c.env.CRON_SECRET || key !== c.env.CRON_SECRET) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const m = await sendDaily(c.env)
  return c.json({ ok: true, sent: m.id })
})

app.get('/api/health', (c) => {
  const m = modelOfTheDay()
  return c.json({ ok: true, modelOfTheDay: m.id })
})

export default {
  fetch: app.fetch,
  // the daily broadcast rides a Cron Trigger (see wrangler.jsonc)
  scheduled(_event: ScheduledEvent, env: AppEnv, ctx: ExecutionContext) {
    ctx.waitUntil(sendDaily(env))
  },
}
