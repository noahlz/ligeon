import type { AnnotationData } from './types.js'
import { validateCommentPly, validateNag } from './validators.js'
import { logError } from '../config/logger.js'
import { getValidatedDb } from './handlerUtils.js'
import { getCollectionsPath } from '../config/paths.js'

const MODULE = 'annotationHandlers'

/**
 * Get all annotations for a game
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param basePath - Base path for collections (defaults to app path; override in tests)
 * @returns Array of annotation records
 */
export async function getAnnotations(
  collectionId: string,
  gameId: number,
  basePath: string = getCollectionsPath()
): Promise<AnnotationData[]> {
  const db = getValidatedDb(MODULE, 'getAnnotations', collectionId, gameId, basePath)
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
 * @param basePath - Base path for collections (defaults to app path; override in tests)
 * @returns The created/updated annotation record or null if validation fails
 */
export async function upsertAnnotation(
  collectionId: string,
  gameId: number,
  ply: number,
  nag: number,
  basePath: string = getCollectionsPath()
): Promise<AnnotationData | null> {
  const db = getValidatedDb(MODULE, 'upsertAnnotation', collectionId, gameId, basePath)
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
 * Delete a specific annotation from a mainline ply
 *
 * @param collectionId - ID of the collection
 * @param gameId - Database ID of the game
 * @param ply - 1-based mainline ply
 * @param nag - NAG code to remove
 * @param basePath - Base path for collections (defaults to app path; override in tests)
 * @returns Success indicator
 */
export async function deleteAnnotation(
  collectionId: string,
  gameId: number,
  ply: number,
  nag: number,
  basePath: string = getCollectionsPath()
): Promise<{ success: boolean }> {
  const db = getValidatedDb(MODULE, 'deleteAnnotation', collectionId, gameId, basePath)
  if (!db) return { success: false }

  if (!validateCommentPly(ply)) {
    logError(MODULE, 'deleteAnnotation', { ply, reason: 'invalid annotation ply' }, new Error('Validation failed'))
    return { success: false }
  }

  if (!validateNag(nag)) {
    logError(MODULE, 'deleteAnnotation', { nag, reason: 'invalid NAG code' }, new Error('Validation failed'))
    return { success: false }
  }

  try {
    db.deleteAnnotation(gameId, ply, nag)
    return { success: true }
  } catch (error) {
    logError(MODULE, 'deleteAnnotation', { collectionId, gameId, ply, nag }, error)
    return { success: false }
  }
}
