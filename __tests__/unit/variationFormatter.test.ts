import { describe, test, expect } from 'vitest'
import {
  getVariationsAtPly,
  parseVariationMoves,
  variationMoveNumber,
  isVariationWhiteMove,
  formatVariationMovesForDisplay,
} from '../../src/renderer/utils/variationFormatter.js'
import type { VariationData } from '../../src/shared/types/game.js'

describe('variationFormatter', () => {
  describe('getVariationsAtPly', () => {
    test('returns variations matching the given ply', () => {
      const variations: VariationData[] = [
        { gameId: 1, branchPly: 5, moves: 'e5 Nf3' },
        { gameId: 1, branchPly: 10, moves: 'd5' },
        { gameId: 1, branchPly: 5, moves: 'c5' },
      ]
      const result = getVariationsAtPly(variations, 5)
      expect(result).toHaveLength(2)
      expect(result.map(s => s.moves)).toEqual(['e5 Nf3', 'c5'])
    })

    test('returns empty array when no variations match', () => {
      const variations: VariationData[] = [
        { gameId: 1, branchPly: 5, moves: 'e5' },
      ]
      expect(getVariationsAtPly(variations, 10)).toEqual([])
    })

    test('returns empty array for empty input', () => {
      expect(getVariationsAtPly([], 5)).toEqual([])
    })
  })

  describe('parseVariationMoves', () => {
    test('splits space-separated moves', () => {
      expect(parseVariationMoves('e5 Nf3 Nc6')).toEqual(['e5', 'Nf3', 'Nc6'])
    })

    test('handles extra whitespace', () => {
      expect(parseVariationMoves('  e5   Nf3  ')).toEqual(['e5', 'Nf3'])
    })

    test('returns empty array for empty string', () => {
      expect(parseVariationMoves('')).toEqual([])
    })

    test('returns empty array for whitespace-only string', () => {
      expect(parseVariationMoves('   ')).toEqual([])
    })

    test('handles single move', () => {
      expect(parseVariationMoves('e4')).toEqual(['e4'])
    })
  })

  describe('variationMoveNumber', () => {
    // Ply convention: 1-based, odd=white, even=black. Move number = Math.ceil(ply / 2).
    // Ply 1=white move 1, ply 2=black move 1, ply 3=white move 2, ply 4=black move 2, etc.

    test('ply convention: odd plies (white) — move number = ceil(ply / 2)', () => {
      // Ply 1 = white move 1 → "1."
      expect(variationMoveNumber(1, 0)).toBe(1)
      // Ply 3 = white move 2 → "2."
      expect(variationMoveNumber(3, 0)).toBe(2)
      // Ply 5 = white move 3 → "3."
      expect(variationMoveNumber(5, 0)).toBe(3)
    })

    test('ply convention: even plies (black) — move number = ply / 2', () => {
      // Ply 2 = black move 1 → "1..."
      expect(variationMoveNumber(2, 0)).toBe(1)
      // Ply 4 = black move 2 → "2..."
      expect(variationMoveNumber(4, 0)).toBe(2)
      // Ply 10 = black move 5 → "5..."
      expect(variationMoveNumber(10, 0)).toBe(5)
    })

    test('branch after 1. e4 (ply 1) — first variation move is move 1', () => {
      expect(variationMoveNumber(1, 0)).toBe(1)
    })

    test('branch after 1. e4 (ply 1) — second variation move (black response) is move 1', () => {
      // absolutePly = 1+1 = 2 (black move 1) → "1..."
      expect(variationMoveNumber(1, 1)).toBe(1)
    })

    test('branch at 1...e5 (ply 2) — first variation move is move 1', () => {
      expect(variationMoveNumber(2, 0)).toBe(1)
    })

    test('branch at 1...e5 (ply 2) — second variation move is move 2', () => {
      expect(variationMoveNumber(2, 1)).toBe(2)
    })

    test('branch after 5. Nf3 (ply 9) — first variation move is move 5', () => {
      expect(variationMoveNumber(9, 0)).toBe(5)
    })

    test('branch at 5...Nc6 (ply 10) — first variation move is move 5', () => {
      expect(variationMoveNumber(10, 0)).toBe(5)
    })

    test('branch at ply 10, index 5 is move 8', () => {
      expect(variationMoveNumber(10, 5)).toBe(8)
    })

    test('branch at ply 20, index 0 is move 10', () => {
      expect(variationMoveNumber(20, 0)).toBe(10)
    })
  })

  describe('isVariationWhiteMove', () => {
    test('branch at odd ply (white move position) — first move is white', () => {
      expect(isVariationWhiteMove(1, 0)).toBe(true)
    })

    test('branch at odd ply (white move position) — second move is black', () => {
      expect(isVariationWhiteMove(1, 1)).toBe(false)
    })

    test('branch at even ply (black move position) — first move is black', () => {
      expect(isVariationWhiteMove(2, 0)).toBe(false)
    })

    test('branch at even ply (black move position) — second move is white', () => {
      expect(isVariationWhiteMove(2, 1)).toBe(true)
    })

    test('branch at ply 9 (white), index 3 is black', () => {
      expect(isVariationWhiteMove(9, 3)).toBe(false)
    })

    test('branch at ply 10 (black), index 4 is black', () => {
      expect(isVariationWhiteMove(10, 4)).toBe(false)
    })
  })

  describe('formatVariationMovesForDisplay', () => {
    test('white-starting variation from ply 1', () => {
      const result = formatVariationMovesForDisplay(['e4', 'e5', 'Nf3'], 1)
      expect(result).toBe('1. e4 e5 2. Nf3')
    })

    test('black-starting variation (first move prefixed with ...)', () => {
      // branchPly 2 = replacing 1...e5 (ply 2 = black move 1 → "1...")
      // variationMoveNumber(2, 0) = ceil(2/2) = 1
      // Second move: variationMoveNumber(2, 1) = ceil(3/2) = 2 (white)
      const result = formatVariationMovesForDisplay(['c5', 'Nf3'], 2)
      expect(result).toBe('1... c5 2. Nf3')
    })

    test('variation starting mid-game from white ply', () => {
      // branchPly 5 = replacing move 3 white
      const result = formatVariationMovesForDisplay(['Nf3', 'Nc6', 'Bb5'], 5)
      expect(result).toBe('3. Nf3 Nc6 4. Bb5')
    })

    test('single move', () => {
      const result = formatVariationMovesForDisplay(['d4'], 1)
      expect(result).toBe('1. d4')
    })

    test('empty moves array', () => {
      expect(formatVariationMovesForDisplay([], 1)).toBe('')
    })

    test('black-starting variation mid-game', () => {
      // branchPly 10 = replacing 5...Nc6 (ply 10 = black move 5 → "5...")
      // variationMoveNumber(10, 0) = ceil(10/2) = 5
      const result = formatVariationMovesForDisplay(['d5'], 10)
      expect(result).toBe('5... d5')
    })
  })
})
