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
export interface AppSettings {
  collectionsPath: string
  collectionsPathCustomized: boolean
}
