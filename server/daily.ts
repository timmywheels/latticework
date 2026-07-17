import { PLATE_ORDER, modelPath, type Model } from '../src/data/models'
import { siteUrl, type AppEnv } from './env'
import { createMailer } from './mailer'

/** Everyone gets the same model on the same day — deterministic, no cursor to store. */
const LAUNCH_UTC_DAY = Math.floor(Date.UTC(2026, 6, 17) / 86_400_000)

export function modelOfTheDay(now = new Date()): Model {
  const day = Math.floor(now.getTime() / 86_400_000)
  const n = PLATE_ORDER.length
  const idx = (((day - LAUNCH_UTC_DAY) % n) + n) % n
  return PLATE_ORDER[idx]
}

const PAPER = '#f3efe4'
const CARD = '#fbf8f0'
const INK = '#211d14'
const EMBER = '#c65a2e'
const UMBER = '#4a443a'
const STONE = '#8a8272'
const SERIF = "Georgia, 'Times New Roman', serif"
const MONO = "'Courier New', Courier, monospace"

export function renderDailyEmail(m: Model, site: string): { subject: string; html: string } {
  const link = `${site}${modelPath(m)}`
  const subject = `${m.name} — today's mental model`
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:28px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="font-family:${MONO};font-size:11px;letter-spacing:2px;color:${STONE};padding-bottom:14px;">
          LATTICEWORK — ONE MODEL A DAY
        </td></tr>
        <tr><td style="background:${CARD};border:1px solid ${INK};padding:28px 30px;">
          <div style="font-family:${MONO};font-size:10px;letter-spacing:2px;color:${STONE};">
            MODEL NO. ${m.id} — ${m.disc}
          </div>
          <div style="font-family:${SERIF};font-size:30px;font-weight:600;color:${INK};line-height:1.15;padding-top:8px;">
            ${escapeHtml(m.name)}
          </div>
          <div style="font-family:${SERIF};font-style:italic;font-size:15px;color:${EMBER};padding-top:6px;">
            ${escapeHtml(m.blurb)}
          </div>
          <div style="font-family:${SERIF};font-size:15px;line-height:1.65;color:${UMBER};padding-top:16px;">
            ${escapeHtml(m.long)}
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;">
            <tr><td style="background:${INK};">
              <a href="${link}" style="display:inline-block;padding:10px 22px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;color:${CARD};text-decoration:none;">
                READ THE FULL ENTRY &#9656;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="font-family:${MONO};font-size:10px;line-height:1.8;color:${STONE};padding-top:14px;">
          You asked for one mental model a day. Tomorrow brings the next.<br/>
          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${STONE};">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  return { subject, html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendDaily(env: AppEnv, now = new Date()): Promise<Model> {
  const m = modelOfTheDay(now)
  const { subject, html } = renderDailyEmail(m, siteUrl(env))
  await createMailer(env).sendBroadcast(subject, html)
  console.log(`[daily] sent ${m.id} — ${m.name}`)
  return m
}
