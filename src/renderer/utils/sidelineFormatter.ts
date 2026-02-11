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
 * @param branchPly - 1-based mainline ply where sideline branches
 * @param moveIndex - 0-based index within the sideline moves array
 * @returns Chess move number (e.g., 1, 2, 3...)
 */
export function sidelineMoveNumber(branchPly: number, moveIndex: number): number {
  // branchPly is 1-based mainline ply. Sideline continues from there.
  // Move number = Math.floor((branchPly + moveIndex) / 2) + 1
  return Math.floor((branchPly + moveIndex) / 2) + 1
}

/**
 * Determine if a sideline move at a given index is a white move.
 *
 * @param branchPly - 1-based mainline ply where sideline branches
 * @param moveIndex - 0-based index within the sideline moves array
 * @returns true if the move is white's turn, false if black's
 */
export function isSidelineWhiteMove(branchPly: number, moveIndex: number): boolean {
  // branchPly is the mainline ply where we branch. The first sideline move
  // replaces the move at branchPly (1-based). If branchPly is odd, it's a white move position.
  return (branchPly + moveIndex) % 2 === 1
}
