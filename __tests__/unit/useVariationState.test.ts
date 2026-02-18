import { describe, test, expect } from 'vitest'
import { getMaxVariations } from '../../src/renderer/hooks/useVariationState.js'

describe('useVariationState', () => {
  describe('getMaxVariations', () => {
    test('minimum of 1 variation for very short games', () => {
      expect(getMaxVariations(0)).toBe(1)
      expect(getMaxVariations(1)).toBe(1)
      expect(getMaxVariations(11)).toBe(1)
    })

    test('returns 1 for exactly 12 plies', () => {
      expect(getMaxVariations(12)).toBe(1)
    })

    test('returns 2 for 24 plies', () => {
      expect(getMaxVariations(24)).toBe(2)
    })

    test('returns 5 for 60 plies', () => {
      expect(getMaxVariations(60)).toBe(5)
    })

    test('returns 10 for 120 plies (long game)', () => {
      expect(getMaxVariations(120)).toBe(10)
    })

    test('floors fractional results', () => {
      expect(getMaxVariations(13)).toBe(1)
      expect(getMaxVariations(23)).toBe(1)
      expect(getMaxVariations(25)).toBe(2)
    })
  })
})
