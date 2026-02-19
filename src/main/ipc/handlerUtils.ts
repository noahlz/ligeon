import { DatabaseManager, type GameDatabase } from './gameDatabase.js'
import { getCollectionsPath } from '../config/paths.js'
import { validateCollectionId, validateGameId } from './validators.js'
import { logError } from '../config/logger.js'

/**
 * Validate collectionId and gameId, then return a GameDatabase instance.
 * Returns null if validation fails (error is logged with the provided module/handler context).
 */
export function getValidatedDb(
  module: string,
  handler: string,
  collectionId: string,
  gameId: number,
  basePath: string = getCollectionsPath()
): GameDatabase | null {
  if (!validateCollectionId(collectionId)) {
    logError(module, handler, { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateGameId(gameId)) {
    logError(module, handler, { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return null
  }

  return DatabaseManager.getInstance(collectionId, basePath)
}
