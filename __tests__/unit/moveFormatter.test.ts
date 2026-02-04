import { describe, it, expect } from 'vitest'
import { groupMovesIntoPairs } from '../../src/renderer/utils/moveFormatter.js'

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
})
