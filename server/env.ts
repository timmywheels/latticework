/** Worker bindings + vars. Secrets go in via `wrangler secret put`, local dev via .dev.vars. */
export interface AppEnv {
  ASSETS: Fetcher
  SITE_URL?: string
  TOKEN_SECRET?: string
  CRON_SECRET?: string
  RESEND_API_KEY?: string
  RESEND_AUDIENCE_ID?: string
  LIST_FROM?: string
}

export function siteUrl(env: Pick<AppEnv, 'SITE_URL'>): string {
  return (env.SITE_URL ?? 'http://localhost:8787').replace(/\/$/, '')
}

export function tokenSecret(env: Pick<AppEnv, 'TOKEN_SECRET'>): string {
  return env.TOKEN_SECRET ?? 'dev-secret'
}
