import type { Game, PgnNodeData } from 'chessops/pgn'
import type { GameData } from '../types/game.js'
import { convertResult } from '../converters/resultConverter.js'
import { pgnDateToYYYYMM } from '../converters/dateConverter.js'

/**
 * Extract game metadata and moves from a parsed PGN game
 */
export function extractGameData(game: Game<PgnNodeData>): GameData | null {
  const headers = game.headers

  // Extract result and validate
  const resultStr = headers.get('Result') || '*'
  const resultData = convertResult(resultStr)

  if (resultData.skip) {
    return null
  }

  // Extract player names (required fields)
  const whiteRaw = headers.get('White')
  const blackRaw = headers.get('Black')
  const white = (whiteRaw && whiteRaw !== '?') ? whiteRaw : 'Unknown'
  const black = (blackRaw && blackRaw !== '?') ? blackRaw : 'Unknown'

  // Reject games with both players unknown (malformed headers)
  if (white === 'Unknown' && black === 'Unknown') {
    return null
  }

  // Extract optional metadata
  const event = headers.get('Event') || null
  const dateStr = headers.get('Date')
  const date = pgnDateToYYYYMM(dateStr)
  const ecoCode = headers.get('ECO') || null
  const site = headers.get('Site') || null
  const round = headers.get('Round') || null

  // Parse ELO ratings
  const whiteEloStr = headers.get('WhiteElo')
  const blackEloStr = headers.get('BlackElo')
  const whiteElo = whiteEloStr ? parseInt(whiteEloStr) : null
  const blackElo = blackEloStr ? parseInt(blackEloStr) : null

  // Extract mainline SAN moves and build moves text with result
  const sanMoves = [...game.moves.mainline()].map(n => n.san)
  const moveCount = sanMoves.length
  const moves = sanMoves.join(' ') + (sanMoves.length > 0 ? ' ' : '') + resultStr

  return {
    white,
    black,
    event,
    date,
    result: resultData.numeric!,
    ecoCode,
    whiteElo: whiteElo && !isNaN(whiteElo) ? whiteElo : null,
    blackElo: blackElo && !isNaN(blackElo) ? blackElo : null,
    site,
    round,
    moveCount,
    moves,
  }
}
