import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { GameData, GameRow, GameSearchResult, GameFilters } from './types.js'
import { GAMES_SCHEMA_SQL } from '../../lib/database/schema.js'
import { logError, logger } from '../config/logger.js'

/**
 * SQLite database wrapper for managing chess games in a collection
 */
export class GameDatabase {
  private db: Database.Database
  private collectionDir: string
  private dbPath: string

  /**
   * Create or open a game database for a collection
   *
   * @param collectionId - Unique identifier for the collection
   * @param collectionsBasePath - Base path for all collections (injectable for testing)
   */
  constructor(collectionId: string, collectionsBasePath: string) {
    this.collectionDir = path.join(collectionsBasePath, collectionId)
    this.dbPath = path.join(this.collectionDir, 'games.db')

    if (!fs.existsSync(this.collectionDir)) {
      fs.mkdirSync(this.collectionDir, { recursive: true })
    }

    try {
      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL')
    } catch (error) {
      logError('GameDatabase', 'constructor', { dbPath: this.dbPath, collectionDir: this.collectionDir }, error)
      throw error
    }
  }

  /**
   * Create database schema with games table and indices
   */
  createSchema(): void {
    this.db.exec(GAMES_SCHEMA_SQL)
    logger.info('✓ Database schema created')
  }

  /**
   * Insert a single game
   *
   * @param gameData - Game data to insert
   * @returns SQLite run result
   */
  insertGame(gameData: GameData): Database.RunResult {
    const stmt = this.db.prepare(`
      INSERT INTO games (white, black, event, dateYYYYMM, result, ecoCode, whiteElo, blackElo, site, round, moveCount, moves)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(
      gameData.white,
      gameData.black,
      gameData.event,
      gameData.date,
      gameData.result,
      gameData.ecoCode,
      gameData.whiteElo,
      gameData.blackElo,
      gameData.site,
      gameData.round,
      gameData.moveCount,
      gameData.moves
    )
  }

  /**
   * Insert multiple games in a transaction
   *
   * @param games - Array of games to insert
   */
  insertGamesBatch(games: GameData[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO games (white, black, event, dateYYYYMM, result, ecoCode, whiteElo, blackElo, site, round, moveCount, moves)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertMany = this.db.transaction((games: GameData[]) => {
      for (const game of games) {
        stmt.run(
          game.white,
          game.black,
          game.event,
          game.date,
          game.result,
          game.ecoCode,
          game.whiteElo,
          game.blackElo,
          game.site,
          game.round,
          game.moveCount,
          game.moves
        )
      }
    })
    insertMany(games)
  }

  /**
   * Search for games matching filters
   *
   * @param filters - Search filters
   * @param limit - Maximum number of results (default: 1000)
   * @returns Array of matching games
   */
  searchGames(filters: GameFilters, limit = 1000): GameSearchResult[] {
    const startTime = Date.now()
    let query = 'SELECT id, white, black, event, dateYYYYMM as date, result, whiteElo, blackElo, ecoCode FROM games WHERE 1=1'
    const params: any[] = []

    if (filters.player) {
      query += ' AND (white LIKE ? OR black LIKE ?)'
      params.push(`%${filters.player}%`, `%${filters.player}%`)
    }
    if (filters.white) {
      query += ' AND white LIKE ?'
      params.push(`%${filters.white}%`)
    }
    if (filters.black) {
      query += ' AND black LIKE ?'
      params.push(`%${filters.black}%`)
    }
    if (filters.event) {
      query += ' AND event LIKE ?'
      params.push(`%${filters.event}%`)
    }
    if (filters.dateFrom !== null && filters.dateFrom !== undefined) {
      query += ' AND (dateYYYYMM IS NULL OR dateYYYYMM >= ?)'
      params.push(filters.dateFrom)
    }
    if (filters.dateTo !== null && filters.dateTo !== undefined) {
      query += ' AND (dateYYYYMM IS NULL OR dateYYYYMM <= ?)'
      params.push(filters.dateTo)
    }
    if (filters.result !== null && filters.result !== undefined) {
      query += ' AND result = ?'
      params.push(filters.result)
    }
    if (filters.ecoCode) {
      query += ' AND ecoCode = ?'
      params.push(filters.ecoCode)
    }
    if (filters.whiteEloMin !== null && filters.whiteEloMin !== undefined) {
      query += ' AND whiteElo >= ?'
      params.push(filters.whiteEloMin)
    }
    if (filters.whiteEloMax !== null && filters.whiteEloMax !== undefined) {
      query += ' AND whiteElo <= ?'
      params.push(filters.whiteEloMax)
    }
    if (filters.blackEloMin !== null && filters.blackEloMin !== undefined) {
      query += ' AND blackElo >= ?'
      params.push(filters.blackEloMin)
    }
    if (filters.blackEloMax !== null && filters.blackEloMax !== undefined) {
      query += ' AND blackElo <= ?'
      params.push(filters.blackEloMax)
    }

    query += ' LIMIT ?'
    params.push(limit)

    try {
      const stmt = this.db.prepare(query)
      const results = stmt.all(...params) as GameSearchResult[]

      const duration = Date.now() - startTime
      if (duration > 1000) {
        logger.warn(`Slow query detected (${duration}ms):`, { filters, limit, resultCount: results.length })
      }

      return results
    } catch (error) {
      logError('GameDatabase', 'searchGames', { dbPath: this.dbPath, filters, limit }, error)
      return []
    }
  }

  /**
   * Get a single game with full PGN data
   *
   * @param gameId - Database ID of the game
   * @returns Full game record or null
   */
  getGameWithMoves(gameId: number): GameRow | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?')
      return stmt.get(gameId) as GameRow | undefined ?? null
    } catch (error) {
      logError('GameDatabase', 'getGameWithMoves', { dbPath: this.dbPath, gameId }, error)
      return null
    }
  }

  /**
   * Get total count of games in the database
   *
   * @returns Number of games
   */
  getGameCount(): number {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM games')
      const result = stmt.get() as { count: number }
      return result.count
    } catch (error) {
      logError('GameDatabase', 'getGameCount', { dbPath: this.dbPath }, error)
      return 0
    }
  }

  /**
   * Get distinct dates (YYYYMM) that have games in the database
   *
   * @returns Array of YYYYMM integers sorted ascending (e.g., [195601, 195603, 195712])
   */
  getAvailableDates(): number[] {
    try {
      const stmt = this.db.prepare(`
        SELECT DISTINCT dateYYYYMM
        FROM games
        WHERE dateYYYYMM IS NOT NULL
        ORDER BY dateYYYYMM ASC
      `)
      const results = stmt.all() as { dateYYYYMM: number }[]
      return results.map((r) => r.dateYYYYMM)
    } catch (error) {
      logError('GameDatabase', 'getAvailableDates', { dbPath: this.dbPath }, error)
      return []
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    try {
      if (this.db) this.db.close()
    } catch (error) {
      logError('GameDatabase', 'close', { dbPath: this.dbPath }, error)
    }
  }

  /**
   * Delete all games from the database
   */
  clearGames(): void {
    try {
      this.db.prepare('DELETE FROM games').run()
      logger.info('✓ Cleared all games')
    } catch (error) {
      logError('GameDatabase', 'clearGames', { dbPath: this.dbPath }, error)
    }
  }
}

/**
 * Singleton manager for GameDatabase instances
 * Maintains one database connection per collection to prevent connection conflicts
 */
export class DatabaseManager {
  private static instances: Map<string, GameDatabase> = new Map()

  /**
   * Get or create a GameDatabase instance for a collection
   *
   * @param collectionId - Unique identifier for the collection
   * @param basePath - Base path for all collections
   * @returns Singleton GameDatabase instance for this collection
   */
  static getInstance(collectionId: string, basePath: string): GameDatabase {
    const key = `${collectionId}@${basePath}`

    if (!this.instances.has(key)) {
      const db = new GameDatabase(collectionId, basePath)
      this.instances.set(key, db)
      logger.info(`✓ Created database instance for collection: ${collectionId}`)
    }

    return this.instances.get(key)!
  }

  /**
   * Close and remove database instance for a collection
   * Use this when deleting a collection or during cleanup
   *
   * @param collectionId - Unique identifier for the collection
   * @param basePath - Base path for all collections
   */
  static closeCollection(collectionId: string, basePath: string): void {
    const key = `${collectionId}@${basePath}`
    const db = this.instances.get(key)

    if (db) {
      db.close()
      this.instances.delete(key)
      logger.info(`✓ Closed database instance for collection: ${collectionId}`)
    }
  }

  /**
   * Close all database connections
   * Use this during application shutdown
   */
  static closeAll(): void {
    for (const [key, db] of this.instances.entries()) {
      db.close()
      logger.info(`✓ Closed database instance: ${key}`)
    }
    this.instances.clear()
  }
}
