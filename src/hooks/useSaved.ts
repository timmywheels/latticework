import { useCallback, useState } from 'react'
import { MODELS_BY_ID } from '../data/models'

// Saved is deliberately separate from studied: studied is "I have learned this",
// saved is "I want to come back to this". A reader needs both.
const STORAGE_KEY = 'latticework-saved-v2'

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // drop ids that no longer exist so a regenerated catalog can't leave ghosts
    return parsed.filter((id) => typeof id === 'string' && MODELS_BY_ID[id])
  } catch {
    return []
  }
}

export function useSaved() {
  const [saved, setSaved] = useState<string[]>(load)

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage unavailable — state still updates for the session
      }
      return next
    })
  }, [])

  return { saved, toggleSaved }
}
