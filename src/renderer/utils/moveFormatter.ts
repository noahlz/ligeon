import type { CommentData } from '../../shared/types/game.js'

export interface MovePair {
  white: string
  black?: string
  moveNumber: number
}

/**
 * Convert a move pair index (0-based) and color to a 1-based ply number.
 *
 * White's ply for pair index P = 2P + 1
 * Black's ply for pair index P = 2P + 2
 *
 * @example
 * pairIndexToPly(0, 'white') // => 1  (move 1 white)
 * pairIndexToPly(0, 'black') // => 2  (move 1 black)
 * pairIndexToPly(5, 'white') // => 11 (move 6 white)
 */
export function pairIndexToPly(pairIndex: number, color: 'white' | 'black'): number {
  return color === 'white' ? pairIndex * 2 + 1 : pairIndex * 2 + 2
}

/**
 * Returns true if a move at the given 1-based ply is the current position.
 * Always false when inside a variation (navigating the variation's own ply tracker).
 *
 * @param currentPly  - The currently highlighted ply (1-based, 0 = start position)
 * @param targetPly1  - The 1-based ply of the move cell to test
 * @param isInVariation - True when rendered inside a variation context
 */
export function isCurrentMove(
  currentPly: number,
  targetPly1: number,
  isInVariation: boolean,
): boolean {
  return !isInVariation && currentPly === targetPly1
}

/**
 * Group moves into white/black pairs with move numbers
 *
 * @param moves - List of moves (without result)
 * @returns Array of move pairs
 *
 * @example
 * groupMovesIntoPairs(['e4', 'c5', 'Nf3', 'e6'])
 * // => [
 * //   { white: 'e4', black: 'c5', moveNumber: 1 },
 * //   { white: 'Nf3', black: 'e6', moveNumber: 2 }
 * // ]
 */
export function groupMovesIntoPairs(moves: string[]): MovePair[] {
  const movePairs: MovePair[] = []

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1],
      moveNumber: Math.floor(i / 2) + 1,
    })
  }

  return movePairs
}

/**
 * Converts a comments array into a ply-indexed Map for O(1) lookup.
 * Accepts undefined so callers can pass optional comment arrays directly.
 */
export function createCommentsByPlyMap(comments: CommentData[] | undefined): Map<number, CommentData> {
  const map = new Map<number, CommentData>()
  comments?.forEach(c => map.set(c.ply, c))
  return map
}
