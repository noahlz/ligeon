import fs from 'fs'
import path from 'path'
import { WebContents } from 'electron'
import { PgnParser } from 'chessops/pgn'
import { DatabaseManager } from './gameDatabase.js'
import type { GameData, CollectionMetadata } from './types.js'
import { extractGameData } from '../../lib/pgn/gameExtractor.js'
import { validateCollectionId, validateFilePath, validateCollectionName } from './validators.js'
import { logger } from '../config/logger.js'

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

  // Validate inputs
  if (!validateFilePath(filePath)) {
    stats.duration = Date.now() - startTime
    return createValidationErrorResult(`Invalid file path: ${filePath}`, stats, sender)
  }

  if (!validateCollectionId(collectionId)) {
    stats.duration = Date.now() - startTime
    return createValidationErrorResult(`Invalid collection ID: ${collectionId}`, stats, sender)
  }

  if (!validateCollectionName(collectionName)) {
    stats.duration = Date.now() - startTime
    return createValidationErrorResult(`Invalid collection name: ${collectionName}`, stats, sender)
  }

  try {
    // Initialize database
    sendProgressLog(sender, 'info', `Reading PGN file: ${path.basename(filePath)}`)
    const db = DatabaseManager.getInstance(collectionId, collectionsBasePath)
    db.createSchema()
    sendProgressLog(sender, 'info', 'Database initialized')

    // Stream parse the PGN file
    return new Promise((resolve) => {
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
      let batch: GameData[] = []
      let lastProgressLog = 0
      let cancelled = false

      const parser = new PgnParser((game, err) => {
        if (checkCancelled()) {
          cancelled = true
          stream.destroy()
          sendProgressLog(sender, 'warning', 'Import cancelled by user')
          stats.duration = Date.now() - startTime
          resolve({
            success: false,
            cancelled: true,
            error: null,
            stats,
          })
          return
        }

        stats.totalParsed++

        // Handle parse error
        if (err) {
          stats.totalSkipped++
          stats.skippedReasons.parseError++
          const headerLines = Array.from(game.headers.entries())
            .map(([k, v]) => `[${k} "${v}"]`)
            .join('\n')
          sendProgressLog(
            sender,
            'error',
            `Parse error in game ${stats.totalParsed}:\n${headerLines}\nError: ${err.message}`
          )
          return
        }

        try {
          const gameData = extractGameData(game)

          if (gameData === null) {
            stats.totalSkipped++
            const whiteRaw = game.headers.get('White')
            const blackRaw = game.headers.get('Black')
            const isMalformed = (!whiteRaw || whiteRaw === '?') && (!blackRaw || blackRaw === '?')

            if (isMalformed) {
              stats.skippedReasons.parseError++
              const headerLines = Array.from(game.headers.entries())
                .map(([k, v]) => `[${k} "${v}"]`)
                .join('\n')
              sendProgressLog(
                sender,
                'error',
                `Skipped malformed game ${stats.totalParsed}:\n${headerLines}`
              )
            } else {
              stats.skippedReasons.invalidResult++
            }
            return
          }

          batch.push(gameData)

          if (batch.length >= BATCH_SIZE) {
            db.insertGamesBatch(batch)
            stats.totalIndexed += batch.length
            batch = []
            sendProgressUpdate(sender, { parsed: stats.totalParsed, indexed: stats.totalIndexed, skipped: stats.totalSkipped })
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
          sendProgressLog(sender, 'error', `Error processing game ${stats.totalParsed}: ${error}`)
        }
      })

      stream
        .on('data', (chunk: string | Buffer) => {
          const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8')
          parser.parse(text, { stream: true })
        })
        .on('error', (err) => {
          sendProgressLog(sender, 'error', `File read error: ${err.message}`)
          stats.duration = Date.now() - startTime
          resolve({ success: false, cancelled: false, error: err.message, stats })
        })
        .on('close', () => {
          // Don't process if already cancelled
          if (cancelled) return

          parser.parse('') // Flush remaining

          // Insert final batch
          if (batch.length > 0) {
            db.insertGamesBatch(batch)
            stats.totalIndexed += batch.length
            sendProgressUpdate(sender, { parsed: stats.totalParsed, indexed: stats.totalIndexed, skipped: stats.totalSkipped })
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

          stats.duration = Date.now() - startTime

          sendProgressLog(
            sender,
            'success',
            `Import complete: ${stats.totalIndexed} games indexed in ${(stats.duration / 1000).toFixed(1)}s`
          )

          resolve({
            success: true,
            cancelled: false,
            error: null,
            stats,
          })
        })
    })
  } catch (error) {
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

  // Also log to file for debugging
  const logLevel = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info'
  logger[logLevel](message, { importLog: true })
}

/**
 * Helper function to create validation error result
 */
function createValidationErrorResult(
  errorMsg: string,
  stats: ImportStats,
  sender: WebContents | null
): ImportResult {
  sendProgressLog(sender, 'error', errorMsg)
  return {
    success: false,
    cancelled: false,
    error: errorMsg,
    stats,
  }
}
