// TODO: Add unit tests for this module.
// Pattern: same DB test harness as __tests__/unit/database.test.ts — create an
// in-memory DB, seed it with games, then call searchGames/getGameMoves/getGameCount/
// getAvailableDates/getAvailableEcoCodes directly (no IPC layer needed).
// Cover: invalid collectionId returns empty/null, filter combinations, missing game ID.
import { DatabaseManager } from './gameDatabase.js'
import type { GameFilters, GameSearchResult, GameRow } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import type { OptionFilters } from './types.js'
import { validateCollectionId, validateSearchFilters, validateOptionFilters, validateGameId } from './validators.js'
import { logError, logAndThrow } from '../config/logger.js'

/**
 * Search for games in a collection
 *
 * @param collectionId - ID of the collection to search
 * @param filters - Search filters
 * @returns Array of matching games
 */
export async function searchGames(
  collectionId: string,
  filters: GameFilters,
  basePath: string = getCollectionsPath()
): Promise<GameSearchResult[]> {
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'searchGames', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  const sanitizedFilters = validateSearchFilters(filters)

  const db = DatabaseManager.getInstance(collectionId, basePath)
  try {
    return db.searchGames(sanitizedFilters, sanitizedFilters.limit ?? 1000)
  } catch (error) {
    logAndThrow('gameHandlers', 'searchGames', { collectionId, filters: sanitizedFilters }, error, 'Failed to load games')
  }
}

/**
 * Get a single game with full PGN data
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @returns Full game data or null
 */
export async function getGameMoves(
  collectionId: string,
  gameId: number,
  basePath: string = getCollectionsPath()
): Promise<GameRow | null> {
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getGameMoves', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateGameId(gameId)) {
    logError('gameHandlers', 'getGameMoves', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return null
  }

  const db = DatabaseManager.getInstance(collectionId, basePath)
  try {
    return db.getGameWithMoves(gameId)
  } catch (error) {
    logAndThrow('gameHandlers', 'getGameMoves', { collectionId, gameId }, error, 'Failed to open game')
  }
}

/**
 * Get total count of games in a collection
 *
 * @param collectionId - ID of the collection
 * @returns Number of games in the collection
 */
export async function getGameCount(collectionId: string, basePath: string = getCollectionsPath()): Promise<number> {
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getGameCount', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return 0
  }

  const db = DatabaseManager.getInstance(collectionId, basePath)
  try {
    return db.getGameCount()
  } catch (error) {
    logError('gameHandlers', 'getGameCount', { collectionId }, error)
    return 0
  }
}

/**
 * Get distinct dates (YYYYMMDD) that have games in a collection
 *
 * @param collectionId - ID of the collection
 * @returns Array of YYYYMMDD integers sorted ascending (e.g., [19560101, 19560315, 19571231])
 */
export async function getAvailableDates(collectionId: string, filters?: OptionFilters, basePath: string = getCollectionsPath()): Promise<number[]> {
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getAvailableDates', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  const sanitizedFilters = validateOptionFilters(filters)
  const db = DatabaseManager.getInstance(collectionId, basePath)
  try {
    return db.getAvailableDates(sanitizedFilters)
  } catch (error) {
    logAndThrow('gameHandlers', 'getAvailableDates', { collectionId }, error, 'Failed to load date filters')
  }
}

export async function getAvailableEcoCodes(collectionId: string, filters?: OptionFilters, basePath: string = getCollectionsPath()): Promise<{ eco: string; count: number }[]> {
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getAvailableEcoCodes', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  const sanitizedFilters = validateOptionFilters(filters)
  const db = DatabaseManager.getInstance(collectionId, basePath)

  try {
    return db.getAvailableEcoCodes(sanitizedFilters)
  } catch (error) {
    logAndThrow('gameHandlers', 'getAvailableEcoCodes', { collectionId }, error, 'Failed to load opening filters')
  }
}
