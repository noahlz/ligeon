import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useGameFilters } from '@/hooks/useGameFilters'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useGameFilters', () => {
  describe('setDateFrom', () => {
    it('sets dateFrom when dateTo is null', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setDateFrom(20230101)
      })
      expect(result.current.filters.dateFrom).toBe(20230101)
    })

    it('sets dateFrom when dateFrom <= dateTo (valid)', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setDateTo(20230601)
      })
      act(() => {
        result.current.setDateFrom(20230101)
      })
      expect(result.current.filters.dateFrom).toBe(20230101)
    })

    it('clears dateFrom when called with null', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => { result.current.setDateFrom(20230101) })
      act(() => { result.current.setDateFrom(null) })
      expect(result.current.filters.dateFrom).toBeNull()
    })

    it('does NOT update state when dateFrom > dateTo (invalid)', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setDateTo(20230101)
      })
      act(() => {
        result.current.setDateFrom(20230601)
      })
      expect(result.current.filters.dateFrom).toBeNull()
    })
  })

  describe('setDateTo', () => {
    it('sets dateTo when dateFrom is null', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setDateTo(20230601)
      })
      expect(result.current.filters.dateTo).toBe(20230601)
    })

    it('sets dateTo when dateTo >= dateFrom (valid)', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setDateFrom(20230101)
      })
      act(() => {
        result.current.setDateTo(20230601)
      })
      expect(result.current.filters.dateTo).toBe(20230601)
    })

    it('clears dateTo when called with null', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => { result.current.setDateTo(20230601) })
      act(() => { result.current.setDateTo(null) })
      expect(result.current.filters.dateTo).toBeNull()
    })

    it('does NOT update state when dateTo < dateFrom (invalid)', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setDateFrom(20230601)
      })
      act(() => {
        result.current.setDateTo(20230101)
      })
      expect(result.current.filters.dateTo).toBeNull()
    })
  })

  describe('resetFilters', () => {
    it('clears searchTerm and all filters back to initial state', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setSearchTerm('Magnus')
        result.current.setResultsFilter([1, 0])
        result.current.setEcoCodes(['B20', 'C45'])
      })
      act(() => {
        result.current.setDateFrom(20230101)
      })
      act(() => {
        result.current.resetFilters()
      })
      expect(result.current.searchTerm).toBe('')
      expect(result.current.filters.results).toEqual([])
      expect(result.current.filters.dateFrom).toBeNull()
      expect(result.current.filters.dateTo).toBeNull()
      expect(result.current.filters.ecoCodes).toEqual([])
    })
  })

  describe('setResultsFilter', () => {
    it('updates results array', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setResultsFilter([1, 0.5])
      })
      expect(result.current.filters.results).toEqual([1, 0.5])
    })
  })

  describe('setEcoCodes', () => {
    it('updates ecoCodes array', () => {
      const { result } = renderHook(() => useGameFilters())
      act(() => {
        result.current.setEcoCodes(['A00', 'D35'])
      })
      expect(result.current.filters.ecoCodes).toEqual(['A00', 'D35'])
    })
  })
})
