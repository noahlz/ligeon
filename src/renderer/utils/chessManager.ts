import { Chess } from 'chessops/chess'
import { parseFen, makeFen, INITIAL_FEN } from 'chessops/fen'
import { parseSan } from 'chessops/san'
import { parsePgn } from 'chessops/pgn'
import { makeSquare, squareFile } from 'chessops/util'
import type { NormalMove } from 'chessops/types'

export type MoveType = 'move' | 'capture' | 'check' | 'castle'

export interface ChessManager {
  getFen: () => string
  getLastMove: () => [string, string] | undefined
  getMoveType: (ply: number) => MoveType | undefined
  goto: (ply: number) => void
  next: () => boolean
  prev: () => boolean
  first: () => void
  last: () => void
  getCurrentPly: () => number
  getTotalPlies: () => number
}

interface ParsedMove {
  san: string
  fen: string
  lastMove?: [string, string]
  type: MoveType
}

/**
 * Get display text for a game result
 */
export function getResultDisplay(result: string): string {
  switch (result) {
    case '1-0':
      return '1-0 (White Wins)'
    case '0-1':
      return '0-1 (Black Wins)'
    case '1/2-1/2':
      return '1/2-1/2 (Draw)'
    case '*':
      return '* (Unfinished)'
    default:
      return result
  }
}

/**
 * Create a chess manager for replaying and navigating through a game
 */
export function createChessManager(movesString: string): ChessManager {
  const positions: ParsedMove[] = []
  let currentPly = 0

  // Parse moves using chessops PGN parser — handles move numbers, results, NAGs
  const games = parsePgn(movesString)
  const sanMoves = games.length > 0
    ? [...games[0].moves.mainline()].map(n => n.san)
    : []

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
    const move = parseSan(chess, san)
    if (!move) {
      console.error(`Failed to parse move: ${san}`)
      break
    }

    // Standard chess PGN only contains normal moves (from → to), not drops
    const normal = move as NormalMove
    const from = makeSquare(normal.from)
    const to = makeSquare(normal.to)

    // Detect castle and capture from pre-move position state
    const role = chess.board.getRole(normal.from)
    const isCastle = role === 'king' && chess.board[chess.turn].has(normal.to)
    const isCapture = chess.board.occupied.has(normal.to) ||
      (role === 'pawn' && squareFile(normal.from) !== squareFile(normal.to))

    // Play move, then detect check/checkmate from resulting position
    chess.play(move)
    const isCheck = chess.isCheck() || chess.outcome()?.winner !== undefined
    const fen = makeFen(chess.toSetup())

    // Priority: check > castle > capture > move
    const type: MoveType = isCheck ? 'check' : isCastle ? 'castle' : isCapture ? 'capture' : 'move'

    positions.push({ san, fen, lastMove: [from, to], type })
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

    next: () => {
      if (currentPly < positions.length - 1) {
        currentPly++
        return true
      }
      return false
    },

    prev: () => {
      if (currentPly > 0) {
        currentPly--
        return true
      }
      return false
    },

    first: () => {
      currentPly = 0
    },

    last: () => {
      currentPly = positions.length - 1
    },

    getCurrentPly: () => currentPly,

    getTotalPlies: () => positions.length - 1 // Don't count initial position as a ply
  }
}
