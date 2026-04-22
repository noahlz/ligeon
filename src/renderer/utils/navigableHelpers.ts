/**
 * Shared navigation methods for FEN-position sequences.
 *
 * ChessManager (mainline, read-only) and VariationManager (variation, mutable)
 * both store an array of ParsedMove with a currentPly cursor. These methods
 * implement the common read-side navigation contract over that shared shape.
 */

import type { ParsedMove } from './chessManager.js'
import { getDestsFromFen, getTurnColorFromFen, tryMoveFromFen } from './chessHelpers.js'
import type { MoveType } from '../types/moveTypes.js'

/**
 * Mutable cursor over a positions array. Callers hold a reference and may
 * mutate `positions` (e.g. truncate or push) and `currentPly` directly — the
 * helpers below read both lazily, so writes are visible on the next call.
 */
export interface NavState {
  positions: ParsedMove[]
  currentPly: number
}

export interface NavigableMethods {
  getFen: () => string
  getLastMove: () => [string, string] | undefined
  getMoveType: (ply: number) => MoveType | undefined
  goto: (ply: number) => void
  getCurrentPly: () => number
  getTotalPlies: () => number
  getDests: () => Map<string, string[]>
  getTurnColor: () => 'white' | 'black'
  tryMove: (from: string, to: string, promotion?: string) => string | null
}

export function createNavigableMethods(state: NavState): NavigableMethods {
  return {
    getFen: () => state.positions[state.currentPly].fen,

    getLastMove: () => state.positions[state.currentPly].lastMove,

    getMoveType: (ply: number) => {
      if (ply < 0 || ply >= state.positions.length) return undefined
      return state.positions[ply].type
    },

    goto: (ply: number) => {
      if (ply >= 0 && ply < state.positions.length) {
        state.currentPly = ply
      }
    },

    getCurrentPly: () => state.currentPly,

    // Exclude initial position (positions[0]) from ply count — it's the starting
    // FEN, not a move that was played.
    getTotalPlies: () => state.positions.length - 1,

    getDests: () => getDestsFromFen(state.positions[state.currentPly].fen),

    getTurnColor: () => getTurnColorFromFen(state.positions[state.currentPly].fen),

    tryMove: (from: string, to: string, promotion?: string) =>
      tryMoveFromFen(state.positions[state.currentPly].fen, from, to, promotion),
  }
}
