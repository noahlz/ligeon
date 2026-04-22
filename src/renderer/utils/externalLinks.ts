import type { GameRow, CommentData, AnnotationData, VariationData } from '../../shared/types/game.js'
import { yyyymmddToPgnDate } from '../../shared/converters/dateConverter.js'
import { resultNumericToPgn } from '../../shared/converters/resultConverter.js'
import { getNagSymbol } from './nag.js'

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
 * Build PGN header lines from a GameRow.
 *
 * Always includes: Event, Site, Date, Round, White, Black, Result.
 * Includes if non-null: WhiteElo, BlackElo, ECO.
 */
function buildPgnHeaders(game: GameRow): string[] {
  const headers: string[] = []
  headers.push(`[Event "${game.event ?? '?'}"]`)
  headers.push(`[Site "${game.site ?? '?'}"]`)
  headers.push(`[Date "${yyyymmddToPgnDate(game.date)}"]`)
  headers.push(`[Round "${game.round ?? '?'}"]`)
  headers.push(`[White "${game.white}"]`)
  headers.push(`[Black "${game.black}"]`)
  headers.push(`[Result "${resultNumericToPgn(game.result)}"]`)
  if (game.whiteElo != null) headers.push(`[WhiteElo "${game.whiteElo}"]`)
  if (game.blackElo != null) headers.push(`[BlackElo "${game.blackElo}"]`)
  if (game.ecoCode != null) headers.push(`[ECO "${game.ecoCode}"]`)
  return headers
}

/**
 * Build a full PGN string with headers from a GameRow.
 *
 * @param game - GameRow with game metadata and moves
 * @returns Full PGN string with headers and movetext
 */
export function buildFullPgn(game: GameRow): string {
  return buildPgnHeaders(game).join('\n') + '\n\n' + game.moves
}

/**
 * Sanitize comment text for PGN: removes { } characters that break comment syntax.
 */
function sanitizeComment(text: string): string {
  return text.replace(/[{}]/g, '')
}

/**
 * Build a RAV (Recursive Annotation Variation) block for a single variation.
 *
 * Placed after the mainline move it replaces.
 * Format: ( moveNumber[.../. ] move ... [{ comment }] )
 * The variation-level comment is attached after the last move.
 *
 * @param variation - Variation to render
 * @param branchPly - 1-based ply where the variation starts (= variation.branchPly)
 * @param variationComments - Map of variationId → CommentData for variation-level comments
 */
function buildVariationRav(
  variation: VariationData,
  branchPly: number,
  variationComments: Map<number, CommentData>
): string {
  const varTokens = variation.moves.trim().split(/\s+/).filter(t => t.length > 0)
  if (varTokens.length === 0) return ''

  const varParts: string[] = []

  let varNeedsBlackMoveNumber = false
  for (let j = 0; j < varTokens.length; j++) {
    const varPly = branchPly + j
    const isVarWhite = varPly % 2 === 1
    const varMoveNumber = Math.ceil(varPly / 2)

    if (j === 0 || varNeedsBlackMoveNumber) {
      varParts.push(isVarWhite ? `${varMoveNumber}.` : `${varMoveNumber}...`)
    }

    varParts.push(varTokens[j])
    varNeedsBlackMoveNumber = false  // No per-move annotations inside variations
  }

  // Variation-level comment after the last move
  if (variation.id !== undefined) {
    const varComment = variationComments.get(variation.id)
    if (varComment) varParts.push(`{ ${sanitizeComment(varComment.text)} }`)
  }

  return `( ${varParts.join(' ')} )`
}

/**
 * Build a full annotated PGN string with headers, move numbers, NAG annotations,
 * comments, and variations.
 *
 * Produces standard PGN with symbolic annotation glyphs:
 *   1. e4! { Great move } 1... e5 ( 1... c5 2. Nf3 ) 2. Nf3 ...
 *
 * - NAG symbols (!, ?, □, ⩲, etc.) are concatenated directly onto the SAN token with no space.
 * - Comments are emitted as `{ text }` blocks after the move+NAG token.
 * - Variations are emitted as RAV blocks `( ... )` after the mainline move they replace.
 * - A black move number (`N...`) is inserted after any white move that had a comment
 *   or variation, to maintain unambiguous movetext per the PGN standard.
 *
 * @param game - GameRow with metadata and moves
 * @param comments - Mainline comments (variationId === null entries are used)
 * @param annotations - NAG annotations for mainline plies
 * @param variations - Variations attached to this game
 * @param variationComments - Map of variationId → CommentData for variation-level comments
 */
export function buildAnnotatedPgn(
  game: GameRow,
  comments: CommentData[],
  annotations: AnnotationData[],
  variations: VariationData[] = [],
  variationComments: Map<number, CommentData> = new Map()
): string {
  const headers = buildPgnHeaders(game)

  // Split stored moves: space-separated SAN tokens + trailing result token
  const tokens = game.moves.trim().split(/\s+/)
  const resultPattern = /^(1-0|0-1|1\/2-1\/2|\*)$/
  let resultStr = '*'
  let sanTokens: string[]
  if (tokens.length > 0 && resultPattern.test(tokens[tokens.length - 1])) {
    resultStr = tokens[tokens.length - 1]
    sanTokens = tokens.slice(0, -1)
  } else {
    sanTokens = tokens
  }

  // Ply-keyed lookup maps (1-based)
  const commentByPly = new Map<number, string>()
  for (const c of comments) {
    if (c.variationId === null) commentByPly.set(c.ply, c.text)
  }

  const nagsByPly = new Map<number, number[]>()
  for (const a of annotations) {
    const existing = nagsByPly.get(a.ply) ?? []
    existing.push(a.nag)
    nagsByPly.set(a.ply, existing)
  }

  const variationsByBranchPly = new Map<number, VariationData[]>()
  for (const v of variations) {
    const existing = variationsByBranchPly.get(v.branchPly) ?? []
    existing.push(v)
    variationsByBranchPly.set(v.branchPly, existing)
  }

  // Assemble movetext
  const parts: string[] = []
  let needBlackMoveNumber = false

  for (let i = 0; i < sanTokens.length; i++) {
    const ply = i + 1
    const isWhite = ply % 2 === 1
    const moveNumber = Math.ceil(ply / 2)

    if (isWhite) {
      parts.push(`${moveNumber}.`)
    } else if (needBlackMoveNumber) {
      parts.push(`${moveNumber}...`)
    }

    // NAG symbols concatenated directly onto the SAN token (no space): e4!, Nf3?, e5□
    const nags = nagsByPly.get(ply)
    const nagSuffix = nags && nags.length > 0
      ? nags.map(nag => getNagSymbol(nag) ?? `$${nag}`).join('')
      : ''
    parts.push(sanTokens[i] + nagSuffix)

    // Comment: { text } after the move+NAG token
    const commentText = commentByPly.get(ply)
    if (commentText) parts.push(`{ ${sanitizeComment(commentText)} }`)

    // Variations at this ply: RAV blocks after the mainline move they replace
    const variationsHere = variationsByBranchPly.get(ply) ?? []
    for (const variation of variationsHere) {
      const rav = buildVariationRav(variation, ply, variationComments)
      if (rav) parts.push(rav)
    }

    // Black needs a move number after white-move annotations (comment or RAVs)
    if (isWhite) {
      needBlackMoveNumber = commentText !== undefined || variationsHere.length > 0
    }
  }

  parts.push(resultStr)

  return headers.join('\n') + '\n\n' + parts.join(' ')
}
