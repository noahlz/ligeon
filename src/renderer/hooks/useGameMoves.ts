import { useMemo } from 'react'
import { parsePgn } from 'chessops/pgn'

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
  const { moves, result } = useMemo(() => {
    if (!movesString) return { moves: [], result: null }
    const games = parsePgn(movesString)
    if (games.length === 0) return { moves: [], result: null }
    const sanMoves = [...games[0].moves.mainline()].map(n => n.san)
    const gameResult = games[0].headers.get('Result') ?? null
    return { moves: sanMoves, result: gameResult }
  }, [movesString])

  return { moves, result }
}
