import { DatabaseManager } from './gameDatabase.js'
import type { CommentData } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import { validateCollectionId, validateGameId, validateCommentPly, validateCommentText, validateVariationId } from './validators.js'
import { logError } from '../config/logger.js'

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
  if (!validateCollectionId(collectionId)) {
    logError('commentHandlers', 'getComments', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return []
  }

  if (!validateGameId(gameId)) {
    logError('commentHandlers', 'getComments', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return []
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.getComments(gameId)
  } catch (error) {
    logError('commentHandlers', 'getComments', { collectionId, gameId }, error)
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
  if (!validateCollectionId(collectionId)) {
    logError('commentHandlers', 'upsertComment', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateGameId(gameId)) {
    logError('commentHandlers', 'upsertComment', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateCommentPly(ply)) {
    logError('commentHandlers', 'upsertComment', { ply, reason: 'invalid comment ply' }, new Error('Validation failed'))
    return null
  }

  if (!validateCommentText(text)) {
    logError('commentHandlers', 'upsertComment', { reason: 'invalid comment text' }, new Error('Validation failed'))
    return null
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.upsertComment(gameId, ply, text.trim())
  } catch (error) {
    logError('commentHandlers', 'upsertComment', { collectionId, gameId, ply }, error)
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
  if (!validateCollectionId(collectionId)) {
    logError('commentHandlers', 'upsertVariationComment', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateGameId(gameId)) {
    logError('commentHandlers', 'upsertVariationComment', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateVariationId(variationId)) {
    logError('commentHandlers', 'upsertVariationComment', { variationId, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return null
  }

  if (!validateCommentText(text)) {
    logError('commentHandlers', 'upsertVariationComment', { reason: 'invalid comment text' }, new Error('Validation failed'))
    return null
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    return db.upsertComment(gameId, 0, text.trim(), variationId)
  } catch (error) {
    logError('commentHandlers', 'upsertVariationComment', { collectionId, gameId, variationId }, error)
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
  if (!validateCollectionId(collectionId)) {
    logError('commentHandlers', 'deleteVariationComment', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateGameId(gameId)) {
    logError('commentHandlers', 'deleteVariationComment', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateVariationId(variationId)) {
    logError('commentHandlers', 'deleteVariationComment', { variationId, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return { success: false }
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    db.deleteComment(gameId, 0, variationId)
    return { success: true }
  } catch (error) {
    logError('commentHandlers', 'deleteVariationComment', { collectionId, gameId, variationId }, error)
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
  if (!validateCollectionId(collectionId)) {
    logError('commentHandlers', 'deleteComment', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateGameId(gameId)) {
    logError('commentHandlers', 'deleteComment', { gameId, reason: 'invalid game ID' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateCommentPly(ply)) {
    logError('commentHandlers', 'deleteComment', { ply, reason: 'invalid comment ply' }, new Error('Validation failed'))
    return { success: false }
  }

  const db = DatabaseManager.getInstance(collectionId, getCollectionsPath())
  try {
    db.deleteComment(gameId, ply)
    return { success: true }
  } catch (error) {
    logError('commentHandlers', 'deleteComment', { collectionId, gameId, ply }, error)
    return { success: false }
  }
}
