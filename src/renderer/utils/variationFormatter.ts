/**
 * Variation formatting utilities for MoveList display.
 * Handles move numbering, color parity, and move parsing for variation moves.
 *
 * Ply convention (1-based): ply 1 = white move 1, ply 2 = black move 1,
 * ply 3 = white move 2, ply 4 = black move 2, etc.
 * Odd plies = white; even plies = black.
 * Chess move number = Math.ceil(ply / 2).
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
 * branchPly is the 1-based mainline ply being replaced by the variation.
 * The first variation move (moveIndex 0) replaces branchPly, so its move number
 * equals branchPly's chess move number: Math.ceil(branchPly / 2).
 * Subsequent moves continue from there.
 *
 * Examples (see ply convention in module JSDoc):
 *   branchPly=1, moveIndex=0 → ply 1 (white move 1) → 1
 *   branchPly=2, moveIndex=0 → ply 2 (black move 1) → 1  (displayed as "1...")
 *   branchPly=5, moveIndex=0 → ply 5 (white move 3) → 3
 *   branchPly=10, moveIndex=0 → ply 10 (black move 5) → 5 (displayed as "5...")
 *
 * @param branchPly - 1-based mainline ply where variation branches (the move being replaced)
 * @param moveIndex - 0-based index within the variation moves array
 * @returns Chess move number (e.g., 1, 2, 3...)
 */
export function variationMoveNumber(branchPly: number, moveIndex: number): number {
  const absolutePly = branchPly + moveIndex
  return Math.ceil(absolutePly / 2)  // was: (absolutePly + 1) / 2 — off-by-one for even plies (black)
}

/**
 * Determine if a variation move at a given index is a white move.
 *
 * Uses the 1-based ply convention (see module JSDoc): odd plies = white, even plies = black.
 * branchPly is the ply being replaced; the first variation move (moveIndex 0) has that ply's color.
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
 * Build a compact, fully-annotated move string for tooltip display.
 *
 * Each move is prefixed with its move number following standard chess notation:
 * - White moves: "N. move" (e.g. "3. Nf3")
 * - First move if black: "N... move" (e.g. "3... Nc6")
 * - Subsequent black moves: no prefix (concatenated after the preceding white move)
 *
 * @param moves     - Array of SAN move strings
 * @param branchPly - 1-based mainline ply where the variation branches
 * @returns Space-joined string, e.g. "3. Nf3 Nc6 4. Bb5"
 *
 * @example
 * formatVariationMovesForDisplay(['Nf3', 'Nc6', 'Bb5'], 5)
 * // => "3. Nf3 Nc6 4. Bb5"
 */
export function formatVariationMovesForDisplay(moves: string[], branchPly: number): string {
  return moves.map((move, i) => {
    const isWhite = isVariationWhiteMove(branchPly, i)
    const num = variationMoveNumber(branchPly, i)
    if (isWhite) return `${num}. ${move}`
    if (i === 0) return `${num}... ${move}`
    return move
  }).join(' ')
}
