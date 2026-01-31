import type { GameData as LibGameData } from '../../lib/types/game.js'

/**
 * Re-export shared GameData interface from lib
 */
export type GameData = LibGameData

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
 * Filters for searching games
 */
export interface GameFilters {
  player?: string
  white?: string
  black?: string
  event?: string
  dateFrom?: number | null
  dateTo?: number | null
  result?: number | null
  ecoCode?: string
  whiteEloMin?: number | null
  whiteEloMax?: number | null
  blackEloMin?: number | null
  blackEloMax?: number | null
  limit?: number
}

/**
 * Collection metadata
 */
export interface CollectionMetadata {
  id: string
  name: string
  gameCount: number
  createdAt: string
  lastModified: string
}
