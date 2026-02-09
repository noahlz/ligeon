import type { GameRow } from '../../shared/types/game.js'
import { yyyymmddToPgnDate } from '../../shared/converters/dateConverter.js'
import { resultNumericToPgn } from '../../shared/converters/resultConverter.js'

/**
 * Build a Lichess URL for analyzing a PGN
 *
 * @param pgn - PGN text to analyze on Lichess
 * @returns Lichess paste URL with encoded PGN
 *
 * @example
 * buildLichessURL('1. e4 e5')
 * // => 'https://lichess.org/paste?pgn=1.%20e4%20e5'
 */
export function buildLichessURL(pgn: string): string {
  const encoded = encodeURIComponent(pgn)
  return `https://lichess.org/paste?pgn=${encoded}`
}

/**
 * Build a Lichess URL for analyzing a specific position
 *
 * @param fen - FEN string of the position to analyze
 * @returns Lichess analysis URL with encoded FEN
 *
 * @example
 * buildLichessAnalysisURL('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
 * // => 'https://lichess.org/analysis/rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR%20b%20KQkq%20-%200%201'
 */
export function buildLichessAnalysisURL(fen: string): string {
  const encoded = fen.replace(/ /g, '_')
  return `https://lichess.org/analysis/${encoded}`
}

/**
 * Build a full PGN string with headers from a GameRow
 *
 * Always includes: Event, Site, Date, Round, White, Black, Result
 * Includes if non-null: WhiteElo, BlackElo, ECO
 *
 * @param game - GameRow with game metadata and moves
 * @returns Full PGN string with headers and movetext
 */
export function buildFullPgn(game: GameRow): string {
  const headers: string[] = []

  headers.push(`[Event "${game.event ?? '?'}"]`)
  headers.push(`[Site "${game.site ?? '?'}"]`)
  headers.push(`[Date "${yyyymmddToPgnDate(game.date)}"]`)
  headers.push(`[Round "${game.round ?? '?'}"]`)
  headers.push(`[White "${game.white}"]`)
  headers.push(`[Black "${game.black}"]`)
  headers.push(`[Result "${resultNumericToPgn(game.result)}"]`)

  if (game.whiteElo != null) {
    headers.push(`[WhiteElo "${game.whiteElo}"]`)
  }
  if (game.blackElo != null) {
    headers.push(`[BlackElo "${game.blackElo}"]`)
  }
  if (game.ecoCode != null) {
    headers.push(`[ECO "${game.ecoCode}"]`)
  }

  return headers.join('\n') + '\n\n' + game.moves
}
