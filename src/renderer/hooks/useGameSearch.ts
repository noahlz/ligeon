import { useState, useEffect } from 'react'
import type { GameSearchResult } from '../../shared/types/game.js'
import type { GameFilterValues } from './useGameFilters.js'

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
  /** Available dates in the collection (YYYYMM) */
  availableDates: number[]
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

  // Fetch metadata when collection changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!collectionId) {
        setTotalGameCount(0)
        setAvailableDates([])
        onCollectionChange?.()
        return
      }

      const count = await window.electron.getGameCount(collectionId)
      setTotalGameCount(count)

      const dates = await window.electron.getAvailableDates(collectionId)
      setAvailableDates(dates)

      onCollectionChange?.()
    }
    fetchMetadata()
  }, [collectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search games whenever filters change
  useEffect(() => {
    const searchGames = async () => {
      if (!collectionId) {
        setGames([])
        return
      }

      const results = await window.electron.searchGames(collectionId, {
        player: searchTerm || undefined,
        result: filters.result ?? undefined,
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
  }
}
