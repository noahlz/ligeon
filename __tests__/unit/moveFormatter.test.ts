import { describe, it, expect } from 'vitest'
import { separateResultFromMoves, groupMovesIntoPairs } from '../../src/utils/moveFormatter.js'

describe('moveFormatter', () => {
  describe('separateResultFromMoves', () => {
    it('separates moves with result', () => {
      const result = separateResultFromMoves(['e4', 'c5', 'Nf3', '1-0'])
      expect(result).toEqual({
        gameMoves: ['e4', 'c5', 'Nf3'],
        result: '1-0',
      })
    })

    it('handles moves without result', () => {
      const result = separateResultFromMoves(['e4', 'c5', 'Nf3'])
      expect(result).toEqual({
        gameMoves: ['e4', 'c5', 'Nf3'],
        result: null,
      })
    })

    it('handles draw result', () => {
      const result = separateResultFromMoves(['e4', 'e5', '1/2-1/2'])
      expect(result).toEqual({
        gameMoves: ['e4', 'e5'],
        result: '1/2-1/2',
      })
    })

    it('handles black win result', () => {
      const result = separateResultFromMoves(['e4', 'e5', '0-1'])
      expect(result).toEqual({
        gameMoves: ['e4', 'e5'],
        result: '0-1',
      })
    })

    it('handles unfinished game marker', () => {
      const result = separateResultFromMoves(['e4', 'e5', '*'])
      expect(result).toEqual({
        gameMoves: ['e4', 'e5'],
        result: '*',
      })
    })

    it('handles empty move list', () => {
      const result = separateResultFromMoves([])
      expect(result).toEqual({
        gameMoves: [],
        result: null,
      })
    })

    it('does not separate non-result strings', () => {
      const result = separateResultFromMoves(['e4', 'c5', 'Nf3', 'Nc6'])
      expect(result).toEqual({
        gameMoves: ['e4', 'c5', 'Nf3', 'Nc6'],
        result: null,
      })
    })
  })

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
