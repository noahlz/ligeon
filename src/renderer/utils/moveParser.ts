import { parsePgn } from 'chessops/pgn'

export interface ParsedMoves {
  moves: string[]
  result: string | null
}

/**
 * Parses a raw moves string (e.g. "1. e4 c5 2. Nf3 d6 1-0") into individual
 * SAN moves and the game result. Returns empty moves and null result for
 * undefined, empty, or unparseable input.
 */
export function parseMoves(movesString: string | undefined): ParsedMoves {
  if (!movesString) return { moves: [], result: null }
  const games = parsePgn(movesString)
  if (games.length === 0) return { moves: [], result: null }
  const moves = [...games[0].moves.mainline()].map(n => n.san)
  const result = games[0].headers.get('Result') ?? null
  return { moves, result }
}
