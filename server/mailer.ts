import { Resend } from 'resend'
import type { AppEnv } from './env'

/**
 * Thin seam over Resend, constructed per-event from Worker env. Without
 * RESEND_API_KEY (local dev) every call logs what it would have done instead —
 * the whole flow stays exercisable offline.
 */
export interface Mailer {
  sendEmail(to: string, subject: string, html: string): Promise<void>
  addContact(email: string): Promise<void>
  sendBroadcast(subject: string, html: string): Promise<void>
}

export function createMailer(env: AppEnv): Mailer {
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
  const from = env.LIST_FROM ?? 'Latticework <models@localhost>'
  const audience = env.RESEND_AUDIENCE_ID

  return {
    async sendEmail(to, subject, html) {
      if (!resend) {
        console.log(`[mailer:stub] email to=${to} subject=${JSON.stringify(subject)}`)
        console.log(html)
        return
      }
      const { error } = await resend.emails.send({ from, to, subject, html })
      if (error) {
        throw new Error(`resend emails.send failed: ${error.message}`)
      }
    },

    async addContact(email) {
      if (!resend || !audience) {
        console.log(`[mailer:stub] contact added: ${email}`)
        return
      }
      const { error } = await resend.contacts.create({ email, audienceId: audience, unsubscribed: false })
      // an already-subscribed contact re-confirming is fine, not an error worth surfacing
      if (error && !/already exists/i.test(error.message)) {
        throw new Error(`resend contacts.create failed: ${error.message}`)
      }
    },

    async sendBroadcast(subject, html) {
      if (!resend || !audience) {
        console.log(`[mailer:stub] broadcast subject=${JSON.stringify(subject)}`)
        return
      }
      const created = await resend.broadcasts.create({ audienceId: audience, from, subject, html })
      if (created.error || !created.data) {
        throw new Error(`resend broadcasts.create failed: ${created.error?.message}`)
      }
      const sent = await resend.broadcasts.send(created.data.id)
      if (sent.error) {
        throw new Error(`resend broadcasts.send failed: ${sent.error.message}`)
      }
    },
  }
}
