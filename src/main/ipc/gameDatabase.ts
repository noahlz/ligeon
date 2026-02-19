import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { GameData, GameRow, GameSearchResult, GameFilters, OptionFilters, VariationData, CommentData } from './types.js'
import { GAMES_SCHEMA_SQL, VARIATIONS_SCHEMA_SQL, COMMENTS_SCHEMA_SQL } from '../../shared/database/schema.js'
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
      this.db.pragma('foreign_keys = ON')
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
    this.db.exec(VARIATIONS_SCHEMA_SQL)
    this.db.exec(COMMENTS_SCHEMA_SQL)
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
      INSERT INTO games (white, black, event, dateYYYYMMDD, result, ecoCode, whiteElo, blackElo, site, round, moveCount, moves)
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
      INSERT INTO games (white, black, event, dateYYYYMMDD, result, ecoCode, whiteElo, blackElo, site, round, moveCount, moves)
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
    let query = 'SELECT id, white, black, event, dateYYYYMMDD as date, result, whiteElo, blackElo, ecoCode FROM games WHERE 1=1'
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
    if (filters.dateFrom != null && filters.dateTo != null) {
        query += ' AND dateYYYYMMDD BETWEEN ? AND ?';
        params.push(filters.dateFrom, filters.dateTo);
    } else {
      if (filters.dateFrom != null) {
          query += ' AND (dateYYYYMMDD IS NULL OR dateYYYYMMDD >= ?)';
          params.push(filters.dateFrom);
      }
      if (filters.dateTo != null) {
          query += ' AND (dateYYYYMMDD IS NULL OR dateYYYYMMDD <= ?)';
          params.push(filters.dateTo);
      }
    }
    if (filters.results && filters.results.length > 0) {
      const placeholders = filters.results.map(() => '?').join(',')
      query += ` AND result IN (${placeholders})`
      params.push(...filters.results)
    }
    if (filters.ecoCodes && filters.ecoCodes.length > 0) {
      const placeholders = filters.ecoCodes.map(() => '?').join(',')
      query += ` AND ecoCode IN (${placeholders})`
      params.push(...filters.ecoCodes)
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

    query += ' ORDER BY dateYYYYMMDD, white, black LIMIT ?'
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
      const stmt = this.db.prepare('SELECT id, white, black, event, dateYYYYMMDD as date, result, ecoCode, whiteElo, blackElo, site, round, moveCount, moves FROM games WHERE id = ?')
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
   * Get distinct dates (YYYYMMDD) that have games in the database
   *
   * @returns Array of YYYYMMDD integers sorted ascending (e.g., [19560101, 19560315, 19571231])
   */
  getAvailableDates(filters?: OptionFilters): number[] {
    try {
      let query = 'SELECT DISTINCT dateYYYYMMDD FROM games WHERE dateYYYYMMDD IS NOT NULL'
      const params: any[] = []

      if (filters?.player) {
        query += ' AND (white LIKE ? OR black LIKE ?)'
        params.push(`%${filters.player}%`, `%${filters.player}%`)
      }
      if (filters?.results && filters.results.length > 0) {
        query += ` AND result IN (${filters.results.map(() => '?').join(',')})`
        params.push(...filters.results)
      }

      query += ' ORDER BY dateYYYYMMDD ASC'
      const stmt = this.db.prepare(query)
      const results = stmt.all(...params) as { dateYYYYMMDD: number }[]
      return results.map((r) => r.dateYYYYMMDD)
    } catch (error) {
      logError('GameDatabase', 'getAvailableDates', { dbPath: this.dbPath }, error)
      return []
    }
  }

  /**
   * Get distinct ECO codes with game counts.
   * @returns  Array of ECO codes with counts, sorted ascending (e.g., [{eco: 'A00', count: 5}, ...])
   */
  getAvailableEcoCodes(filters?: OptionFilters): { eco: string; count: number }[] {
    try {
      let query = `SELECT ecoCode, COUNT(*) as count FROM games WHERE ecoCode IS NOT NULL AND ecoCode != ''`
      const params: any[] = []

      if (filters?.player) {
        query += ' AND (white LIKE ? OR black LIKE ?)'
        params.push(`%${filters.player}%`, `%${filters.player}%`)
      }
      if (filters?.results && filters.results.length > 0) {
        query += ` AND result IN (${filters.results.map(() => '?').join(',')})`
        params.push(...filters.results)
      }
      if (filters?.dateFrom != null) {
        query += ' AND (dateYYYYMMDD IS NULL OR dateYYYYMMDD >= ?)'
        params.push(filters.dateFrom)
      }
      if (filters?.dateTo != null) {
        query += ' AND (dateYYYYMMDD IS NULL OR dateYYYYMMDD <= ?)'
        params.push(filters.dateTo)
      }

      query += ' GROUP BY ecoCode ORDER BY ecoCode ASC'
      const stmt = this.db.prepare(query)
      const results = stmt.all(...params) as { ecoCode: string; count: number }[]
      return results.map((r) => ({ eco: r.ecoCode, count: r.count }))
    } catch (error) {
      logError('GameDatabase', 'getAvailableEcoCodes', { dbPath: this.dbPath }, error)
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

  /**
   * Get all variations for a game
   *
   * @param gameId - Database ID of the game
   * @returns Array of variation records ordered by branchPly
   */
  getVariations(gameId: number): VariationData[] {
    try {
      const stmt = this.db.prepare('SELECT id, gameId, branchPly, moves FROM variations WHERE gameId = ? ORDER BY branchPly')
      return stmt.all(gameId) as VariationData[]
    } catch (error) {
      logError('GameDatabase', 'getVariations', { dbPath: this.dbPath, gameId }, error)
      return []
    }
  }

  /**
   * Insert or update a variation
   *
   * @param gameId - Database ID of the game
   * @param branchPly - Mainline ply where variation departs (1-based)
   * @param moves - Space-separated SAN moves
   * @returns The created/updated variation record
   */
  upsertVariation(gameId: number, branchPly: number, moves: string): VariationData {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO variations (gameId, branchPly, moves)
        VALUES (?, ?, ?)
        ON CONFLICT(gameId, branchPly) DO UPDATE SET moves = excluded.moves
        RETURNING id, gameId, branchPly, moves
      `)
      const result = stmt.get(gameId, branchPly, moves) as VariationData
      return result
    } catch (error) {
      logError('GameDatabase', 'upsertVariation', { dbPath: this.dbPath, gameId, branchPly }, error)
      throw error
    }
  }

  /**
   * Delete a variation
   *
   * @param gameId - Database ID of the game
   * @param branchPly - Mainline ply where variation departs
   */
  deleteVariation(gameId: number, branchPly: number): void {
    try {
      this.db.prepare('DELETE FROM variations WHERE gameId = ? AND branchPly = ?').run(gameId, branchPly)
    } catch (error) {
      logError('GameDatabase', 'deleteVariation', { dbPath: this.dbPath, gameId, branchPly }, error)
      throw error
    }
  }

  /**
   * Get all mainline comments for a game (variationId = 0), ordered by ply.
   *
   * @param gameId - Database ID of the game
   * @returns Array of comment records
   */
  getComments(gameId: number): CommentData[] {
    try {
      const stmt = this.db.prepare(
        'SELECT id, gameId, ply, variationId, text FROM comments WHERE gameId = ? AND variationId = 0 ORDER BY ply'
      )
      return stmt.all(gameId) as CommentData[]
    } catch (error) {
      logError('GameDatabase', 'getComments', { dbPath: this.dbPath, gameId }, error)
      return []
    }
  }

  /**
   * Insert or update a comment. Uses upsert semantics on (gameId, ply, variationId).
   *
   * @param gameId - Database ID of the game
   * @param ply - 1-based mainline ply (0 for variation-level comments)
   * @param text - Comment text (max 500 chars)
   * @param variationId - 0 for mainline, variation DB id for variation comments
   * @returns The created/updated comment record
   */
  upsertComment(gameId: number, ply: number, text: string, variationId = 0): CommentData {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO comments (gameId, ply, variationId, text)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(gameId, ply, variationId) DO UPDATE SET text = excluded.text
        RETURNING id, gameId, ply, variationId, text
      `)
      return stmt.get(gameId, ply, variationId, text) as CommentData
    } catch (error) {
      logError('GameDatabase', 'upsertComment', { dbPath: this.dbPath, gameId, ply, variationId }, error)
      throw error
    }
  }

  /**
   * Delete a comment by (gameId, ply, variationId).
   *
   * @param gameId - Database ID of the game
   * @param ply - 1-based mainline ply
   * @param variationId - 0 for mainline, variation DB id for variation comments
   */
  deleteComment(gameId: number, ply: number, variationId = 0): void {
    try {
      this.db.prepare(
        'DELETE FROM comments WHERE gameId = ? AND ply = ? AND variationId = ?'
      ).run(gameId, ply, variationId)
    } catch (error) {
      logError('GameDatabase', 'deleteComment', { dbPath: this.dbPath, gameId, ply, variationId }, error)
      throw error
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
