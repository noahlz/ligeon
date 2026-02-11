import { describe, test, expect } from 'vitest'
import {
  getSidelinesAtPly,
  parseSidelineMoves,
  sidelineMoveNumber,
  isSidelineWhiteMove,
} from '../../src/renderer/utils/sidelineFormatter.js'
import type { SidelineData } from '../../src/shared/types/game.js'

describe('sidelineFormatter', () => {
  describe('getSidelinesAtPly', () => {
    test('returns sidelines matching the given ply', () => {
      const sidelines: SidelineData[] = [
        { gameId: 1, branchPly: 5, moves: 'e5 Nf3' },
        { gameId: 1, branchPly: 10, moves: 'd5' },
        { gameId: 1, branchPly: 5, moves: 'c5' },
      ]
      const result = getSidelinesAtPly(sidelines, 5)
      expect(result).toHaveLength(2)
      expect(result.map(s => s.moves)).toEqual(['e5 Nf3', 'c5'])
    })

    test('returns empty array when no sidelines match', () => {
      const sidelines: SidelineData[] = [
        { gameId: 1, branchPly: 5, moves: 'e5' },
      ]
      expect(getSidelinesAtPly(sidelines, 10)).toEqual([])
    })

    test('returns empty array for empty input', () => {
      expect(getSidelinesAtPly([], 5)).toEqual([])
    })
  })

  describe('parseSidelineMoves', () => {
    test('splits space-separated moves', () => {
      expect(parseSidelineMoves('e5 Nf3 Nc6')).toEqual(['e5', 'Nf3', 'Nc6'])
    })

    test('handles extra whitespace', () => {
      expect(parseSidelineMoves('  e5   Nf3  ')).toEqual(['e5', 'Nf3'])
    })

    test('returns empty array for empty string', () => {
      expect(parseSidelineMoves('')).toEqual([])
    })

    test('returns empty array for whitespace-only string', () => {
      expect(parseSidelineMoves('   ')).toEqual([])
    })

    test('handles single move', () => {
      expect(parseSidelineMoves('e4')).toEqual(['e4'])
    })
  })

  describe('sidelineMoveNumber', () => {
    test('branch after 1. e4 (ply 1) — first sideline move is move 1', () => {
      expect(sidelineMoveNumber(1, 0)).toBe(1)
    })

    test('branch after 1. e4 (ply 1) — second sideline move is move 2', () => {
      expect(sidelineMoveNumber(1, 1)).toBe(2)
    })

    test('branch after 1...e5 (ply 2) — first sideline move is move 2', () => {
      expect(sidelineMoveNumber(2, 0)).toBe(2)
    })

    test('branch after 1...e5 (ply 2) — second sideline move is move 2', () => {
      expect(sidelineMoveNumber(2, 1)).toBe(2)
    })

    test('branch after 5. Nf3 (ply 9) — first sideline move is move 5', () => {
      expect(sidelineMoveNumber(9, 0)).toBe(5)
    })

    test('branch after 5...Nc6 (ply 10) — first sideline move is move 6', () => {
      expect(sidelineMoveNumber(10, 0)).toBe(6)
    })

    test('branch at ply 10, index 5 is move 8', () => {
      expect(sidelineMoveNumber(10, 5)).toBe(8)
    })

    test('branch at ply 20, index 0 is move 11', () => {
      expect(sidelineMoveNumber(20, 0)).toBe(11)
    })
  })

  describe('isSidelineWhiteMove', () => {
    test('branch at odd ply (white move position) — first move is white', () => {
      expect(isSidelineWhiteMove(1, 0)).toBe(true)
    })

    test('branch at odd ply (white move position) — second move is black', () => {
      expect(isSidelineWhiteMove(1, 1)).toBe(false)
    })

    test('branch at even ply (black move position) — first move is black', () => {
      expect(isSidelineWhiteMove(2, 0)).toBe(false)
    })

    test('branch at even ply (black move position) — second move is white', () => {
      expect(isSidelineWhiteMove(2, 1)).toBe(true)
    })

    test('branch at ply 9 (white), index 3 is black', () => {
      expect(isSidelineWhiteMove(9, 3)).toBe(false)
    })

    test('branch at ply 10 (black), index 4 is black', () => {
      expect(isSidelineWhiteMove(10, 4)).toBe(false)
    })
  })
})
