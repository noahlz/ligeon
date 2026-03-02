/**
 * Chess position helpers - wrappers around chessops for FEN-based operations.
 *
 * ChessManager and VariationManager store positions as FEN strings (not live Chess objects).
 * These helpers handle the FEN → Chess object → chessops API boilerplate, eliminating
 * duplication and providing error handling at each step.
 */

import { Chess } from 'chessops/chess'
import { parseFen } from 'chessops/fen'
import { makeSan } from 'chessops/san'
import { parseSquare } from 'chessops/util'
import { chessgroundDests } from 'chessops/compat'
import type { NormalMove, Role } from 'chessops/types'
import type { MoveType } from '../types/moveTypes.js'

/**
 * Parse a FEN string into a Chess position, returning null on any error.
 * Centralizes the parseFen → error check → Chess.fromSetup → error check pattern.
 */
function chessFromFen(fen: string): Chess | null {
  const setup = parseFen(fen)
  if (setup.isErr) { console.error('Failed to parse FEN:', fen, setup.error); return null }
  const pos = Chess.fromSetup(setup.value)
  if (pos.isErr) { console.error('Failed to create Chess from FEN:', fen, pos.error); return null }
  return pos.value
}

/**
 * Get legal move destinations from a FEN position for chessground.
 * Returns empty map if FEN is invalid.
 */
export function getDestsFromFen(fen: string): Map<string, string[]> {
  const pos = chessFromFen(fen)
  if (!pos) return new Map()
  return chessgroundDests(pos)
}

/**
 * Get the active player's color from a FEN position.
 * Uses chessops API instead of string parsing for robustness.
 */
export function getTurnColorFromFen(fen: string): 'white' | 'black' {
  const setup = parseFen(fen)
  if (setup.isErr) {
    console.error('Failed to parse FEN for getTurnColor:', fen, setup.error)
    return 'white' // Default to white on error
  }
  return setup.value.turn === 'black' ? 'black' : 'white'
}

/**
 * Validate a move from a FEN position and return its SAN notation.
 * Returns null if the move is illegal or squares are invalid.
 *
 * @param fen - The FEN position to validate the move from
 * @param from - Source square (e.g., 'e2')
 * @param to - Destination square (e.g., 'e4')
 * @param promotion - Optional promotion piece ('queen', 'rook', 'bishop', 'knight')
 */
export function tryMoveFromFen(
  fen: string,
  from: string,
  to: string,
  promotion?: string
): string | null {
  const pos = chessFromFen(fen)
  if (!pos) return null

  const fromSq = parseSquare(from)
  const toSq = parseSquare(to)
  if (fromSq === undefined || toSq === undefined) return null

  const move: NormalMove = {
    from: fromSq,
    to: toSq,
    promotion: promotion as Role | undefined,
  }

  if (!pos.isLegal(move)) return null
  return makeSan(pos, move)
}

/**
 * Determine which king is in check based on move type and turn color.
 * When a move gives check, the king in check is the color whose turn it is NOW (opposite of who moved).
 *
 * @param moveType - The type of the last move played
 * @param turnColor - Whose turn it is now (after the move)
 * @returns 'white' if white king is in check, 'black' if black king is in check, false otherwise
 */
export function getCheckColor(
  moveType: MoveType | undefined,
  turnColor: 'white' | 'black'
): 'white' | 'black' | false {
  return moveType === 'check' ? turnColor : false
}
