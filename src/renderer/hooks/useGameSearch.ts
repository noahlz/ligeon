import { useState, useEffect, useRef } from 'react'
import type { GameSearchResult, GameListLimit } from '../../shared/types/game.js'
import type { GameFilterValues } from './useGameFilters.js'
import { showErrorToast } from '../utils/errorToast.js'
import { isDateStale, buildOptionFilters } from '../utils/filterValidation.js'

export interface UseGameSearchParams {
  /** Currently selected collection ID */
  collectionId: string | null
  /** Player search term */
  searchTerm: string
  /** Current filter values */
  filters: GameFilterValues
  /** Maximum number of games to return (undefined = no limit) */
  limit: GameListLimit
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
  limit,
  onCollectionChange,
}: UseGameSearchParams): UseGameSearchReturn {
  const [games, setGames] = useState<GameSearchResult[]>([])
  const [totalGameCount, setTotalGameCount] = useState(0)
  const [availableDates, setAvailableDates] = useState<number[]>([])
  const [staleDateFrom, setStaleDateFrom] = useState(false)
  const [staleDateTo, setStaleDateTo] = useState(false)

  // Always-current ref so the collectionId effect doesn't need onCollectionChange as a dep
  const onCollectionChangeRef = useRef(onCollectionChange)
  onCollectionChangeRef.current = onCollectionChange

  // Fetch game count when collection changes
  useEffect(() => {
    if (!collectionId) {
      setTotalGameCount(0)
      setAvailableDates([])
      setStaleDateFrom(false)
      setStaleDateTo(false)
      onCollectionChangeRef.current?.()
      return
    }

    window.electron.getGameCount(collectionId)
      .then(setTotalGameCount)
      .catch((error) => {
        showErrorToast('Failed to load game count', error)
      })
    setStaleDateFrom(false)
    setStaleDateTo(false)
    onCollectionChangeRef.current?.()
  }, [collectionId])

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
      setStaleDateFrom(isDateStale(filters.dateFrom, dates))
      setStaleDateTo(isDateStale(filters.dateTo, dates))
    }).catch((error) => {
      showErrorToast('Failed to load date filters', error)
    })
  // filters.dateFrom and filters.dateTo are intentionally excluded: they are set *by* this effect
  // (via setStaleDateFrom/setStaleDateTo) and would cause an infinite loop if included.
  }, [collectionId, searchTerm, filters.results]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search games whenever filters change
  useEffect(() => {
    if (!collectionId) {
      setGames([])
      return
    }

    window.electron.searchGames(collectionId, {
      ...buildOptionFilters({
        player: searchTerm,
        results: filters.results,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
      ecoCodes: filters.ecoCodes.length > 0 ? filters.ecoCodes : undefined,
      limit: limit === 'unlimited' ? undefined : limit,
    })
      .then(setGames)
      .catch((error) => {
        showErrorToast('Failed to load games', error)
      })
  }, [collectionId, searchTerm, filters, limit])

  return {
    games,
    totalGameCount,
    availableDates,
    staleDateFrom,
    staleDateTo,
  }
}
