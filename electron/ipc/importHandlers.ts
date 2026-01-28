import fs from 'fs'
import path from 'path'
import { WebContents } from 'electron'
import { parsePgn } from 'chessops/pgn'
import { GameDatabase } from './gameDatabase.js'
import type { GameData, CollectionMetadata } from './types.js'
import { extractGameData } from '../../lib/pgn/gameExtractor.js'

/**
 * Statistics for an import operation
 */
export interface ImportStats {
  totalParsed: number
  totalIndexed: number
  totalSkipped: number
  skippedReasons: {
    noResult: number
    invalidResult: number
    parseError: number
  }
  duration: number
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean
  cancelled: boolean
  error: string | null
  stats: ImportStats
}

/**
 * Progress information for an import operation
 */
export interface ImportProgress {
  parsed: number
  indexed: number
  skipped: number
}

const BATCH_SIZE = 1000
const PROGRESS_LOG_INTERVAL = 10000

/**
 * Import and index a PGN file into a collection database
 *
 * @param filePath - Path to the PGN file
 * @param collectionId - Unique identifier for the collection
 * @param collectionName - Display name for the collection
 * @param collectionsBasePath - Base directory for all collections
 * @param sender - WebContents for sending progress events
 * @param checkCancelled - Function to check if import has been cancelled
 * @returns Import result with statistics
 */
export async function importAndIndexPgn(
  filePath: string,
  collectionId: string,
  collectionName: string,
  collectionsBasePath: string,
  sender: WebContents | null,
  checkCancelled: () => boolean
): Promise<ImportResult> {
  const startTime = Date.now()

  const stats: ImportStats = {
    totalParsed: 0,
    totalIndexed: 0,
    totalSkipped: 0,
    skippedReasons: {
      noResult: 0,
      invalidResult: 0,
      parseError: 0,
    },
    duration: 0,
  }

  let db: GameDatabase | null = null

  try {
    // Read PGN file
    sendProgressLog(sender, 'info', `Reading PGN file: ${path.basename(filePath)}`)
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    // Initialize database
    db = new GameDatabase(collectionId, collectionsBasePath)
    db.createSchema()
    sendProgressLog(sender, 'info', 'Database initialized')

    // Parse and insert games in batches
    let batch: GameData[] = []
    let lastProgressLog = 0

    for (const game of parsePgn(fileContent)) {
      // Check for cancellation
      if (checkCancelled()) {
        sendProgressLog(sender, 'warning', 'Import cancelled by user')
        if (db) db.close()
        stats.duration = Date.now() - startTime
        return {
          success: false,
          cancelled: true,
          error: null,
          stats,
        }
      }

      stats.totalParsed++

      try {
        const gameData = extractGameData(game)

        if (gameData === null) {
          // Game was skipped due to invalid result
          stats.totalSkipped++
          stats.skippedReasons.invalidResult++

          const white = game.headers.get('White') || 'Unknown'
          const black = game.headers.get('Black') || 'Unknown'
          const result = game.headers.get('Result') || '*'
          sendProgressLog(
            sender,
            'debug',
            `Skipped game ${stats.totalParsed}: ${white} vs ${black} (result: ${result})`
          )
          continue
        }

        batch.push(gameData)

        // Insert batch when full
        if (batch.length >= BATCH_SIZE) {
          db.insertGamesBatch(batch)
          stats.totalIndexed += batch.length
          batch = []

          sendProgressUpdate(sender, {
            parsed: stats.totalParsed,
            indexed: stats.totalIndexed,
            skipped: stats.totalSkipped,
          })
        }

        // Log progress every N games
        if (stats.totalParsed - lastProgressLog >= PROGRESS_LOG_INTERVAL) {
          sendProgressLog(
            sender,
            'info',
            `Progress: ${stats.totalParsed} parsed, ${stats.totalIndexed} indexed, ${stats.totalSkipped} skipped`
          )
          lastProgressLog = stats.totalParsed
        }
      } catch (error) {
        stats.totalSkipped++
        stats.skippedReasons.parseError++
        sendProgressLog(
          sender,
          'error',
          `Parse error at game ${stats.totalParsed}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // Insert remaining games in final batch
    if (batch.length > 0) {
      db.insertGamesBatch(batch)
      stats.totalIndexed += batch.length
      sendProgressUpdate(sender, {
        parsed: stats.totalParsed,
        indexed: stats.totalIndexed,
        skipped: stats.totalSkipped,
      })
    }

    // Create collection metadata
    const collectionDir = path.join(collectionsBasePath, collectionId)
    const metadata: CollectionMetadata = {
      id: collectionId,
      name: collectionName,
      gameCount: stats.totalIndexed,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    fs.writeFileSync(
      path.join(collectionDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    )

    db.close()
    stats.duration = Date.now() - startTime

    sendProgressLog(
      sender,
      'success',
      `Import complete: ${stats.totalIndexed} games indexed in ${(stats.duration / 1000).toFixed(1)}s`
    )

    return {
      success: true,
      cancelled: false,
      error: null,
      stats,
    }
  } catch (error) {
    if (db) db.close()
    stats.duration = Date.now() - startTime

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    sendProgressLog(sender, 'error', `Import failed: ${errorMessage}`)

    return {
      success: false,
      cancelled: false,
      error: errorMessage,
      stats,
    }
  }
}

/**
 * Send progress update to renderer process
 */
function sendProgressUpdate(sender: WebContents | null, progress: ImportProgress): void {
  if (sender && !sender.isDestroyed()) {
    sender.send('import-progress', progress)
  }
}

/**
 * Send progress log message to renderer process
 */
function sendProgressLog(
  sender: WebContents | null,
  type: 'info' | 'success' | 'warning' | 'error' | 'debug',
  message: string
): void {
  if (sender && !sender.isDestroyed()) {
    sender.send('import-progress-log', {
      timestamp: new Date().toISOString(),
      type,
      message,
    })
  }

  // Also log to console for debugging
  const prefix = `[${type.toUpperCase()}]`
  console.log(`${prefix} ${message}`)
}
