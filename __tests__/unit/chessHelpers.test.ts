import { describe, test, expect } from 'vitest'
import {
  getDestsFromFen,
  getTurnColorFromFen,
  tryMoveFromFen,
  getCheckColor,
} from '../../src/renderer/utils/chessHelpers.js'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
// Parseable FEN but no kings — Chess.fromSetup fails validation
const NO_KINGS_FEN = '8/8/8/8/8/8/8/8 w - - 0 1'
const INVALID_FEN = 'not-a-fen'
// White pawn on a7 ready to promote; black king on h2 is off all queen lines from a8
const PRE_PROMOTION_FEN = '8/P7/8/8/8/8/7k/4K3 w - - 0 1'

describe('chessHelpers', () => {
  describe('getDestsFromFen', () => {
    test('returns legal destinations from initial position', () => {
      const dests = getDestsFromFen(INITIAL_FEN)
      expect(dests.size).toBeGreaterThan(0)
      expect(dests.get('e2')).toContain('e4')
      expect(dests.get('g1')).toContain('f3')
    })

    test('returns destinations for black after e4', () => {
      const dests = getDestsFromFen(AFTER_E4_FEN)
      expect(dests.get('e7')).toContain('e5')
    })

    test('returns empty map for invalid FEN string', () => {
      const dests = getDestsFromFen(INVALID_FEN)
      expect(dests).toBeInstanceOf(Map)
      expect(dests.size).toBe(0)
    })

    test('returns empty map when Chess.fromSetup fails (no kings)', () => {
      const dests = getDestsFromFen(NO_KINGS_FEN)
      expect(dests).toBeInstanceOf(Map)
      expect(dests.size).toBe(0)
    })
  })

  describe('getTurnColorFromFen', () => {
    test('returns white from initial position', () => {
      expect(getTurnColorFromFen(INITIAL_FEN)).toBe('white')
    })

    test('returns black after e4', () => {
      expect(getTurnColorFromFen(AFTER_E4_FEN)).toBe('black')
    })

    test('defaults to white for invalid FEN', () => {
      expect(getTurnColorFromFen(INVALID_FEN)).toBe('white')
    })
  })

  describe('tryMoveFromFen', () => {
    test('returns SAN for a legal pawn move', () => {
      expect(tryMoveFromFen(INITIAL_FEN, 'e2', 'e4')).toBe('e4')
    })

    test('returns SAN for a legal knight move', () => {
      expect(tryMoveFromFen(INITIAL_FEN, 'g1', 'f3')).toBe('Nf3')
    })

    test('returns null for an illegal move', () => {
      expect(tryMoveFromFen(INITIAL_FEN, 'e2', 'e5')).toBeNull()
    })

    test('returns null for invalid from square', () => {
      expect(tryMoveFromFen(INITIAL_FEN, 'z9', 'e4')).toBeNull()
    })

    test('returns null for invalid to square', () => {
      expect(tryMoveFromFen(INITIAL_FEN, 'e2', 'z9')).toBeNull()
    })

    test('returns null for invalid FEN string', () => {
      expect(tryMoveFromFen(INVALID_FEN, 'e2', 'e4')).toBeNull()
    })

    test('returns null when Chess.fromSetup fails (no kings)', () => {
      expect(tryMoveFromFen(NO_KINGS_FEN, 'e2', 'e4')).toBeNull()
    })

    test('returns SAN with promotion piece', () => {
      // a7 pawn promotes to queen on a8
      expect(tryMoveFromFen(PRE_PROMOTION_FEN, 'a7', 'a8', 'queen')).toBe('a8=Q')
    })
  })

  describe('getCheckColor', () => {
    test('returns turn color when move type is check', () => {
      expect(getCheckColor('check', 'white')).toBe('white')
      expect(getCheckColor('check', 'black')).toBe('black')
    })

    test('returns false for non-check move types', () => {
      expect(getCheckColor('move', 'white')).toBe(false)
      expect(getCheckColor('capture', 'black')).toBe(false)
      expect(getCheckColor('castle', 'white')).toBe(false)
    })

    test('returns false when moveType is undefined', () => {
      expect(getCheckColor(undefined, 'white')).toBe(false)
      expect(getCheckColor(undefined, 'black')).toBe(false)
    })
  })
})
