/** Stateless double opt-in: the confirm link carries the email, HMAC-signed.
 *  WebCrypto only, so it runs identically in Workers and Node. */

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function b64url(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): string | null {
  try {
    return atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return null
  }
}

export async function signEmailToken(
  secret: string,
  email: string,
  ttlMs = 7 * 24 * 3_600_000,
): Promise<string> {
  const exp = Date.now() + ttlMs
  const payload = `${email}|${exp}`
  const mac = await hmacHex(secret, payload)
  return b64url(`${payload}|${mac}`)
}

export async function verifyEmailToken(secret: string, token: string): Promise<string | null> {
  const decoded = fromB64url(token)
  if (!decoded) {
    return null
  }
  const parts = decoded.split('|')
  if (parts.length !== 3) {
    return null
  }
  const [email, expStr, mac] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now()) {
    return null
  }
  const expected = await hmacHex(secret, `${email}|${expStr}`)
  if (mac.length !== expected.length) {
    return null
  }
  // constant-time-ish compare; the mac is a hex digest of fixed length
  let diff = 0
  for (let i = 0; i < mac.length; i++) {
    diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (diff !== 0) {
    return null
  }
  return email
}
