import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import type { CollectionMetadata } from './types'

/**
 * Get the base path for all collections
 * Uses ~/.ligeon/collections pattern from main.ts
 */
const getCollectionsPath = (): string => {
  return path.join(app.getPath('home'), '.ligeon', 'collections')
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
          console.warn('Error reading metadata:', metaPath, error)
        }
      }
    }
    return collections
  } catch (error) {
    console.error('Error listing collections:', error)
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
  console.log('Renaming collection:', collectionId, '→', newName)
  const collectionsPath = getCollectionsPath()

  try {
    const metaPath = path.join(collectionsPath, collectionId, 'metadata.json')
    if (!fs.existsSync(metaPath)) {
      throw new Error('Collection not found')
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    metadata.name = newName
    metadata.lastModified = new Date().toISOString()

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2))
    return metadata
  } catch (error) {
    console.error('Error renaming collection:', error)
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
  console.log('Deleting collection:', collectionId)
  const collectionsPath = getCollectionsPath()

  try {
    const collDir = path.join(collectionsPath, collectionId)
    if (!fs.existsSync(collDir)) {
      throw new Error('Collection not found')
    }

    fs.rmSync(collDir, { recursive: true, force: true })
    return { success: true }
  } catch (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}
