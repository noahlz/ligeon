import { describe, it, expect } from 'vitest'
import { groupMovesIntoPairs, pairIndexToPly, isCurrentMove } from '../../src/renderer/utils/moveFormatter.js'

describe('moveFormatter', () => {
  describe('groupMovesIntoPairs', () => {
    it('groups even number of moves into pairs', () => {
      const result = groupMovesIntoPairs(['e4', 'c5', 'Nf3', 'e6'])
      expect(result).toEqual([
        { white: 'e4', black: 'c5', moveNumber: 1 },
        { white: 'Nf3', black: 'e6', moveNumber: 2 },
      ])
    })

    it('handles odd number of moves', () => {
      const result = groupMovesIntoPairs(['e4', 'c5', 'Nf3'])
      expect(result).toEqual([
        { white: 'e4', black: 'c5', moveNumber: 1 },
        { white: 'Nf3', black: undefined, moveNumber: 2 },
      ])
    })

    it('handles single move', () => {
      const result = groupMovesIntoPairs(['e4'])
      expect(result).toEqual([
        { white: 'e4', black: undefined, moveNumber: 1 },
      ])
    })

    it('handles empty move list', () => {
      const result = groupMovesIntoPairs([])
      expect(result).toEqual([])
    })

    it('correctly numbers multiple pairs', () => {
      const result = groupMovesIntoPairs(['e4', 'e5', 'd4', 'd5', 'Nc3', 'Nf6'])
      expect(result).toEqual([
        { white: 'e4', black: 'e5', moveNumber: 1 },
        { white: 'd4', black: 'd5', moveNumber: 2 },
        { white: 'Nc3', black: 'Nf6', moveNumber: 3 },
      ])
    })
  })

  describe('pairIndexToPly', () => {
    it('pair 0 white => ply 1', () => {
      expect(pairIndexToPly(0, 'white')).toBe(1)
    })

    it('pair 0 black => ply 2', () => {
      expect(pairIndexToPly(0, 'black')).toBe(2)
    })

    it('pair 1 white => ply 3', () => {
      expect(pairIndexToPly(1, 'white')).toBe(3)
    })

    it('pair 1 black => ply 4', () => {
      expect(pairIndexToPly(1, 'black')).toBe(4)
    })

    it('pair 5 white => ply 11 (move 6 white)', () => {
      expect(pairIndexToPly(5, 'white')).toBe(11)
    })

    it('pair 5 black => ply 12 (move 6 black)', () => {
      expect(pairIndexToPly(5, 'black')).toBe(12)
    })
  })

  describe('isCurrentMove', () => {
    it('returns true when currentPly matches targetPly1 on mainline', () => {
      expect(isCurrentMove(3, 3, false)).toBe(true)
    })

    it('returns false when currentPly does not match', () => {
      expect(isCurrentMove(3, 4, false)).toBe(false)
    })

    it('returns false when inside a variation regardless of ply match', () => {
      expect(isCurrentMove(3, 3, true)).toBe(false)
    })

    it('returns false at start position (ply 0)', () => {
      expect(isCurrentMove(0, 1, false)).toBe(false)
    })
  })
})
