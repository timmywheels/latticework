import { useCallback, useState } from 'react'

import { MODELS_BY_ID } from '../data/models'

// bumped whenever the id scheme changes (here: ids reshuffled so model-number
// order mixes disciplines), so old localStorage payloads are discarded rather
// than silently marking the wrong models
const STORAGE_KEY = 'latticework-studied-v6'
// incentives · inversion · compound interest · loss aversion
const DEFAULT_STUDIED = ['M0001', 'M0002', 'M0003', 'M0639']

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
