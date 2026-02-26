import path from 'path'
import fs from 'fs'
import type { CollectionMetadata } from './types.js'
import { getCollectionsPath } from '../config/paths.js'
import { DatabaseManager } from './gameDatabase.js'
import { validateCollectionId, validateCollectionName } from './validators.js'
import { logError, logAndThrow, logger } from '../config/logger.js'

/**
 * List all collections with their metadata
 *
 * @returns Array of collection metadata objects
 */
export function listCollections(): CollectionMetadata[] {
  logger.debug('Listing collections...')
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
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as CollectionMetadata
          collections.push(metadata)
        } catch (error) {
          logError('collectionHandlers', 'readMetadata', { metaPath, dir }, error)
        }
      }
    }
    return collections
  } catch (error) {
    logError('collectionHandlers', 'listCollections', { collectionsPath }, error)
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
export function renameCollection(
  collectionId: string,
  newName: string
): CollectionMetadata {
  // Validate inputs
  if (!validateCollectionId(collectionId)) {
    logAndThrow('collectionHandlers', 'renameCollection', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'), 'Invalid collection ID')
  }

  if (!validateCollectionName(newName)) {
    logAndThrow('collectionHandlers', 'renameCollection', { newName, reason: 'invalid collection name' }, new Error('Validation failed'), 'Invalid collection name')
  }

  const collectionsPath = getCollectionsPath()

  try {
    const metaPath = path.join(collectionsPath, collectionId, 'metadata.json')
    if (!fs.existsSync(metaPath)) {
      throw new Error('Collection not found')
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as CollectionMetadata
    metadata.name = newName.trim()
    metadata.lastModified = new Date().toISOString()

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    return metadata
  } catch (error) {
    logAndThrow('collectionHandlers', 'renameCollection', { collectionId, newName }, error, 'Failed to rename collection')
  }
}

/**
 * Delete a collection and all its data
 *
 * @param collectionId - ID of collection to delete
 * @returns Success flag
 */
export function deleteCollection(
  collectionId: string
): { success: boolean } {
  // Validate input
  if (!validateCollectionId(collectionId)) {
    logAndThrow('collectionHandlers', 'deleteCollection', { collectionId, reason: 'invalid collection ID' }, new Error('Validation failed'), 'Invalid collection ID')
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
    logAndThrow('collectionHandlers', 'deleteCollection', { collectionId }, error, 'Failed to delete collection')
  }
}
