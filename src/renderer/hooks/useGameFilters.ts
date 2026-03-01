import { useState, useCallback } from 'react'
import { isValidDateFrom, isValidDateTo } from '../utils/filterValidation.js'

export interface GameFilterValues {
  results: number[]
  dateFrom: number | null
  dateTo: number | null
  ecoCodes: string[]
}

const INITIAL_FILTERS: GameFilterValues = {
  results: [],
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
  /** Set results filter - array of selected results (1.0 = white, 0.0 = black, 0.5 = draw) */
  setResultsFilter: (results: number[]) => void
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

  const setResultsFilter = useCallback((results: number[]) => {
    setFilters(prev => ({ ...prev, results }))
  }, [])

  const setDateFrom = useCallback((date: number | null) => {
    setFilters(prev => {
      if (isValidDateFrom(date, prev.dateTo)) return { ...prev, dateFrom: date }
      return prev
    })
  }, [])

  const setDateTo = useCallback((date: number | null) => {
    setFilters(prev => {
      if (isValidDateTo(date, prev.dateFrom)) return { ...prev, dateTo: date }
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
    setResultsFilter,
    setDateFrom,
    setDateTo,
    setEcoCodes,
    resetFilters,
  }
}
