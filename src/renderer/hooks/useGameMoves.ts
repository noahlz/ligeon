import { useMemo } from 'react'
import { parseMoves } from '../utils/moveParser.js'

export interface UseGameMovesParams {
  /** Raw moves string from game data (e.g., "1. e4 c5 2. Nf3 d6 1-0") */
  movesString: string | undefined
}

export interface UseGameMovesReturn {
  /** Array of individual SAN moves without move numbers or result */
  moves: string[]
  /** Game result string (e.g., "1-0", "0-1", "1/2-1/2", "*"), or null */
  result: string | null
}

/**
 * Parses a moves string into individual SAN moves and the game result.
 * Uses chessops PGN parser for robust handling of move numbers, results, and NAGs.
 * Result is memoized to prevent unnecessary re-parsing.
 */
export function useGameMoves({ movesString }: UseGameMovesParams): UseGameMovesReturn {
  const { moves, result } = useMemo(() => parseMoves(movesString), [movesString])
  return { moves, result }
}
