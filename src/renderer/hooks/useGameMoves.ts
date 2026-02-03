import { useMemo } from 'react'

export interface UseGameMovesParams {
  /** Raw moves string from game data (e.g., "1. e4 c5 2. Nf3 d6") */
  movesString: string | undefined
}

export interface UseGameMovesReturn {
  /** Array of individual moves without move numbers */
  moves: string[]
}

/**
 * Parses a moves string into an array of individual moves.
 * Removes move numbers (e.g., "1.", "2.") and splits on whitespace.
 * Result is memoized to prevent unnecessary re-parsing.
 */
export function useGameMoves({ movesString }: UseGameMovesParams): UseGameMovesReturn {
  const moves = useMemo(() => {
    if (!movesString) return []
    return movesString
      .replace(/\d+\./g, '')
      .split(/\s+/)
      .filter(m => m.length > 0)
  }, [movesString])

  return { moves }
}
