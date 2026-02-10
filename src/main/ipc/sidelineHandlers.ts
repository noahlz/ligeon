import { DatabaseManager } from './gameDatabase.js'
import type { SidelineData } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import { validateCollectionId, validateGameId, validateBranchPly, validateSidelineMoves } from './validators.js'
import { logError } from '../config/logger.js'

/**
 * Get all sidelines for a game
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @returns Array of sideline records
 */
export async function getSidelines(
  collectionId: string,
  gameId: number
): Promise<SidelineData[]> {
  if (!validateCollectionId(collectionId)) {
    logError('sidelineHandlers', 'getSidelines', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  if (!validateGameId(gameId)) {
    logError('sidelineHandlers', 'getSidelines', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return []
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getSidelines(gameId)
  } catch (error) {
    logError('sidelineHandlers', 'getSidelines', { collectionId, gameId }, error)
    return []
  }
}

/**
 * Check if adding a sideline at branchPly would violate the density limit
 * (one sideline per 12-ply bucket)
 *
 * @param existingSidelines - Array of existing sidelines for the game
 * @param branchPly - The ply where we want to add a sideline
 * @returns True if allowed, false if density limit violated
 *
 * @visibleForTesting Exported for testing density limit logic
 */
export function checkDensityLimit(existingSidelines: SidelineData[], branchPly: number): boolean {
  const bucket = Math.floor((branchPly - 1) / 12)

  for (const sideline of existingSidelines) {
    // Skip if this is the same branchPly (upsert case)
    if (sideline.branchPly === branchPly) continue

    const existingBucket = Math.floor((sideline.branchPly - 1) / 12)
    if (bucket === existingBucket) {
      return false // Density limit violated
    }
  }

  return true
}

/**
 * Insert or update a sideline
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param branchPly - Mainline ply where sideline departs (1-based)
 * @param moves - Space-separated SAN moves
 * @returns The created/updated sideline record or null if validation fails
 */
export async function upsertSideline(
  collectionId: string,
  gameId: number,
  branchPly: number,
  moves: string
): Promise<SidelineData | null> {
  if (!validateCollectionId(collectionId)) {
    logError('sidelineHandlers', 'upsertSideline', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateGameId(gameId)) {
    logError('sidelineHandlers', 'upsertSideline', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateBranchPly(branchPly)) {
    logError('sidelineHandlers', 'upsertSideline', { branchPly, reason: 'invalid branch ply' }, new Error('Validation failed'))
    return null
  }

  if (!validateSidelineMoves(moves)) {
    logError('sidelineHandlers', 'upsertSideline', { moves, reason: 'invalid moves string' }, new Error('Validation failed'))
    return null
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())

  try {
    // Check density limit
    const existingSidelines = db.getSidelines(gameId)
    if (!checkDensityLimit(existingSidelines, branchPly)) {
      logError('sidelineHandlers', 'upsertSideline', { gameId, branchPly, reason: 'density limit violated' }, new Error('Validation failed'))
      return null
    }

    return db.upsertSideline(gameId, branchPly, moves.trim())
  } catch (error) {
    logError('sidelineHandlers', 'upsertSideline', { collectionId, gameId, branchPly }, error)
    return null
  }
}

/**
 * Delete a sideline
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param branchPly - Mainline ply where sideline departs
 * @returns Success indicator
 */
export async function deleteSideline(
  collectionId: string,
  gameId: number,
  branchPly: number
): Promise<{ success: boolean }> {
  if (!validateCollectionId(collectionId)) {
    logError('sidelineHandlers', 'deleteSideline', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateGameId(gameId)) {
    logError('sidelineHandlers', 'deleteSideline', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateBranchPly(branchPly)) {
    logError('sidelineHandlers', 'deleteSideline', { branchPly, reason: 'invalid branch ply' }, new Error('Validation failed'))
    return { success: false }
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())

  try {
    db.deleteSideline(gameId, branchPly)
    return { success: true }
  } catch (error) {
    logError('sidelineHandlers', 'deleteSideline', { collectionId, gameId, branchPly }, error)
    return { success: false }
  }
}
