import type { CommentData } from './types.js'
import { validateCommentPly, validateCommentText, validateVariationId } from './validators.js'
import { logError } from '../config/logger.js'
import { getValidatedDb } from './handlerUtils.js'

const MODULE = 'commentHandlers'

/**
 * Get all mainline comments for a game
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @returns Array of comment records
 */
export async function getComments(
  collectionId: string,
  gameId: number
): Promise<CommentData[]> {
  const db = getValidatedDb(MODULE, 'getComments', collectionId, gameId)
  if (!db) return []
  try {
    return db.getComments(gameId)
  } catch (error) {
    logError(MODULE, 'getComments', { collectionId, gameId }, error)
    return []
  }
}

/**
 * Insert or update a comment on a mainline ply
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param ply - 1-based mainline ply
 * @param text - Comment text (max 500 chars)
 * @returns The created/updated comment record or null if validation fails
 */
export async function upsertComment(
  collectionId: string,
  gameId: number,
  ply: number,
  text: string
): Promise<CommentData | null> {
  const db = getValidatedDb(MODULE, 'upsertComment', collectionId, gameId)
  if (!db) return null

  if (!validateCommentPly(ply)) {
    logError(MODULE, 'upsertComment', { ply, reason: 'invalid comment ply' }, new Error('Validation failed'))
    return null
  }

  if (!validateCommentText(text)) {
    logError(MODULE, 'upsertComment', { reason: 'invalid comment text' }, new Error('Validation failed'))
    return null
  }

  try {
    return db.upsertComment(gameId, ply, text.trim())
  } catch (error) {
    logError(MODULE, 'upsertComment', { collectionId, gameId, ply }, error)
    return null
  }
}

/**
 * Insert or update a comment on a variation
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param variationId - Database ID of the variation
 * @param text - Comment text (max 500 chars)
 * @returns The created/updated comment record or null if validation fails
 */
export async function upsertVariationComment(
  collectionId: string,
  gameId: number,
  variationId: number,
  text: string
): Promise<CommentData | null> {
  const db = getValidatedDb(MODULE, 'upsertVariationComment', collectionId, gameId)
  if (!db) return null

  if (!validateVariationId(variationId)) {
    logError(MODULE, 'upsertVariationComment', { variationId, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateCommentText(text)) {
    logError(MODULE, 'upsertVariationComment', { reason: 'invalid comment text' }, new Error('Validation failed'))
    return null
  }

  try {
    return db.upsertComment(gameId, 0, text.trim(), variationId)
  } catch (error) {
    logError(MODULE, 'upsertVariationComment', { collectionId, gameId, variationId }, error)
    return null
  }
}

/**
 * Delete a comment from a variation
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param variationId - Database ID of the variation
 * @returns Success indicator
 */
export async function deleteVariationComment(
  collectionId: string,
  gameId: number,
  variationId: number
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteVariationComment', collectionId, gameId)
  if (!db) return { success: false }

  if (!validateVariationId(variationId)) {
    logError(MODULE, 'deleteVariationComment', { variationId, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteComment(gameId, 0, variationId)
    return { success: true }
  } catch (error) {
    logError(MODULE, 'deleteVariationComment', { collectionId, gameId, variationId }, error)
    return { success: false }
  }
}

/**
 * Delete a comment from a mainline ply
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param ply - 1-based mainline ply
 * @returns Success indicator
 */
export async function deleteComment(
  collectionId: string,
  gameId: number,
  ply: number
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteComment', collectionId, gameId)
  if (!db) return { success: false }

  if (!validateCommentPly(ply)) {
    logError(MODULE, 'deleteComment', { ply, reason: 'invalid comment ply' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteComment(gameId, ply)
    return { success: true }
  } catch (error) {
    logError(MODULE, 'deleteComment', { collectionId, gameId, ply }, error)
    return { success: false }
  }
}
