/**
 * Sideline formatting utilities for MoveList display.
 * Handles move numbering, color parity, and move parsing for sideline variations.
 */

import type { SidelineData } from '../../shared/types/game.js'

/**
 * Get sidelines that branch at a given mainline ply.
 */
export function getSidelinesAtPly(sidelines: SidelineData[], ply: number): SidelineData[] {
  return sidelines.filter(s => s.branchPly === ply)
}

/**
 * Parse sideline moves string into individual moves array.
 */
export function parseSidelineMoves(moves: string): string[] {
  return moves.trim().split(' ').filter(Boolean)
}

/**
 * Compute move number for a sideline move at a given index, based on branch ply.
 *
 * branchPly is the mainline ply being replaced by the sideline (1-based).
 * The first sideline move (moveIndex 0) replaces branchPly, so its move number is branchPly's move number.
 * Subsequent moves continue from there.
 *
 * @param branchPly - 1-based mainline ply where sideline branches (the move being replaced)
 * @param moveIndex - 0-based index within the sideline moves array
 * @returns Chess move number (e.g., 1, 2, 3...)
 */
export function sidelineMoveNumber(branchPly: number, moveIndex: number): number {
  const absolutePly = branchPly + moveIndex
  return Math.ceil(absolutePly / 2)
}

/**
 * Determine if a sideline move at a given index is a white move.
 *
 * In chess notation, odd plies are white moves (ply 1, 3, 5...), even plies are black (2, 4, 6...).
 * branchPly is the ply being replaced. The first sideline move (moveIndex 0) has that ply's color.
 *
 * @param branchPly - 1-based mainline ply where sideline branches (the move being replaced)
 * @param moveIndex - 0-based index within the sideline moves array
 * @returns true if the move is white's turn, false if black's
 */
export function isSidelineWhiteMove(branchPly: number, moveIndex: number): boolean {
  const absolutePly = branchPly + moveIndex
  return absolutePly % 2 === 1
}
