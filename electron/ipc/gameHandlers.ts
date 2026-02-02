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
 * Get distinct dates (YYYYMM) that have games in a collection
 *
 * @param collectionId - ID of the collection
 * @returns Array of YYYYMM integers sorted ascending (e.g., [195601, 195603, 195712])
 */
export async function getAvailableDates(collectionId: string): Promise<number[]> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logError('gameHandlers', 'getAvailableDates', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getAvailableDates()
  } catch (error) {
    logError('gameHandlers', 'getAvailableDates', { collectionId }, error)
    return []
  }
}
