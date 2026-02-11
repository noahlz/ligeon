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
 * branchPly is 1-based mainline ply (ply 1 = white's first move, ply 2 = black's first move).
 * Sideline continues from there, so (branchPly + moveIndex) gives the absolute ply.
 * Dividing by 2 converts half-moves to full-move number.
 *
 * @param branchPly - 1-based mainline ply where sideline branches
 * @param moveIndex - 0-based index within the sideline moves array
 * @returns Chess move number (e.g., 1, 2, 3...)
 */
export function sidelineMoveNumber(branchPly: number, moveIndex: number): number {
  const absolutePly = branchPly + moveIndex
  return Math.floor(absolutePly / 2) + 1
}

/**
 * Determine if a sideline move at a given index is a white move.
 *
 * In chess notation, odd plies are white moves (ply 1, 3, 5...), even plies are black (2, 4, 6...).
 * branchPly + moveIndex gives the absolute ply; modulo 2 tests parity.
 *
 * @param branchPly - 1-based mainline ply where sideline branches
 * @param moveIndex - 0-based index within the sideline moves array
 * @returns true if the move is white's turn, false if black's
 */
export function isSidelineWhiteMove(branchPly: number, moveIndex: number): boolean {
  const absolutePly = branchPly + moveIndex
  return absolutePly % 2 === 1
}
