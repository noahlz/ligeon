import type { VariationData } from './types.js'
import { validateBranchPly, validateVariationMoves } from './validators.js'
import { logError } from '../config/logger.js'
import { getValidatedDb } from './handlerUtils.js'

const MODULE = 'variationHandlers'

/**
 * Get all variations for a game
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @returns Array of variation records
 */
export async function getVariations(
  collectionId: string,
  gameId: number
): Promise<VariationData[]> {
  const db = getValidatedDb(MODULE, 'getVariations', collectionId, gameId)
  if (!db) return []
  try {
    return db.getVariations(gameId)
  } catch (error) {
    logError(MODULE, 'getVariations', { collectionId, gameId }, error)
    return []
  }
}

/**
 * Check if adding a variation would exceed the per-game limit.
 * Limit: 1 variation per 6 full moves (12 plys) — prevents UI clutter while being generous for long games.
 * e.g. a 60-move game allows up to 10 variations; a 12-move game allows 2.
 * Variations may be at any ply positions (adjacency is fine).
 *
 * @param existingVariations - Current variations for the game
 * @param branchPly - The ply where we want to add a variation
 * @param moveCount - Total full moves in the game
 * @returns True if allowed, false if limit would be exceeded
 *
 * @visibleForTesting Exported for testing
 */
export function checkVariationLimit(existingVariations: VariationData[], branchPly: number, moveCount: number): boolean {
  const maxVariations = Math.max(1, Math.floor(moveCount / 6))

  // Exclude current branchPly (upsert case — updating shouldn't count against limit).
  const otherVariationCount = existingVariations.filter(s => s.branchPly !== branchPly).length

  return otherVariationCount < maxVariations
}

/**
 * Insert or update a variation
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param branchPly - Mainline ply where variation departs (1-based)
 * @param moves - Space-separated SAN moves
 * @returns The created/updated variation record or null if validation fails
 */
export async function upsertVariation(
  collectionId: string,
  gameId: number,
  branchPly: number,
  moves: string
): Promise<VariationData | null> {
  const db = getValidatedDb(MODULE, 'upsertVariation', collectionId, gameId)
  if (!db) return null

  if (!validateBranchPly(branchPly)) {
    logError(MODULE, 'upsertVariation', { branchPly, reason: 'invalid branch ply' }, new Error('Validation failed'))
    return null
  }

  if (!validateVariationMoves(moves)) {
    logError(MODULE, 'upsertVariation', { moves, reason: 'invalid moves string' }, new Error('Validation failed'))
    return null
  }

  try {
    // Look up game to get moveCount for limit check
    const game = db.getGameWithMoves(gameId)
    if (!game) {
      logError(MODULE, 'upsertVariation', { gameId, reason: 'game not found' }, new Error('Validation failed'))
      return null
    }

    const existingVariations = db.getVariations(gameId)
    if (!checkVariationLimit(existingVariations, branchPly, game.moveCount)) {
      logError(MODULE, 'upsertVariation', { gameId, branchPly, moveCount: game.moveCount, reason: 'variation limit exceeded' }, new Error('Validation failed'))
      return null
    }

    return db.upsertVariation(gameId, branchPly, moves.trim())
  } catch (error) {
    logError(MODULE, 'upsertVariation', { collectionId, gameId, branchPly }, error)
    return null
  }
}

/**
 * Delete a variation
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param branchPly - Mainline ply where variation departs
 * @returns Success indicator
 */
export async function deleteVariation(
  collectionId: string,
  gameId: number,
  branchPly: number
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteVariation', collectionId, gameId)
  if (!db) return { success: false }

  if (!validateBranchPly(branchPly)) {
    logError(MODULE, 'deleteVariation', { branchPly, reason: 'invalid branch ply' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteVariation(gameId, branchPly)
    return { success: true }
  } catch (error) {
    logError(MODULE, 'deleteVariation', { collectionId, gameId, branchPly }, error)
    return { success: false }
  }
}
