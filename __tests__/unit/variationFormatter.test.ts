import { describe, test, expect } from 'vitest'
import {
  getVariationsAtPly,
  parseVariationMoves,
  variationMoveNumber,
  isVariationWhiteMove,
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
    test('branch after 1. e4 (ply 1) — first variation move is move 1', () => {
      expect(variationMoveNumber(1, 0)).toBe(1)
    })

    test('branch after 1. e4 (ply 1) — second variation move is move 2', () => {
      expect(variationMoveNumber(1, 1)).toBe(2)
    })

    test('branch after 1...e5 (ply 2) — first variation move is move 2', () => {
      expect(variationMoveNumber(2, 0)).toBe(2)
    })

    test('branch after 1...e5 (ply 2) — second variation move is move 2', () => {
      expect(variationMoveNumber(2, 1)).toBe(2)
    })

    test('branch after 5. Nf3 (ply 9) — first variation move is move 5', () => {
      expect(variationMoveNumber(9, 0)).toBe(5)
    })

    test('branch after 5...Nc6 (ply 10) — first variation move is move 6', () => {
      expect(variationMoveNumber(10, 0)).toBe(6)
    })

    test('branch at ply 10, index 5 is move 8', () => {
      expect(variationMoveNumber(10, 5)).toBe(8)
    })

    test('branch at ply 20, index 0 is move 11', () => {
      expect(variationMoveNumber(20, 0)).toBe(11)
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
})
