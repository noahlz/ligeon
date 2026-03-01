import { describe, it, expect } from 'vitest'
import { parseMoves } from '../../src/renderer/utils/moveParser.js'

describe('parseMoves', () => {
  it('returns empty moves and null result for undefined input', () => {
    expect(parseMoves(undefined)).toEqual({ moves: [], result: null })
  })

  it('returns empty moves and null result for empty string', () => {
    expect(parseMoves('')).toEqual({ moves: [], result: null })
  })

  it('parses a complete game with a result', () => {
    const { moves, result } = parseMoves('1. e4 e5 2. Nf3 Nc6 1-0')
    expect(moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
    expect(result).toBe('1-0')
  })

  it('parses a game with a draw result', () => {
    const { moves, result } = parseMoves('1. d4 d5 1/2-1/2')
    expect(moves).toEqual(['d4', 'd5'])
    expect(result).toBe('1/2-1/2')
  })

  it('returns the asterisk result for an in-progress game', () => {
    const { moves, result } = parseMoves('1. e4 *')
    expect(moves).toEqual(['e4'])
    expect(result).toBe('*')
  })

  it('strips move numbers and returns only SAN moves', () => {
    const { moves } = parseMoves('1. e4 e5 2. d4 d5 3. Nc3 *')
    expect(moves).toEqual(['e4', 'e5', 'd4', 'd5', 'Nc3'])
  })

  it('returns asterisk result when no result token is present', () => {
    // chessops parsePgn infers '*' (in-progress) when no result header is provided
    const { result } = parseMoves('1. e4 e5')
    expect(result).toBe('*')
  })
})
