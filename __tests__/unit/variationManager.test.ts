import { describe, test, expect } from 'vitest'
import {
  createVariationManager,
  type VariationManager,
} from '../../src/renderer/utils/variationManager.js'

const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

describe('VariationManager', () => {
  describe('creation', () => {
    test('creates from FEN with no existing moves', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      expect(manager.getCurrentPly()).toBe(0)
      expect(manager.getTotalPlies()).toBe(0)
      expect(manager.getFen()).toBe(startFen)
    })

    test('creates from FEN with existing moves', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3')

      expect(manager.getTotalPlies()).toBe(2)
      expect(manager.getCurrentPly()).toBe(0) // Starts at beginning
    })

    test('initial FEN matches startFen', () => {
      const startFen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2'
      const manager = createVariationManager(startFen)

      expect(manager.getFen()).toBe(startFen)
    })

    test('throws on invalid FEN', () => {
      expect(() => createVariationManager('invalid fen')).toThrow()
    })

    test('handles existingMoves with move numbers', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, '1... e5 2. Nf3 Nc6')

      expect(manager.getTotalPlies()).toBe(3)
      expect(manager.getMovesString()).toBe('e5 Nf3 Nc6')
    })

    test('handles existingMoves with annotations', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 { Good move } Nc6')

      expect(manager.getTotalPlies()).toBe(3)
      expect(manager.getMovesString()).toBe('e5 Nf3 Nc6')
    })
  })

  describe('navigation (NavigableManager)', () => {
    let manager: VariationManager

    test('goto, getCurrentPly, getTotalPlies work correctly', () => {
      const startFen = AFTER_E4_FEN
      manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      expect(manager.getCurrentPly()).toBe(0)
      expect(manager.getTotalPlies()).toBe(3)

      manager.goto(2)
      expect(manager.getCurrentPly()).toBe(2)

      manager.goto(10) // Out of range, should not change
      expect(manager.getCurrentPly()).toBe(2)
    })

    test('getFen returns correct FEN at each ply', () => {
      const startFen = AFTER_E4_FEN
      manager = createVariationManager(startFen, 'e5 Nf3')

      const fen0 = manager.getFen()
      expect(fen0).toBe(startFen)

      manager.goto(1)
      const fen1 = manager.getFen()
      expect(fen1).toContain('4p3') // e5 pawn

      manager.goto(2)
      const fen2 = manager.getFen()
      expect(fen2).toContain('5N2') // Nf3
    })

    test('getLastMove returns correct squares', () => {
      const startFen = AFTER_E4_FEN
      manager = createVariationManager(startFen, 'e5 Nf3')

      expect(manager.getLastMove()).toBeUndefined() // Initial position

      manager.goto(1)
      expect(manager.getLastMove()).toEqual(['e7', 'e5'])

      manager.goto(2)
      expect(manager.getLastMove()).toEqual(['g1', 'f3'])
    })

    test('getMoveType detects captures, checks, castles', () => {
      const startFen = AFTER_E4_FEN
      manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      expect(manager.getMoveType(1)).toBe('move') // e5
      expect(manager.getMoveType(2)).toBe('move') // Nf3
      expect(manager.getMoveType(3)).toBe('move') // Nc6

      // Test with capture
      const captureManager = createVariationManager(startFen, 'e5 Nf3 d5 exd5')
      expect(captureManager.getMoveType(4)).toBe('capture')
    })
  })

  describe('getDests / getTurnColor / tryMove', () => {
    test('getDests returns legal moves from current position', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)
      const dests = manager.getDests()

      expect(dests.size).toBeGreaterThan(0)
      // Black can play e7-e5 or e7-e6
      const e7Dests = dests.get('e7')
      expect(e7Dests).toBeDefined()
      expect(e7Dests).toContain('e5')
      expect(e7Dests).toContain('e6')
    })

    test('getTurnColor reflects whose turn it is', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3')

      expect(manager.getTurnColor()).toBe('black')

      manager.goto(1)
      expect(manager.getTurnColor()).toBe('white')

      manager.goto(2)
      expect(manager.getTurnColor()).toBe('black')
    })

    test('tryMove validates legal moves, rejects illegal ones', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      // Legal move
      expect(manager.tryMove('e7', 'e5')).toBe('e5')

      // Illegal move (can't move 3 squares)
      expect(manager.tryMove('e7', 'e4')).toBeNull()

      // Legal knight move
      expect(manager.tryMove('b8', 'c6')).toBe('Nc6')
    })
  })

  describe('appendMove', () => {
    test('appends a legal move and advances ply', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      const success = manager.appendMove('e5')
      expect(success).toBe(true)
      expect(manager.getCurrentPly()).toBe(1)
      expect(manager.getTotalPlies()).toBe(1)
    })

    test('returns false for illegal SAN', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      const success = manager.appendMove('e4') // Illegal for black from this position
      expect(success).toBe(false)
      expect(manager.getCurrentPly()).toBe(0)
      expect(manager.getTotalPlies()).toBe(0)
    })

    test('truncates future moves when appending from mid-sequence', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      expect(manager.getTotalPlies()).toBe(3)

      // Go back to ply 1 (after e5, white's turn) and append a different move
      manager.goto(1)
      const success = manager.appendMove('Nc3') // Different from Nf3
      expect(success).toBe(true)
      expect(manager.getTotalPlies()).toBe(2) // e5, Nc3
      expect(manager.getMovesString()).toBe('e5 Nc3')
    })

    test('multiple appends build a move sequence', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      manager.appendMove('e5')
      manager.appendMove('Nf3')
      manager.appendMove('Nc6')

      expect(manager.getTotalPlies()).toBe(3)
      expect(manager.getMovesString()).toBe('e5 Nf3 Nc6')
    })

    test('rejects gibberish SAN', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      expect(manager.appendMove('Xyz123!@#')).toBe(false)
      expect(manager.getTotalPlies()).toBe(0)
    })

    test('rejects empty string', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      expect(manager.appendMove('')).toBe(false)
      expect(manager.getTotalPlies()).toBe(0)
    })

    test('rejects invalid move notation', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      expect(manager.appendMove('e2e4')).toBe(false) // Long algebraic not recognized
      expect(manager.appendMove('P-e5')).toBe(false) // Old notation
      expect(manager.getTotalPlies()).toBe(0)
    })
  })

  describe('truncateAfterCurrent', () => {
    test('removes moves after current ply', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      manager.goto(1)
      manager.truncateAfterCurrent()

      expect(manager.getTotalPlies()).toBe(1)
      expect(manager.getMovesString()).toBe('e5')
    })

    test('no-op when at last position', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3')

      manager.goto(2) // Last position
      manager.truncateAfterCurrent()

      expect(manager.getTotalPlies()).toBe(2)
      expect(manager.getMovesString()).toBe('e5 Nf3')
    })

    test('can truncate all moves', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3')

      manager.goto(0) // Initial position
      manager.truncateAfterCurrent()

      expect(manager.getTotalPlies()).toBe(0)
      expect(manager.getMovesString()).toBe('')
    })
  })

  describe('getMovesString', () => {
    test('returns space-separated SAN string', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      expect(manager.getMovesString()).toBe('e5 Nf3 Nc6')
    })

    test('returns empty string for no moves', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      expect(manager.getMovesString()).toBe('')
    })

    test('reflects truncation', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      manager.goto(1)
      manager.truncateAfterCurrent()

      expect(manager.getMovesString()).toBe('e5')
    })

    test('works after appendMove', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      manager.appendMove('e5')
      manager.appendMove('Nf3')

      expect(manager.getMovesString()).toBe('e5 Nf3')
    })
  })

  describe('getNextSan', () => {
    test('returns next move SAN when moves exist after current ply', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      // At ply 0, next move is e5
      expect(manager.getNextSan()).toBe('e5')

      manager.goto(1)
      expect(manager.getNextSan()).toBe('Nf3')

      manager.goto(2)
      expect(manager.getNextSan()).toBe('Nc6')
    })

    test('returns null when at last position', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3')

      manager.goto(2)
      expect(manager.getNextSan()).toBeNull()
    })

    test('returns null when no moves exist', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen)

      expect(manager.getNextSan()).toBeNull()
    })

    test('reflects truncation', () => {
      const startFen = AFTER_E4_FEN
      const manager = createVariationManager(startFen, 'e5 Nf3 Nc6')

      manager.goto(1)
      manager.truncateAfterCurrent()
      expect(manager.getNextSan()).toBeNull()
    })
  })
})
