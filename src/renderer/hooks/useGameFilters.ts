import { useState, useCallback } from 'react'

export interface GameFilterValues {
  result: number | null
  dateFrom: number | null
  dateTo: number | null
  ecoCodes: string[]
}

const INITIAL_FILTERS: GameFilterValues = {
  result: null,
  dateFrom: null,
  dateTo: null,
  ecoCodes: [],
}

export interface UseGameFiltersReturn {
  /** Current player search term */
  searchTerm: string
  setSearchTerm: (term: string) => void
  /** Current filter values */
  filters: GameFilterValues
  /** Whether the filter panel is expanded */
  filtersExpanded: boolean
  setFiltersExpanded: (expanded: boolean) => void
  /** Set result filter (1 = white, -1 = black, 0 = draw, null = all) */
  setResultFilter: (result: number | null) => void
  /** Set dateFrom filter — validates dateFrom <= dateTo */
  setDateFrom: (date: number | null) => void
  /** Set dateTo filter — validates dateFrom <= dateTo */
  setDateTo: (date: number | null) => void
  /** Set ECO code filter */
  setEcoCodes: (ecoCodes: string[]) => void
  /** Reset all filters and search term */
  resetFilters: () => void
}

/**
 * Manages search term, filter state, and filter panel visibility.
 * Date setters enforce the dateFrom <= dateTo invariant.
 */
export function useGameFilters(): UseGameFiltersReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<GameFilterValues>(INITIAL_FILTERS)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const setResultFilter = useCallback((result: number | null) => {
    setFilters(prev => ({ ...prev, result }))
  }, [])

  const setDateFrom = useCallback((date: number | null) => {
    setFilters(prev => {
      if (date === null || prev.dateTo === null || date <= prev.dateTo) {
        return { ...prev, dateFrom: date }
      }
      return prev
    })
  }, [])

  const setDateTo = useCallback((date: number | null) => {
    setFilters(prev => {
      if (date === null || prev.dateFrom === null || prev.dateFrom <= date) {
        return { ...prev, dateTo: date }
      }
      return prev
    })
  }, [])

  const setEcoCodes = useCallback((ecoCodes: string[]) => {
    setFilters(prev => ({ ...prev, ecoCodes }))
  }, [])

  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setFilters(INITIAL_FILTERS)
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    filters,
    filtersExpanded,
    setFiltersExpanded,
    setResultFilter,
    setDateFrom,
    setDateTo,
    setEcoCodes,
    resetFilters,
  }
}
