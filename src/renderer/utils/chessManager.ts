import { Chess } from 'chessops/chess'
import { parseFen, makeFen, INITIAL_FEN } from 'chessops/fen'
import { parseSan } from 'chessops/san'

// TODO: Replace bespoke logic with chessops
// See: https://niklasf.github.io/chessops/modules.html

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
 * Parse SAN move string format like "1. e4 c5 2. Nf3 d6..."
 * Returns array of individual SAN moves without move numbers
 */
function parseMoveString(moves: string): string[] {
  // Remove move numbers (e.g., "1.", "2.", etc.)
  const cleaned = moves.replace(/\d+\./g, '')
  // Split on whitespace and filter empty strings
  return cleaned.split(/\s+/).filter(s => s.length > 0)
}

/**
 * Detect move type from SAN notation
 */
function detectMoveType(san: string): MoveType {
  // Check for castling
  if (san.includes('O-O')) {
    return 'castle'
  }
  // Check for check/checkmate (+ or #)
  if (san.includes('+') || san.includes('#')) {
    return 'check'
  }
  // Check for capture (x)
  if (san.includes('x')) {
    return 'capture'
  }
  return 'move'
}

/**
 * Convert square index (0-63) to algebraic notation (e.g., 0 -> "a1", 63 -> "h8")
 */
function squareToAlgebraic(square: number): string {
  const file = String.fromCharCode(97 + (square % 8)) // a-h
  const rank = Math.floor(square / 8) + 1 // 1-8
  return `${file}${rank}`
}

const GAME_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'] as const

/**
 * Check if a string is a game result
 */
export function isGameResult(str: string): boolean {
  return GAME_RESULTS.includes(str as any)
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
  const sanMoves = parseMoveString(movesString)
  const positions: ParsedMove[] = []
  let currentPly = 0

  // Build position tree by replaying all moves
  const setupResult = parseFen(INITIAL_FEN)
  if (setupResult.isErr) {
    throw new Error('Failed to parse initial FEN')
  }

  let chess = Chess.fromSetup(setupResult.value).unwrap()

  // Add initial position
  positions.push({
    san: '',
    fen: INITIAL_FEN,
    lastMove: undefined,
    type: 'move'
  })

  // Replay each move
  for (const san of sanMoves) {
    const move = parseSan(chess, san)
    if (!move) {
      console.error(`Failed to parse move: ${san}`)
      break
    }

    // Standard chess only has normal moves (from -> to), not drops
    // Type assertion is safe here as PGN only contains normal moves
    const from = squareToAlgebraic((move as any).from)
    const to = squareToAlgebraic((move as any).to)
    const moveType = detectMoveType(san)

    chess.play(move)
    const fen = makeFen(chess.toSetup())

    positions.push({
      san,
      fen,
      lastMove: [from, to],
      type: moveType
    })
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
