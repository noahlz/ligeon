import type { MoveType } from './moveTypes.js'

/**
 * Shared interface for any chess position navigator.
 * Implemented by ChessManager (read-only mainline) and SidelineManager (mutable sideline).
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
