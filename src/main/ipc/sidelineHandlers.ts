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
 * Check if adding a sideline would exceed the per-game limit.
 * Limit: 1 sideline per 6 full moves (12 plys).
 * e.g. a 60-move game (120 plys) allows up to 10 sidelines.
 * Sidelines may be at any ply positions (adjacency is fine).
 *
 * @param existingSidelines - Current sidelines for the game
 * @param branchPly - The ply where we want to add a sideline
 * @param moveCount - Total full moves in the game
 * @returns True if allowed, false if limit would be exceeded
 *
 * @visibleForTesting Exported for testing
 */
export function checkSidelineLimit(existingSidelines: SidelineData[], branchPly: number, moveCount: number): boolean {
  const maxSidelines = Math.max(1, Math.floor(moveCount / 6))

  // Don't count existing sideline at same branchPly (upsert case)
  const currentCount = existingSidelines.filter(s => s.branchPly !== branchPly).length

  return currentCount < maxSidelines
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
    // Look up game to get moveCount for limit check
    const game = db.getGameWithMoves(gameId)
    if (!game) {
      logError('sidelineHandlers', 'upsertSideline', { gameId, reason: 'game not found' }, new Error('Validation failed'))
      return null
    }

    const existingSidelines = db.getSidelines(gameId)
    if (!checkSidelineLimit(existingSidelines, branchPly, game.moveCount)) {
      logError('sidelineHandlers', 'upsertSideline', { gameId, branchPly, moveCount: game.moveCount, reason: 'sideline limit exceeded' }, new Error('Validation failed'))
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
