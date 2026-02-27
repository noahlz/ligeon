import { describe, it, expect } from 'vitest'
import {
  buildLichessURL,
  buildLichessAnalysisURL,
  buildFullPgn,
  buildAnnotatedPgn,
} from '../../src/renderer/utils/externalLinks.js'
import type { GameRow, CommentData, AnnotationData, VariationData } from '../../src/shared/types/game.js'

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

const makeComment = (ply: number, text: string): CommentData => ({
  gameId: 1, ply, variationId: null, text,
})

const makeAnnotation = (ply: number, nag: number): AnnotationData => ({
  gameId: 1, ply, nag,
})

const makeVariation = (id: number, branchPly: number, moves: string): VariationData => ({
  id, gameId: 1, branchPly, moves,
})

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

  describe('buildLichessAnalysisURL', () => {
    it('replaces spaces with underscores in FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
      const result = buildLichessAnalysisURL(fen)
      expect(result).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR_b_KQkq_-_0_1')
      expect(result).not.toContain(' ')
    })

    it('returns correct base URL prefix', () => {
      const result = buildLichessAnalysisURL('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      expect(result.startsWith('https://lichess.org/analysis/')).toBe(true)
    })

    it('handles starting position FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const result = buildLichessAnalysisURL(fen)
      expect(result).toBe('https://lichess.org/analysis/rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR_w_KQkq_-_0_1')
    })

    it('handles FEN with no spaces (edge case)', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
      const result = buildLichessAnalysisURL(fen)
      expect(result).toBe('https://lichess.org/analysis/rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
    })
  })

  describe('buildAnnotatedPgn', () => {
    const simpleGame = makeGame({ moves: 'e4 e5 Nf3 Nc6 1-0' })

    it('produces correct PGN headers', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [], [])
      expect(pgn).toContain('[White "Fischer, Robert J."]')
      expect(pgn).toContain('[Black "Spassky, Boris V."]')
      expect(pgn).toContain('[Result "1-0"]')
    })

    it('no annotations — adds white move numbers only (black omitted without prior annotation)', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [], [])
      const movetext = pgn.split('\n\n')[1]
      expect(movetext).toBe('1. e4 e5 2. Nf3 Nc6 1-0')
    })

    it('white move number always present; black omitted when no prior annotation', () => {
      const pgn = buildAnnotatedPgn(makeGame({ moves: 'e4 e5 Nf3 1-0' }), [], [])
      const movetext = pgn.split('\n\n')[1]
      // black ply 2 (e5) should not get "1..." because white ply 1 had no annotation
      expect(movetext).toMatch(/^1\. e4 e5 2\. Nf3 1-0$/)
    })

    it('NAG symbol appended to move with no space', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [], [makeAnnotation(1, 1)])
      expect(pgn).toContain('e4!')
      expect(pgn).not.toContain('e4 !')
    })

    it('multiple NAGs concatenated onto same move', () => {
      // nag 5 = !?, nag 1 = !
      const pgn = buildAnnotatedPgn(simpleGame, [], [makeAnnotation(1, 1), makeAnnotation(1, 2)])
      // Both symbols should be on the move token
      const movetext = pgn.split('\n\n')[1]
      expect(movetext).toMatch(/e4[!?]{2}/)
    })

    it('unknown NAG falls back to $N format', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [], [makeAnnotation(1, 99)])
      expect(pgn).toContain('e4$99')
    })

    it('mainline comment inserted after move as { text }', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [makeComment(1, 'Great opening')], [])
      expect(pgn).toContain('{ Great opening }')
    })

    it('sanitizes curly braces from comment text', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [makeComment(1, 'gain {+0.5}')], [])
      expect(pgn).toContain('{ gain +0.5 }')
      expect(pgn).not.toContain('{{')
    })

    it('black move number inserted after white move with comment', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [makeComment(1, 'nice')], [])
      const movetext = pgn.split('\n\n')[1]
      // After white ply 1 comment, black ply 2 must have "1..."
      expect(movetext).toMatch(/e4 \{ nice \} 1\.\.\. e5/)
    })

    it('black move number NOT inserted when white move has no annotation', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [], [])
      const movetext = pgn.split('\n\n')[1]
      // No annotation on ply 1 → no "1..." before e5
      expect(movetext).not.toMatch(/1\.\.\. e5/)
    })

    it('variation RAV block inserted after mainline move', () => {
      const variation = makeVariation(10, 1, 'd4')
      const pgn = buildAnnotatedPgn(simpleGame, [], [], [variation])
      expect(pgn).toContain('( 1. d4 )')
    })

    it('variation starting on black ply uses N... format inside RAV', () => {
      // branchPly=2 is black's first move (e5); variation replaces it with c5
      // buildVariationRav only adds a move number prefix at j=0
      const variation = makeVariation(11, 2, 'c5 Nf3')
      const pgn = buildAnnotatedPgn(simpleGame, [], [], [variation])
      expect(pgn).toContain('( 1... c5 Nf3 )')
    })

    it('variation-level comment appended inside RAV', () => {
      const variation = makeVariation(12, 1, 'd4')
      const varComments = new Map([[12, makeComment(0, 'Main line instead')]])
      const pgn = buildAnnotatedPgn(simpleGame, [], [], [variation], varComments)
      expect(pgn).toContain('( 1. d4 { Main line instead } )')
    })

    it('variationId !== null comments are ignored for mainline', () => {
      // Comment with variationId set should not appear in mainline
      const varComment: CommentData = { gameId: 1, ply: 1, variationId: 5, text: 'should be ignored' }
      const pgn = buildAnnotatedPgn(simpleGame, [varComment], [])
      expect(pgn).not.toContain('should be ignored')
    })

    it('result token appended at end', () => {
      const pgn = buildAnnotatedPgn(simpleGame, [], [])
      const movetext = pgn.split('\n\n')[1]
      expect(movetext.endsWith('1-0')).toBe(true)
    })

    it('handles game with no result token in moves field', () => {
      const game = makeGame({ moves: 'e4 e5' })
      const pgn = buildAnnotatedPgn(game, [], [])
      const movetext = pgn.split('\n\n')[1]
      expect(movetext.endsWith('*')).toBe(true)
    })

    it('uses ? for null event/site/round and ????.??.?? for null date in headers', () => {
      const game = makeGame({ event: null, site: null, round: null, date: null })
      const pgn = buildAnnotatedPgn(game, [], [])
      expect(pgn).toContain('[Event "?"]')
      expect(pgn).toContain('[Site "?"]')
      expect(pgn).toContain('[Round "?"]')
      expect(pgn).toContain('[Date "????.??.??"]')
    })

    it('ignores variation with empty moves string', () => {
      const emptyVariation = makeVariation(99, 1, '')
      const pgn = buildAnnotatedPgn(simpleGame, [], [], [emptyVariation])
      // Empty variation produces no RAV block
      expect(pgn).not.toContain('(')
      expect(pgn).not.toContain(')')
    })

    it('black move number inserted after white move with RAV variation', () => {
      const variation = makeVariation(20, 1, 'd4')
      const pgn = buildAnnotatedPgn(simpleGame, [], [], [variation])
      const movetext = pgn.split('\n\n')[1]
      // After ply-1 RAV, black ply 2 must have "1..."
      expect(movetext).toMatch(/\( 1\. d4 \) 1\.\.\. e5/)
    })
  })
})
