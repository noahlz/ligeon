import { DatabaseManager } from './gameDatabase.js'
import type { GameFilters, GameSearchResult, GameRow } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import { validateCollectionId, validateSearchFilters } from './validators.js'
import { logError } from '../config/logger.js'

/**
 * Search for games in a collection
 *
 * @param collectionId - ID of the collection to search
 * @param filters - Search filters
 * @returns Array of matching games
 */
export async function searchGames(
  collectionId: string,
  filters: GameFilters
): Promise<GameSearchResult[]> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'searchGames', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  const sanitizedFilters = validateSearchFilters(filters)

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.searchGames(sanitizedFilters, sanitizedFilters.limit ?? 1000)
  } catch (error) {
    logError('gameHandlers', 'searchGames', { collectionId, filters: sanitizedFilters }, error)
    return []
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
  gameId: number
): Promise<GameRow | null> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getGameMoves', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  // Validate gameId is a positive number
  if (!Number.isInteger(gameId) || gameId <= 0) {
    logError('gameHandlers', 'getGameMoves', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return null
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getGameWithMoves(gameId)
  } catch (error) {
    logError('gameHandlers', 'getGameMoves', { collectionId, gameId }, error)
    return null
  }
}

/**
 * Get total count of games in a collection
 *
 * @param collectionId - ID of the collection
 * @returns Number of games in the collection
 */
export async function getGameCount(collectionId: string): Promise<number> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getGameCount', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return 0
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getGameCount()
  } catch (error) {
    logError('gameHandlers', 'getGameCount', { collectionId }, error)
    return 0
  }
}

/**
 * Get date range (min/max) of games in a collection
 *
 * @param collectionId - ID of the collection
 * @returns Object with minDate and maxDate timestamps, or null if no games
 */
export async function getGameDateRange(
  collectionId: string
): Promise<{ minDate: number; maxDate: number } | null> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getGameDateRange', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getDateRange()
  } catch (error) {
    logError('gameHandlers', 'getGameDateRange', { collectionId }, error)
    return null
  }
}

/**
 * Get distinct years that have games in a collection
 *
 * @param collectionId - ID of the collection
 * @returns Array of years sorted ascending
 */
export async function getAvailableYears(collectionId: string): Promise<number[]> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getAvailableYears', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getAvailableYears()
  } catch (error) {
    logError('gameHandlers', 'getAvailableYears', { collectionId }, error)
    return []
  }
}
