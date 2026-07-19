import { useState, type FormEvent } from 'react'

const API = import.meta.env.VITE_API_URL ?? ''

/** One model a day. Posts to the server's double-opt-in endpoint.
 *  'hero' aligns right on desktop with its own label; 'band' is bare and left-aligned. */
export function SubscribeForm({ variant = 'hero' }: { variant?: 'hero' | 'band' }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (state === 'busy') {
      return
    }
    setState('busy')
    try {
      const res = await fetch(`${API}/api/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  const hero = variant === 'hero'
  if (state === 'sent') {
    return (
      <div className={`mt-4 font-mono text-[10px] tracking-[0.1em] text-ember ${hero ? 'md:text-right' : ''}`}>
        CHECK YOUR INBOX TO CONFIRM ✓
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={hero ? 'mt-4' : 'mt-3 w-full md:mt-0 md:w-auto'}>
      {hero && (
        <div className="font-mono text-[9px] tracking-[0.15em] text-faded md:text-right">
          ONE MODEL IN YOUR INBOX, DAILY
        </div>
      )}
      <div className={`flex gap-1.5 ${hero ? 'md:justify-end' : ''}`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`border border-ink/30 bg-card px-2.5 py-[7px] font-mono text-[11px] text-ink outline-none placeholder:text-faded focus:border-ink ${
            hero ? 'w-full max-w-[240px] md:w-[190px]' : 'w-full min-w-0 flex-1 md:w-[190px] md:flex-none'
          }`}
        />
        <button
          type="submit"
          disabled={state === 'busy'}
          className={`flex-none cursor-pointer whitespace-nowrap rounded-[2px] px-3 py-[7px] font-mono text-[10px] font-medium tracking-[0.1em] transition-colors duration-150 disabled:opacity-60 ${
            hero
              ? 'bg-ink text-card hover:bg-ember'
              : 'bg-ember text-card hover:bg-card hover:text-ink'
          }`}
        >
          {state === 'busy' ? '…' : 'SUBSCRIBE ▸'}
        </button>
      </div>
      {state === 'error' && (
        <div className={`mt-1.5 font-mono text-[9.5px] text-ember ${hero ? 'md:text-right' : ''}`}>
          SOMETHING SLIPPED — TRY AGAIN
        </div>
      )}
    </form>
  )
}
