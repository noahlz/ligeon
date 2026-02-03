import type {
  GameData as LibGameData,
  GameRow as LibGameRow,
  GameSearchResult as LibGameSearchResult,
  AppSettings as LibAppSettings,
} from '../../shared/types/game.js'

/**
 * Re-export shared types from lib (single source of truth)
 */
export type GameData = LibGameData
export type GameRow = LibGameRow
export type GameSearchResult = LibGameSearchResult
export type AppSettings = LibAppSettings

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
