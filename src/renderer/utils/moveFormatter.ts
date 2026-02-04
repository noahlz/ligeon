export interface MovePair {
  white: string
  black?: string
  moveNumber: number
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
