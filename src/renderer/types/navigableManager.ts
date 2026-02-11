/**
 * NavigableManager - shared interface for chess position navigation.
 *
 * Enables navigation hooks (useGameNavigation, useBoardState) to work with either
 * the read-only mainline (ChessManager) or mutable sideline sequences (SidelineManager)
 * without knowing which type they're navigating.
 */

import type { MoveType } from './moveTypes.js'

/**
 * Common navigation methods for any position sequence.
 * Both ChessManager (mainline) and SidelineManager (sideline) implement this.
 */
export interface NavigableManager {
  getFen: () => string
  getLastMove: () => [string, string] | undefined
  getMoveType: (ply: number) => MoveType | undefined
  goto: (ply: number) => void
  getCurrentPly: () => number
  /** Returns the number of moves made (excludes initial position) */
  getTotalPlies: () => number
}
