/**
 * VariationManager - mutable move sequence manager for variation exploration.
 *
 * Unlike ChessManager (read-only mainline), VariationManager supports interactive
 * move-making: appending moves, truncating variations, and building sequences from
 * any position. Starts from a FEN (branch point) rather than the initial position.
 *
 * Used by the UI layer (PR3) to enable users to explore alternative moves and
 * save them back to the database.
 */

import { Chess } from 'chessops/chess'
import { parseFen } from 'chessops/fen'
import type { NavigableManager } from '../types/navigableManager.js'
import { type ParsedMove, playAndRecord } from './chessManager.js'
import { parseMoves } from './moveParser.js'
import { getDestsFromFen, getTurnColorFromFen, tryMoveFromFen } from './chessHelpers.js'
import { showErrorToast } from './errorToast.js'

export interface VariationManager extends NavigableManager {
  /** Legal move destinations for chessground from current position */
  getDests: () => Map<string, string[]>
  /** Whose turn it is */
  getTurnColor: () => 'white' | 'black'
  /** Validate a move, return SAN if legal, null otherwise (read-only) */
  tryMove: (from: string, to: string, promotion?: string) => string | null
  /** Append a SAN move after the current position. Returns false if illegal. */
  appendMove: (san: string) => boolean
  /** Remove all moves after the current ply */
  truncateAfterCurrent: () => void
  /** Get the space-separated SAN string of all variation moves */
  getMovesString: () => string
  /** Get the SAN of the next move (currentPly + 1), or null if none exists */
  getNextSan: () => string | null
}

/**
 * Create a variation manager for building and navigating a mutable move sequence.
 *
 * @param startFen - The FEN position where the variation begins (the branch point)
 * @param existingMoves - Optional space-separated SAN moves to initialize the variation
 */
export function createVariationManager(
  startFen: string,
  existingMoves?: string
): VariationManager {
  const positions: ParsedMove[] = []
  let currentPly = 0

  // Parse the starting FEN to create initial position
  const setupResult = parseFen(startFen)
  if (setupResult.isErr) {
    throw new Error(`Failed to parse starting FEN: ${startFen}`)
  }

  const chess = Chess.fromSetup(setupResult.value).unwrap()

  // Add initial position
  positions.push({
    san: '',
    fen: startFen,
    lastMove: undefined,
    type: 'move'
  })

  // If existing moves provided, replay them.
  // Route through parseMoves() to robustly handle move numbers, NAGs, and annotations
  // that may be present in stored variation strings.
  if (existingMoves && existingMoves.trim()) {
    const { moves: sanMoves } = parseMoves(existingMoves)

    for (const san of sanMoves) {
      const parsed = playAndRecord(chess, san)
      if (!parsed) {
        console.error(`Failed to parse variation move: ${san}`)
        showErrorToast('Failed to load variation: invalid move data')
        break
      }
      positions.push(parsed)
    }
  }

  return {
    getFen: () => positions[currentPly].fen,

    getLastMove: () => positions[currentPly].lastMove,

    getMoveType: (ply: number) => {
      if (ply < 0 || ply >= positions.length) return undefined
      return positions[ply].type
    },

    goto: (ply: number) => {
      if (ply >= 0 && ply < positions.length) {
        currentPly = ply
      }
    },

    getCurrentPly: () => currentPly,

    // Exclude initial position (positions[0]) from ply count — it's the starting FEN,
    // not a move that was played.
    getTotalPlies: () => positions.length - 1,

    getDests: () => getDestsFromFen(positions[currentPly].fen),

    getTurnColor: () => getTurnColorFromFen(positions[currentPly].fen),

    tryMove: (from: string, to: string, promotion?: string) =>
      tryMoveFromFen(positions[currentPly].fen, from, to, promotion),

    appendMove: (san: string) => {
      // Truncate any moves after current position
      positions.length = currentPly + 1

      // Reconstruct Chess position from FEN instead of keeping a live Chess instance.
      // Positions are stored as FEN strings for consistency with ChessManager and to avoid
      // state drift between the position array and a mutable object.
      const fen = positions[currentPly].fen
      const setup = parseFen(fen)
      if (setup.isErr) return false
      const chess = Chess.fromSetup(setup.value)
      if (chess.isErr) return false

      // Try to play the move
      const parsed = playAndRecord(chess.value, san)
      if (!parsed) return false

      // Add to positions and advance ply
      positions.push(parsed)
      currentPly++
      return true
    },

    truncateAfterCurrent: () => {
      positions.length = currentPly + 1
    },

    getMovesString: () => {
      return positions.slice(1).map(p => p.san).join(' ')
    },

    getNextSan: () => {
      const nextPly = currentPly + 1
      return nextPly < positions.length ? positions[nextPly].san : null
    }
  }
}
