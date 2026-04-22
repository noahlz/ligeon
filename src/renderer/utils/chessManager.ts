/**
 * ChessManager - read-only mainline game navigation.
 *
 * Parses a PGN move string and provides navigation through the game's mainline positions.
 * Immutable after creation - for interactive move-making, see VariationManager.
 *
 * Stores positions as FEN strings (not live Chess objects) for memory efficiency.
 * Legal move calculation (getDests, tryMove) reconstructs Chess positions on-demand
 * using shared helpers from chessHelpers.ts.
 */

import { Chess, castlingSide } from 'chessops/chess'
import { parseFen, makeFen, INITIAL_FEN } from 'chessops/fen'
import { parseSan } from 'chessops/san'
import { makeSquare, squareFile, squareRank } from 'chessops/util'

import type { NavigableManager } from '../types/navigableManager.js'
import type { MoveType } from '../types/moveTypes.js'
import { createNavigableMethods, type NavState } from './navigableHelpers.js'
import { parseMoves } from './moveParser.js'
import { showErrorToast } from './errorToast.js'

// Re-export MoveType for backward compatibility
export type { MoveType } from '../types/moveTypes.js'

export interface ChessManager extends NavigableManager {
  // NavigableManager methods inherited: getFen, getLastMove, getMoveType, goto, getCurrentPly, getTotalPlies
  next: () => boolean
  prev: () => boolean
  first: () => void
  last: () => void
  getDests: () => Map<string, string[]>
  getTurnColor: () => 'white' | 'black'
  tryMove: (from: string, to: string, promotion?: string) => string | null
  getMainlineSan: (ply: number) => string | undefined
  getFenAtPly: (ply: number) => string | undefined
}

export interface ParsedMove {
  san: string
  fen: string
  lastMove?: [string, string]
  type: MoveType
}

/**
 * Play a SAN move on a Chess position and record position metadata.
 * Returns null if the SAN is invalid or illegal.
 */
export function playAndRecord(chess: Chess, san: string): ParsedMove | null {
  const move = parseSan(chess, san)
  if (!move) return null

  // Standard chess PGN only contains normal moves (from → to), not drops
  // Validate that this is actually a NormalMove before casting
  if (!('from' in move && 'to' in move)) {
    console.error(`Unexpected move type (not a NormalMove): ${JSON.stringify(move)}`)
    return null
  }
  const normal = move
  const from = makeSquare(normal.from)

  // Detect castle via chessops API; detect capture from board state before the move
  const role = chess.board.getRole(normal.from)
  const castleSide = castlingSide(chess, normal)
  const isCastle = castleSide !== undefined
  const isCapture = chess.board.occupied.has(normal.to) ||
    (role === 'pawn' && squareFile(normal.from) !== squareFile(normal.to))

  // For castling, chessops uses king-captures-rook: normal.to is the rook square.
  // Compute the king's actual destination (g-file for kingside, c-file for queenside).
  let to = makeSquare(normal.to)
  if (isCastle) {
    const rank = squareRank(normal.from)
    to = makeSquare(rank * 8 + (castleSide === 'h' ? 6 : 2))
  }

  // Play move, then detect check/checkmate from resulting position
  chess.play(move)
  const isCheck = chess.isCheck() || chess.outcome()?.winner !== undefined
  const fen = makeFen(chess.toSetup())

  // Priority: check > castle > capture > move
  const type: MoveType = isCheck ? 'check' : isCastle ? 'castle' : isCapture ? 'capture' : 'move'

  return { san, fen, lastMove: [from, to], type }
}

/**
 * Create a chess manager for replaying and navigating through a game
 */
export function createChessManager(movesString: string): ChessManager {
  const state: NavState = { positions: [], currentPly: 0 }
  const { positions } = state

  const { moves: sanMoves } = parseMoves(movesString)

  // Initialize position
  const setupResult = parseFen(INITIAL_FEN)
  if (setupResult.isErr) {
    throw new Error('Failed to parse initial FEN')
  }

  const chess = Chess.fromSetup(setupResult.value).unwrap()

  // Add initial position
  positions.push({
    san: '',
    fen: INITIAL_FEN,
    lastMove: undefined,
    type: 'move'
  })

  // Replay each move, deriving all metadata from position state
  for (const san of sanMoves) {
    const parsed = playAndRecord(chess, san)
    if (!parsed) {
      console.error(`Failed to parse move: ${san}`)
      showErrorToast('Failed to load game: invalid move data')
      break
    }
    positions.push(parsed)
  }

  return {
    ...createNavigableMethods(state),

    next: () => {
      if (state.currentPly < positions.length - 1) {
        state.currentPly++
        return true
      }
      return false
    },

    prev: () => {
      if (state.currentPly > 0) {
        state.currentPly--
        return true
      }
      return false
    },

    first: () => {
      state.currentPly = 0
    },

    last: () => {
      state.currentPly = positions.length - 1
    },

    getMainlineSan: (ply: number) => {
      if (ply < 1 || ply >= positions.length) return undefined
      return positions[ply].san
    },

    getFenAtPly: (ply: number) => {
      if (ply < 0 || ply >= positions.length) return undefined
      return positions[ply].fen
    }
  }
}
