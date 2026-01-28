import { describe, it, expect } from 'vitest'
import { buildLichessURL } from '../../src/utils/externalLinks.js'

describe('externalLinks', () => {
  describe('buildLichessURL', () => {
    it('encodes simple PGN', () => {
      const result = buildLichessURL('1. e4 e5')
      expect(result).toBe('https://lichess.org/paste?pgn=1.%20e4%20e5')
    })

    it('encodes PGN with special characters', () => {
      const result = buildLichessURL('1. e4 e5 2. Nf3 Nc6')
      expect(result).toContain('https://lichess.org/paste?pgn=')
      expect(result).toContain('Nf3')
      expect(result).toContain('Nc6')
    })

    it('encodes PGN with newlines', () => {
      const pgn = '1. e4 e5\n2. Nf3 Nc6'
      const result = buildLichessURL(pgn)
      expect(result).toContain('https://lichess.org/paste?pgn=')
      expect(result).toContain('%0A') // URL-encoded newline
    })

    it('encodes empty PGN', () => {
      const result = buildLichessURL('')
      expect(result).toBe('https://lichess.org/paste?pgn=')
    })

    it('encodes PGN with headers', () => {
      const pgn = '[White "Kasparov"]\n[Black "Karpov"]\n\n1. e4 e5'
      const result = buildLichessURL(pgn)
      expect(result).toContain('https://lichess.org/paste?pgn=')
      expect(result).toContain('Kasparov')
      expect(result).toContain('Karpov')
    })

    it('handles full game PGN', () => {
      const pgn = `[Event "World Championship"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`
      const result = buildLichessURL(pgn)
      expect(result).toContain('https://lichess.org/paste?pgn=')
      // Should contain encoded version of all content
      expect(result.length).toBeGreaterThan(50)
    })

    it('encodes symbols and brackets', () => {
      const pgn = '[Event "Test {+/-}"]'
      const result = buildLichessURL(pgn)
      expect(result).toContain('https://lichess.org/paste?pgn=')
      // Brackets and symbols should be encoded
      expect(result).toContain('%5B') // [
      expect(result).toContain('%5D') // ]
    })
  })
})
