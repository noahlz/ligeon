import { DatabaseManager } from './gameDatabase.js'
import type { CommentData } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import { validateCollectionId, validateGameId, validateCommentPly, validateCommentText } from './validators.js'
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
