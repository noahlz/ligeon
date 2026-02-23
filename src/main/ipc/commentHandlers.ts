// TODO: Add unit tests for this module.
// Pattern: identical to annotationHandlers — copy __tests__/unit/annotationHandlers.test.ts,
// replace annotation calls with comment equivalents (getComments, upsertComment,
// upsertVariationComment, deleteComment, deleteVariationComment).
// Cover: happy path CRUD, invalid collectionId/gameId, invalid ply/text validation.
import type { CommentData } from './types.js'
import { validateCommentPly, validateCommentText, validateVariationId } from './validators.js'
import { logError, logAndThrow } from '../config/logger.js'
import { getValidatedDb } from './handlerUtils.js'
import { getCollectionsPath } from '../config/paths.js'

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
  gameId: number,
  basePath: string = getCollectionsPath()
): Promise<CommentData[]> {
  const db = getValidatedDb(MODULE, 'getComments', collectionId, gameId, basePath)
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
  text: string,
  basePath: string = getCollectionsPath()
): Promise<CommentData | null> {
  const db = getValidatedDb(MODULE, 'upsertComment', collectionId, gameId, basePath)
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
    logAndThrow(MODULE, 'upsertComment', { collectionId, gameId, ply }, error, 'Failed to save comment')
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
  text: string,
  basePath: string = getCollectionsPath()
): Promise<CommentData | null> {
  const db = getValidatedDb(MODULE, 'upsertVariationComment', collectionId, gameId, basePath)
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
    logAndThrow(MODULE, 'upsertVariationComment', { collectionId, gameId, variationId }, error, 'Failed to save comment')
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
  variationId: number,
  basePath: string = getCollectionsPath()
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteVariationComment', collectionId, gameId, basePath)
  if (!db) return { success: false }

  if (!validateVariationId(variationId)) {
    logError(MODULE, 'deleteVariationComment', { variationId, reason: 'invalid variation ID' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteComment(gameId, 0, variationId)
    return { success: true }
  } catch (error) {
    logAndThrow(MODULE, 'deleteVariationComment', { collectionId, gameId, variationId }, error, 'Failed to delete comment')
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
  ply: number,
  basePath: string = getCollectionsPath()
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteComment', collectionId, gameId, basePath)
  if (!db) return { success: false }

  if (!validateCommentPly(ply)) {
    logError(MODULE, 'deleteComment', { ply, reason: 'invalid comment ply' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteComment(gameId, ply)
    return { success: true }
  } catch (error) {
    logAndThrow(MODULE, 'deleteComment', { collectionId, gameId, ply }, error, 'Failed to delete comment')
  }
}
