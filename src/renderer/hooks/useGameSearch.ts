import { useState, useEffect } from 'react'
import type { GameSearchResult } from '../../shared/types/game.js'
import type { GameFilterValues } from './useGameFilters.js'
import { buildOptionFilters } from './useGameFilters.js'

export interface UseGameSearchParams {
  /** Currently selected collection ID */
  collectionId: string | null
  /** Player search term */
  searchTerm: string
  /** Current filter values */
  filters: GameFilterValues
  /** Called when collectionId changes — use to reset filters */
  onCollectionChange?: () => void
}

export interface UseGameSearchReturn {
  /** Current search results */
  games: GameSearchResult[]
  /** Total number of games in the collection */
  totalGameCount: number
  /** Available dates in the collection (YYYYMMDD) */
  availableDates: number[]
  /** True if the current dateFrom selection is stale (no longer available) */
  staleDateFrom: boolean
  /** True if the current dateTo selection is stale (no longer available) */
  staleDateTo: boolean
}

/**
 * Fetches metadata (count, dates) when the collection changes,
 * and re-runs the search whenever collectionId, searchTerm, or filters change.
 */
export function useGameSearch({
  collectionId,
  searchTerm,
  filters,
  onCollectionChange,
}: UseGameSearchParams): UseGameSearchReturn {
  const [games, setGames] = useState<GameSearchResult[]>([])
  const [totalGameCount, setTotalGameCount] = useState(0)
  const [availableDates, setAvailableDates] = useState<number[]>([])
  const [staleDateFrom, setStaleDateFrom] = useState(false)
  const [staleDateTo, setStaleDateTo] = useState(false)

  // Fetch game count when collection changes
  useEffect(() => {
    if (!collectionId) {
      setTotalGameCount(0)
      setAvailableDates([])
      setStaleDateFrom(false)
      setStaleDateTo(false)
      onCollectionChange?.()
      return
    }

    window.electron.getGameCount(collectionId).then(setTotalGameCount)
    setStaleDateFrom(false)
    setStaleDateTo(false)
    onCollectionChange?.()
  }, [collectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch available dates when player/result filters change
  useEffect(() => {
    if (!collectionId) {
      setAvailableDates([])
      return
    }

    const optionFilters = buildOptionFilters({
      player: searchTerm,
      results: filters.results,
    })

    window.electron.getAvailableDates(collectionId, optionFilters).then((dates) => {
      setAvailableDates(dates)
      // Set stale flags if date selections are no longer available
      setStaleDateFrom(filters.dateFrom != null && !dates.includes(filters.dateFrom))
      setStaleDateTo(filters.dateTo != null && !dates.includes(filters.dateTo))
    })
  }, [collectionId, searchTerm, filters.results]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search games whenever filters change
  useEffect(() => {
    const searchGames = async () => {
      if (!collectionId) {
        setGames([])
        return
      }

      const results = await window.electron.searchGames(collectionId, {
        player: searchTerm || undefined,
        results: filters.results.length > 0 ? filters.results : undefined,
        dateFrom: filters.dateFrom ?? undefined,
        dateTo: filters.dateTo ?? undefined,
        ecoCodes: filters.ecoCodes.length > 0 ? filters.ecoCodes : undefined,
        limit: 200,
      })
      setGames(results)
    }
    searchGames()
  }, [collectionId, searchTerm, filters])

  return {
    games,
    totalGameCount,
    availableDates,
    staleDateFrom,
    staleDateTo,
  }
}
