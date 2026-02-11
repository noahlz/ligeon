import { Chess } from 'chessops/chess'
import { parseFen } from 'chessops/fen'
import { parsePgn } from 'chessops/pgn'
import type { NavigableManager } from '../types/navigableManager.js'
import { type ParsedMove, playAndRecord } from './chessManager.js'
import { getDestsFromFen, getTurnColorFromFen, tryMoveFromFen } from './chessHelpers.js'

export interface SidelineManager extends NavigableManager {
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
  /** Get the space-separated SAN string of all sideline moves */
  getMovesString: () => string
}

/**
 * Create a sideline manager for building and navigating a mutable move sequence.
 *
 * @param startFen - The FEN position where the sideline begins (the branch point)
 * @param existingMoves - Optional space-separated SAN moves to initialize the sideline
 */
export function createSidelineManager(
  startFen: string,
  existingMoves?: string
): SidelineManager {
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

  // If existing moves provided, replay them
  // Use parsePgn to handle move numbers, annotations, and comments robustly
  if (existingMoves && existingMoves.trim()) {
    const games = parsePgn(existingMoves)
    const sanMoves = games.length > 0
      ? [...games[0].moves.mainline()].map(n => n.san)
      : []

    for (const san of sanMoves) {
      const parsed = playAndRecord(chess, san)
      if (!parsed) {
        console.error(`Failed to parse sideline move: ${san}`)
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

    getTotalPlies: () => positions.length - 1, // Don't count initial position as a ply

    getDests: () => getDestsFromFen(positions[currentPly].fen),

    getTurnColor: () => getTurnColorFromFen(positions[currentPly].fen),

    tryMove: (from: string, to: string, promotion?: string) =>
      tryMoveFromFen(positions[currentPly].fen, from, to, promotion),

    appendMove: (san: string) => {
      // Truncate any moves after current position
      positions.length = currentPly + 1

      // Reconstruct Chess position from current FEN
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
    }
  }
}
