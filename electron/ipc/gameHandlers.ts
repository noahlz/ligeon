import { app } from 'electron'
import path from 'path'
import { GameDatabase } from './gameDatabase.js'
import type { GameFilters, GameSearchResult, GameRow } from './types.js'

/**
 * Get the base path for all collections
 * Uses ~/.ligeon/collections pattern from main.ts
 */
const getCollectionsPath = (): string => {
  return path.join(app.getPath('home'), '.ligeon', 'collections')
}

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
  console.log('Searching games:', collectionId, filters)
  const db = new GameDatabase(collectionId, getCollectionsPath())
  try {
    return db.searchGames(filters, filters.limit ?? 1000)
  } catch (error) {
    console.error('Error searching games:', error)
    return []
  } finally {
    db.close()
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
  console.log('Getting game:', collectionId, gameId)
  const db = new GameDatabase(collectionId, getCollectionsPath())
  try {
    return db.getGameWithMoves(gameId)
  } catch (error) {
    console.error('Error getting game:', error)
    return null
  } finally {
    db.close()
  }
}
