/**
 * Board display utilities for annotation badge positioning and layout.
 */

import { parseSquare, squareFile, squareRank } from 'chessops/util'

/**
 * Convert a chess square notation (e.g. "e5") to CSS percentage offsets
 * for absolute positioning an overlay badge on the board.
 *
 * @param square - Algebraic square notation, e.g. "a1", "h8"
 * @param orientation - Board orientation ('white' = a1 bottom-left, 'black' = h8 bottom-left)
 * @returns Object with leftPct and bottomPct as percentages of board size,
 *          or null if the square is invalid
 */
export function squareToPercentPosition(
  square: string,
  orientation: 'white' | 'black',
): { leftPct: number; bottomPct: number } | null {
  const sq = parseSquare(square)
  if (sq === undefined) return null
  const fileIndex = squareFile(sq)
  const rankIndex = squareRank(sq)
  return {
    leftPct: orientation === 'white' ? fileIndex * 12.5 : (7 - fileIndex) * 12.5,
    bottomPct: orientation === 'white' ? rankIndex * 12.5 : (7 - rankIndex) * 12.5,
  }
}

/**
 * Compute container width and per-badge width (as a fraction of container)
 * for a stacked annotation badge group.
 *
 * Badges are staggered 1.5% apart; the container spans all of them.
 *
 * @param count - Number of badges (must be >= 1)
 * @returns containerWidthPct and badgeWidthInContainerPct
 */
export function badgeContainerLayout(count: number): {
  containerWidthPct: number
  badgeWidthInContainerPct: number
} {
  const containerWidthPct = count >= 1 ? 5 + (count - 1) * 1.5 : 5
  const badgeWidthInContainerPct = (5 / containerWidthPct) * 100
  return { containerWidthPct, badgeWidthInContainerPct }
}
