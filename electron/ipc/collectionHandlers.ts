import path from 'path'
import fs from 'fs'
import type { CollectionMetadata } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import { DatabaseManager } from './gameDatabase.js'
import { validateCollectionId, validateCollectionName } from './validators.js'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Log structured error with context for debugging
 */
function logError(operation: string, context: Record<string, unknown>, error: unknown): void {
  const errorObj = {
    operation,
    ...context,
    error: error instanceof Error ? error.message : String(error),
    ...(isDev && error instanceof Error && { stack: error.stack }),
  }
  console.error('Collection handler failed:', errorObj)
}

/**
 * List all collections with their metadata
 *
 * @returns Array of collection metadata objects
 */
export async function listCollections(): Promise<CollectionMetadata[]> {
  console.log('Listing collections...')
  const collectionsPath = getCollectionsPath()

  try {
    if (!fs.existsSync(collectionsPath)) return []

    const dirs = fs.readdirSync(collectionsPath).filter((f) => {
      try {
        return fs.statSync(path.join(collectionsPath, f)).isDirectory()
      } catch {
        return false
      }
    })

    const collections: CollectionMetadata[] = []
    for (const dir of dirs) {
      const metaPath = path.join(collectionsPath, dir, 'metadata.json')
      if (fs.existsSync(metaPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
          collections.push(metadata)
        } catch (error) {
          logError('readMetadata', { metaPath, dir }, error)
        }
      }
    }
    return collections
  } catch (error) {
    logError('listCollections', { collectionsPath }, error)
    return []
  }
}

/**
 * Rename a collection
 *
 * @param collectionId - ID of collection to rename
 * @param newName - New name for the collection
 * @returns Updated collection metadata
 */
export async function renameCollection(
  collectionId: string,
  newName: string
): Promise<CollectionMetadata> {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    const error = new Error('Invalid collection ID')
    logError('renameCollection', { collectionId, reason: 'invalid collection ID' }, error)
    throw error
  }

  if (!validateCollectionName(newName)) {
    const error = new Error('Invalid collection name')
    logError('renameCollection', { newName, reason: 'invalid collection name' }, error)
    throw error
  }

  const collectionsPath = getCollectionsPath()

  try {
    const metaPath = path.join(collectionsPath, collectionId, 'metadata.json')
    if (!fs.existsSync(metaPath)) {
      throw new Error('Collection not found')
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    metadata.name = newName.trim()
    metadata.lastModified = new Date().toISOString()

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    return metadata
  } catch (error) {
    logError('renameCollection', { collectionId, newName }, error)
    throw error
  }
}

/**
 * Delete a collection and all its data
 *
 * @param collectionId - ID of collection to delete
 * @returns Success flag
 */
export async function deleteCollection(
  collectionId: string
): Promise<{ success: boolean }> {
  // Validate input
  if (!validateCollectionId(collectionId)) {
    const error = new Error('Invalid collection ID')
    logError('deleteCollection', { collectionId, reason: 'invalid collection ID' }, error)
    throw error
  }

  const collectionsPath = getCollectionsPath()

  try {
    const collDir = path.join(collectionsPath, collectionId)
    if (!fs.existsSync(collDir)) {
      throw new Error('Collection not found')
    }

    // Close database connection before deleting
    DatabaseManager.closeCollection(collectionId, collectionsPath)

    fs.rmSync(collDir, { recursive: true, force: true })
    return { success: true }
  } catch (error) {
    logError('deleteCollection', { collectionId }, error)
    throw error
  }
}
