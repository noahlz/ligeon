/**
 * Game data structure for inserting into database
 */
export interface GameData {
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  ecoCode: string | null
  whiteElo: number | null
  blackElo: number | null
  site: string | null
  round: string | null
  moveCount: number
  moves: string
}

/**
 * Complete game record including database ID
 */
export interface GameRow extends GameData {
  id: number
}

/**
 * Game search result (subset of fields for list display)
 */
export interface GameSearchResult {
  id: number
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  whiteElo: number | null
  blackElo: number | null
  ecoCode: string | null
}

/**
 * Application settings
 */
export const BOARD_THEMES = ['brown', 'green', 'blue', 'purple', 'grey'] as const
export type BoardTheme = (typeof BOARD_THEMES)[number]

export const PIECE_SETS = ['cburnett', 'merida', 'alpha', 'companion', 'fresca', 'mpchess', 'xkcd'] as const
export type PieceSet = (typeof PIECE_SETS)[number]

export const APP_THEMES = ['dark', 'light', 'system'] as const
export type AppTheme = (typeof APP_THEMES)[number]

// null-style sentinel: "unlimited" stored as string in settings.json
export const GAME_LIST_LIMITS = [200, 500, 1000, 5000, 'unlimited'] as const
export type GameListLimit = (typeof GAME_LIST_LIMITS)[number]

/** Parse a string value (e.g. from a Select onChange) into a valid GameListLimit. */
export function parseGameListLimit(value: string): GameListLimit {
  if (value === 'unlimited') return 'unlimited'
  const n = parseInt(value, 10)
  return (GAME_LIST_LIMITS as ReadonlyArray<number | string>).includes(n)
    ? (n as GameListLimit)
    : 500
}

export interface AppSettings {
  collectionsPath: string
  collectionsPathCustomized: boolean
  boardTheme: BoardTheme
  pieceSet: PieceSet
  appTheme: AppTheme
  gameListLimit: GameListLimit
}

/**
 * Filters for narrowing available filter options (dates, openings)
 * based on currently active player/result filters.
 */
export interface OptionFilters {
  player?: string
  results?: number[]
  dateFrom?: number | null
  dateTo?: number | null
}

/**
 * Variation data structure
 */
export interface VariationData {
  id?: number           // DB auto-increment (undefined before first save)
  gameId: number        // FK to games.id
  branchPly: number     // mainline ply where variation departs (1-based)
  displayOrder?: number // 0-indexed position within ply group (for drag-to-reorder); undefined before first DB save
  moves: string         // space-separated SAN: "Nf3 d5 Bg5"
}

/**
 * Comment data structure.
 *
 * Two contexts:
 * - Mainline move comment: ply = 1-based mainline ply, variationId = null
 * - Variation comment: ply = 0, variationId = variation DB id
 */
export interface CommentData {
  id?: number               // DB auto-increment (undefined before first save)
  gameId: number            // FK to games.id
  ply: number               // 1-based mainline ply (0 for variation-level comments)
  variationId: number | null  // null for mainline comments, variation DB id for variation comments
  text: string              // comment text (max 500 chars)
}

/**
 * Annotation data structure.
 *
 * Stores a single NAG (Numeric Annotation Glyph) per mainline ply.
 * One annotation per (gameId, ply) enforced by unique index.
 */
export interface AnnotationData {
  id?: number     // DB auto-increment (undefined before first save)
  gameId: number  // FK to games.id
  ply: number     // 1-based mainline ply
  nag: number     // NAG code (e.g. 1=!, 2=?, 3=!!, 4=??, 5=!?, 6=?!)
}
