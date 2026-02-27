import { describe, it, expect } from 'vitest'
import { formatPlayerWithElo, formatEcoWithOpening } from '../../src/renderer/utils/formatters.js'

describe('formatters', () => {
  describe('formatPlayerWithElo', () => {
    it('appends elo in parentheses when provided', () => {
      expect(formatPlayerWithElo('Magnus Carlsen', 2882)).toBe('Magnus Carlsen (2882)')
    })

    it('returns just the name when elo is null', () => {
      expect(formatPlayerWithElo('Magnus Carlsen', null)).toBe('Magnus Carlsen')
    })

    it('returns just the name when elo is undefined', () => {
      expect(formatPlayerWithElo('Magnus Carlsen')).toBe('Magnus Carlsen')
    })

    it('handles elo of 0 (falsy) as no-elo', () => {
      // Elo of 0 is not a realistic value; treated same as missing
      expect(formatPlayerWithElo('Unknown', 0)).toBe('Unknown')
    })
  })

  describe('formatEcoWithOpening', () => {
    it('returns empty string for null', () => {
      expect(formatEcoWithOpening(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(formatEcoWithOpening(undefined)).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(formatEcoWithOpening('')).toBe('')
    })

    it('returns just the ECO code when opening is unknown', () => {
      // X99 is not a real ECO code
      expect(formatEcoWithOpening('X99')).toBe('X99')
    })

    it('returns ECO code + opening name for known codes', () => {
      const result = formatEcoWithOpening('A00')
      expect(result).toBe('A00 Uncommon Opening')
    })

    it('returns ECO code + name for B20 (Sicilian Defense)', () => {
      const result = formatEcoWithOpening('B20')
      expect(result).toMatch(/^B20 .+/)  // requires a name, not just the ECO prefix
    })
  })
})
