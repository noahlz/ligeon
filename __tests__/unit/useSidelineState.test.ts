import { describe, test, expect } from 'vitest'
import { getMaxSidelines } from '../../src/renderer/hooks/useSidelineState.js'

describe('useSidelineState', () => {
  describe('getMaxSidelines', () => {
    test('minimum of 1 sideline for very short games', () => {
      expect(getMaxSidelines(0)).toBe(1)
      expect(getMaxSidelines(1)).toBe(1)
      expect(getMaxSidelines(11)).toBe(1)
    })

    test('returns 1 for exactly 12 plies', () => {
      expect(getMaxSidelines(12)).toBe(1)
    })

    test('returns 2 for 24 plies', () => {
      expect(getMaxSidelines(24)).toBe(2)
    })

    test('returns 5 for 60 plies', () => {
      expect(getMaxSidelines(60)).toBe(5)
    })

    test('returns 10 for 120 plies (long game)', () => {
      expect(getMaxSidelines(120)).toBe(10)
    })

    test('floors fractional results', () => {
      expect(getMaxSidelines(13)).toBe(1)
      expect(getMaxSidelines(23)).toBe(1)
      expect(getMaxSidelines(25)).toBe(2)
    })
  })
})
