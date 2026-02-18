/**
 * Variation formatting utilities for MoveList display.
 * Handles move numbering, color parity, and move parsing for variation variations.
 */

import type { VariationData } from '../../shared/types/game.js'

/**
 * Get variations that branch at a given mainline ply.
 */
export function getVariationsAtPly(variations: VariationData[], ply: number): VariationData[] {
  return variations.filter(s => s.branchPly === ply)
}

/**
 * Parse variation moves string into individual moves array.
 */
export function parseVariationMoves(moves: string): string[] {
  return moves.trim().split(' ').filter(Boolean)
}

/**
 * Compute move number for a variation move at a given index, based on branch ply.
 *
 * branchPly is the mainline ply being replaced by the variation (1-based).
 * The first variation move (moveIndex 0) replaces branchPly, so its move number is branchPly's move number.
 * Subsequent moves continue from there.
 *
 * @param branchPly - 1-based mainline ply where variation branches (the move being replaced)
 * @param moveIndex - 0-based index within the variation moves array
 * @returns Chess move number (e.g., 1, 2, 3...)
 */
export function variationMoveNumber(branchPly: number, moveIndex: number): number {
  const absolutePly = branchPly + moveIndex
  return Math.ceil((absolutePly + 1) / 2)
}

/**
 * Determine if a variation move at a given index is a white move.
 *
 * In chess notation, odd plies are white moves (ply 1, 3, 5...), even plies are black (2, 4, 6...).
 * branchPly is the ply being replaced. The first variation move (moveIndex 0) has that ply's color.
 *
 * @param branchPly - 1-based mainline ply where variation branches (the move being replaced)
 * @param moveIndex - 0-based index within the variation moves array
 * @returns true if the move is white's turn, false if black's
 */
export function isVariationWhiteMove(branchPly: number, moveIndex: number): boolean {
  const absolutePly = branchPly + moveIndex
  return absolutePly % 2 === 1
}

/**
 * Format a move sequence preview (first N moves with ellipsis if truncated).
 *
 * @param moves - Space-separated SAN moves string
 * @param maxMoves - Maximum number of moves to include in preview (default 3)
 * @returns Formatted preview string (e.g., "Nf3 d5 e4..." or "Nf3 d5" if not truncated)
 */
export function formatMovePreview(moves: string, maxMoves = 3): string {
  const moveArray = parseVariationMoves(moves)
  if (moveArray.length === 0) return ''
  const preview = moveArray.slice(0, maxMoves).join(' ')
  return moveArray.length > maxMoves ? `${preview}...` : preview
}
