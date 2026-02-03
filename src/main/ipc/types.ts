import type { GameData, GameRow, GameSearchResult, AppSettings } from '../../shared/types/game.js'
export type { GameData, GameRow, GameSearchResult, AppSettings }

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
  ecoCodes?: string[]
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
