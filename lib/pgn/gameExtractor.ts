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
  const white = headers.get('White') || 'Unknown'
  const black = headers.get('Black') || 'Unknown'

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

  // Count moves in mainline and build moves text
  let moveCount = 0
  const movesList: string[] = []
  let moveNumber = 1

  for (const node of game.moves.mainline()) {
    if (node.san) {
      moveCount++
      // Add move number before white's move
      if (moveCount % 2 === 1) {
        movesList.push(`${moveNumber}.`)
      }
      movesList.push(node.san)
      // Increment move number after black's move
      if (moveCount % 2 === 0) {
        moveNumber++
      }
    }
  }

  // Build moves text with result
  const moves = movesList.join(' ') + (movesList.length > 0 ? ' ' : '') + resultStr

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
