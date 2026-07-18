import { useCallback, useState } from 'react'

import { MODELS_BY_ID } from '../data/models'

// bumped when the id scheme changed (legacy '012' → catalog 'M647'), so old
// localStorage payloads are discarded rather than silently marking nothing
const STORAGE_KEY = 'latticework-studied-v3'
// compound interest · inversion · incentives · loss aversion
const DEFAULT_STUDIED = ['M005', 'M098', 'M236', 'M206']

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STUDIED
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_STUDIED
    const live = parsed.filter((id) => typeof id === 'string' && MODELS_BY_ID[id])
    return live.length ? live : DEFAULT_STUDIED
  } catch {
    return DEFAULT_STUDIED
  }
}

export function useStudied() {
  const [studied, setStudied] = useState<string[]>(load)

  const toggleStudied = useCallback((id: string) => {
    setStudied((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage unavailable — state still updates for the session
      }
      return next
    })
  }, [])

  return { studied, toggleStudied }
}
