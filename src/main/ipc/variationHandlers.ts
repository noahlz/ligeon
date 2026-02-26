import type { VariationData } from './types.js'
import { validateBranchPly, validateVariationMoves, validateVariationId } from './validators.js'
import { logError, logAndThrow } from '../config/logger.js'
import { getValidatedDb } from './handlerUtils.js'
import { getCollectionsPath } from '../config/paths.js'

const MODULE = 'variationHandlers'

/**
 * Get all variations for a game
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @returns Array of variation records
 */
export function getVariations(
  collectionId: string,
  gameId: number,
  basePath: string = getCollectionsPath()
): VariationData[] {
  const db = getValidatedDb(MODULE, 'getVariations', collectionId, gameId, basePath)
  if (!db) return []
  try {
    return db.getVariations(gameId)
  } catch (error) {
    logError(MODULE, 'getVariations', { collectionId, gameId }, error)
    return []
  }
}

/**
 * Create a new variation
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param branchPly - Mainline ply where variation departs (1-based)
 * @param moves - Space-separated SAN moves
 * @returns The created variation record or null if validation fails
 */
export function createVariation(
  collectionId: string,
  gameId: number,
  branchPly: number,
  moves: string,
  basePath: string = getCollectionsPath()
): VariationData | null {
  const db = getValidatedDb(MODULE, 'createVariation', collectionId, gameId, basePath)
  if (!db) return null

  if (!validateBranchPly(branchPly)) {
    logError(MODULE, 'createVariation', { branchPly, reason: 'invalid branch ply' }, new Error('Validation failed'))
    return null
  }

  if (!validateVariationMoves(moves)) {
    logError(MODULE, 'createVariation', { moves, reason: 'invalid moves string' }, new Error('Validation failed'))
    return null
  }

  try {
    return db.createVariation(gameId, branchPly, moves.trim())
  } catch (error) {
    logAndThrow(MODULE, 'createVariation', { collectionId, gameId, branchPly }, error, 'Failed to save variation')
  }
}

/**
 * Update the moves of an existing variation
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param id - Variation database ID
 * @param moves - Space-separated SAN moves
 * @returns The updated variation record or null if validation fails
 */
export function updateVariation(
  collectionId: string,
  gameId: number,
  id: number,
  moves: string,
  basePath: string = getCollectionsPath()
): VariationData | null {
  const db = getValidatedDb(MODULE, 'updateVariation', collectionId, gameId, basePath)
  if (!db) return null

  if (!validateVariationId(id)) {
    logError(MODULE, 'updateVariation', { id, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateVariationMoves(moves)) {
    logError(MODULE, 'updateVariation', { moves, reason: 'invalid moves string' }, new Error('Validation failed'))
    return null
  }

  try {
    return db.updateVariation(id, moves.trim())
  } catch (error) {
    logAndThrow(MODULE, 'updateVariation', { collectionId, gameId, id }, error, 'Failed to save variation')
  }
}

/**
 * Delete a variation by id
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param id - Variation database ID
 * @returns Success indicator
 */
export function deleteVariation(
  collectionId: string,
  gameId: number,
  id: number,
  basePath: string = getCollectionsPath()
): { success: boolean } {
  const db = getValidatedDb(MODULE, 'deleteVariation', collectionId, gameId, basePath)
  if (!db) return { success: false }

  if (!validateVariationId(id)) {
    logError(MODULE, 'deleteVariation', { id, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteVariation(gameId, id)
    return { success: true }
  } catch (error) {
    logAndThrow(MODULE, 'deleteVariation', { collectionId, gameId, id }, error, 'Failed to delete variation')
  }
}

/**
 * Reorder variations within a ply group
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param branchPly - Ply group being reordered
 * @param orderedIds - Variation IDs in new display order
 * @returns Success indicator
 */
export function reorderVariations(
  collectionId: string,
  gameId: number,
  branchPly: number,
  orderedIds: number[],
  basePath: string = getCollectionsPath()
): { success: boolean } {
  const db = getValidatedDb(MODULE, 'reorderVariations', collectionId, gameId, basePath)
  if (!db) return { success: false }

  if (!validateBranchPly(branchPly)) {
    logError(MODULE, 'reorderVariations', { branchPly, reason: 'invalid branch ply' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!Array.isArray(orderedIds) || orderedIds.some(id => !validateVariationId(id))) {
    logError(MODULE, 'reorderVariations', { reason: 'invalid orderedIds' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.reorderVariations(gameId, branchPly, orderedIds)
    return { success: true }
  } catch (error) {
    logAndThrow(MODULE, 'reorderVariations', { collectionId, gameId, branchPly }, error, 'Failed to reorder variations')
  }
}
