import { describe, it, expect } from 'vitest'
import { parseMoveAndResult, groupMovesIntoPairs } from '../../src/renderer/utils/moveFormatter.js'

describe('moveFormatter', () => {
  describe('parseMoveAndResult', () => {
    it.each([
      {
        name: 'separates moves with result',
        pgnMoves: '1. e4 c5 2. Nf3 1-0',
        arrayMoves: ['e4', 'c5', 'Nf3', '1-0'],
        expectedMoves: ['e4', 'c5', 'Nf3'],
        expectedResult: '1-0'
      },
      {
        name: 'handles moves without a result',
        pgnMoves: '1. e4 c5 2. Nf3',
        arrayMoves: ['e4', 'c5', 'Nf3'],
        expectedMoves: ['e4', 'c5', 'Nf3'],
        expectedResult: null
      },
      {
        name: 'handles draw result',
        pgnMoves: '1. e4 e5 1/2-1/2',
        arrayMoves: ['e4', 'e5', '1/2-1/2'],
        expectedMoves: ['e4', 'e5'],
        expectedResult: '1/2-1/2',
      },
      {
        name: 'handles black win result',
        pgnMoves: '1. e4 e5 0-1',
        arrayMoves: ['e4', 'e5', '0-1'],
        expectedMoves: ['e4', 'e5'],
        expectedResult: '0-1',
      },
      {
        name: 'handles unfinished game marker',
        pgnMoves: '1. e4 e5 *',
        arrayMoves: ['e4', 'e5', '*'],
        expectedMoves: ['e4', 'e5'],
        expectedResult: '*',
      },
      {
        name: 'handles empty move list',
        pgnMoves: '',
        arrayMoves: [],
        expectedMoves: [],
        expectedResult: null,
      },
      {
        name: 'does not separate non-result strings',
        pgnMoves: '1. e4 c5 2. Nf3 Nc6',
        arrayMoves: ['e4', 'c5', 'Nf3', 'Nc6'],
        expectedMoves: ['e4', 'c5', 'Nf3', 'Nc6'],
        expectedResult: null,
      }
    ])('handles $name', ({ pgnMoves, arrayMoves, expectedMoves, expectedResult }) => {
      const pgnResult = parseMoveAndResult(pgnMoves)

      expect(pgnResult).toEqual({
        gameMoves: expectedMoves,
        result: expectedResult,
      });

      const arrResult = parseMoveAndResult(arrayMoves);
      expect(arrResult).toEqual(pgnResult);
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
