import { describe, it, expect } from 'vitest'
import { buildLichessURL, buildFullPgn } from '../../src/renderer/utils/externalLinks.js'
import type { GameRow } from '../../src/shared/types/game.js'

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

  describe('buildFullPgn', () => {
    const makeGame = (overrides: Partial<GameRow> = {}): GameRow => ({
      id: 1,
      white: 'Fischer, Robert J.',
      black: 'Spassky, Boris V.',
      event: 'World Championship',
      date: 19720831,
      result: 1.0,
      ecoCode: 'B44',
      whiteElo: 2785,
      blackElo: 2660,
      site: 'Reykjavik ISL',
      round: '1',
      moveCount: 10,
      moves: '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 1-0',
      ...overrides,
    })

    it('includes all seven required PGN headers', () => {
      const pgn = buildFullPgn(makeGame())
      expect(pgn).toContain('[Event "World Championship"]')
      expect(pgn).toContain('[Site "Reykjavik ISL"]')
      expect(pgn).toContain('[Date "1972.08.31"]')
      expect(pgn).toContain('[Round "1"]')
      expect(pgn).toContain('[White "Fischer, Robert J."]')
      expect(pgn).toContain('[Black "Spassky, Boris V."]')
      expect(pgn).toContain('[Result "1-0"]')
    })

    it('includes optional headers when present', () => {
      const pgn = buildFullPgn(makeGame())
      expect(pgn).toContain('[WhiteElo "2785"]')
      expect(pgn).toContain('[BlackElo "2660"]')
      expect(pgn).toContain('[ECO "B44"]')
    })

    it('omits optional headers when null', () => {
      const pgn = buildFullPgn(makeGame({ whiteElo: null, blackElo: null, ecoCode: null }))
      expect(pgn).not.toContain('[WhiteElo')
      expect(pgn).not.toContain('[BlackElo')
      expect(pgn).not.toContain('[ECO')
    })

    it('uses ? for null event, site, round', () => {
      const pgn = buildFullPgn(makeGame({ event: null, site: null, round: null }))
      expect(pgn).toContain('[Event "?"]')
      expect(pgn).toContain('[Site "?"]')
      expect(pgn).toContain('[Round "?"]')
    })

    it('uses ????.??.?? for null date', () => {
      const pgn = buildFullPgn(makeGame({ date: null }))
      expect(pgn).toContain('[Date "????.??.??"]')
    })

    it('converts unknown day to ?? in date', () => {
      const pgn = buildFullPgn(makeGame({ date: 19720800 }))
      expect(pgn).toContain('[Date "1972.08.??"]')
    })

    it('handles all result types', () => {
      expect(buildFullPgn(makeGame({ result: 1.0 }))).toContain('[Result "1-0"]')
      expect(buildFullPgn(makeGame({ result: 0.0 }))).toContain('[Result "0-1"]')
      expect(buildFullPgn(makeGame({ result: 0.5 }))).toContain('[Result "1/2-1/2"]')
    })

    it('appends movetext after blank line', () => {
      const pgn = buildFullPgn(makeGame())
      const parts = pgn.split('\n\n')
      expect(parts.length).toBe(2)
      expect(parts[1]).toBe('1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 1-0')
    })
  })
})
