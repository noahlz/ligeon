import type { AnnotationData } from './types.js'
import { validateCommentPly, validateNag } from './validators.js'
import { logError } from '../config/logger.js'
import { getValidatedDb } from './handlerUtils.js'

const MODULE = 'annotationHandlers'

/**
 * Get all annotations for a game
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @returns Array of annotation records
 */
export async function getAnnotations(
  collectionId: string,
  gameId: number
): Promise<AnnotationData[]> {
  const db = getValidatedDb(MODULE, 'getAnnotations', collectionId, gameId)
  if (!db) return []
  try {
    return db.getAnnotations(gameId)
  } catch (error) {
    logError(MODULE, 'getAnnotations', { collectionId, gameId }, error)
    return []
  }
}

/**
 * Insert or update an annotation on a mainline ply
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param ply - 1-based mainline ply
 * @param nag - NAG code
 * @returns The created/updated annotation record or null if validation fails
 */
export async function upsertAnnotation(
  collectionId: string,
  gameId: number,
  ply: number,
  nag: number
): Promise<AnnotationData | null> {
  const db = getValidatedDb(MODULE, 'upsertAnnotation', collectionId, gameId)
  if (!db) return null

  if (!validateCommentPly(ply)) {
    logError(MODULE, 'upsertAnnotation', { ply, reason: 'invalid annotation ply' }, new Error('Validation failed'))
    return null
  }

  if (!validateNag(nag)) {
    logError(MODULE, 'upsertAnnotation', { nag, reason: 'invalid NAG code' }, new Error('Validation failed'))
    return null
  }

  try {
    return db.upsertAnnotation(gameId, ply, nag)
  } catch (error) {
    logError(MODULE, 'upsertAnnotation', { collectionId, gameId, ply, nag }, error)
    return null
  }
}

/**
 * Delete an annotation from a mainline ply
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param ply - 1-based mainline ply
 * @returns Success indicator
 */
export async function deleteAnnotation(
  collectionId: string,
  gameId: number,
  ply: number
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteAnnotation', collectionId, gameId)
  if (!db) return { success: false }

  if (!validateCommentPly(ply)) {
    logError(MODULE, 'deleteAnnotation', { ply, reason: 'invalid annotation ply' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteAnnotation(gameId, ply)
    return { success: true }
  } catch (error) {
    logError(MODULE, 'deleteAnnotation', { collectionId, gameId, ply }, error)
    return { success: false }
  }
}
