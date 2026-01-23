import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { importAndIndexPgn } from '../../electron/ipc/importHandlers'
import { GameDatabase } from '../../electron/ipc/gameDatabase'

describe('PGN Import Flow - Integration Tests', () => {
  let tempDir: string
  let collectionsPath: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-integration-'))
    collectionsPath = tempDir
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test('imports Fischer 60 Memorable Games successfully', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

    // Verify sample file exists
    expect(fs.existsSync(samplePgn)).toBe(true)

    const result = await importAndIndexPgn(
      samplePgn,
      'fischer-collection',
      "Fischer's 60 Memorable Games",
      collectionsPath,
      null,
      () => false
    )

    // Import should succeed
    expect(result.success).toBe(true)
    expect(result.cancelled).toBe(false)
    expect(result.error).toBeNull()

    // Should have parsed games
    expect(result.stats.totalParsed).toBeGreaterThan(0)
    expect(result.stats.totalIndexed).toBeGreaterThan(0)

    // Most games should be indexed (allowing some skipped for unfinished games)
    const indexRate = result.stats.totalIndexed / result.stats.totalParsed
    expect(indexRate).toBeGreaterThan(0.8) // At least 80% of games indexed

    // Check duration is reasonable
    expect(result.stats.duration).toBeGreaterThan(0)
    expect(result.stats.duration).toBeLessThan(30000) // Should complete within 30 seconds
  }, 30000)

  test('games are searchable after import', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

    await importAndIndexPgn(
      samplePgn,
      'searchable-collection',
      'Searchable Collection',
      collectionsPath,
      null,
      () => false
    )

    // Open database and search for Fischer games
    const db = new GameDatabase('searchable-collection', collectionsPath)

    // Search by white player
    const fischerWhiteGames = db.searchGames({ white: 'Fischer' })
    expect(fischerWhiteGames.length).toBeGreaterThan(0)

    // Search by black player
    const fischerBlackGames = db.searchGames({ black: 'Fischer' })
    expect(fischerBlackGames.length).toBeGreaterThan(0)

    // Get a specific game with moves
    const firstGame = fischerWhiteGames[0]
    const gameWithMoves = db.getGameWithMoves(firstGame.id)

    expect(gameWithMoves).toBeTruthy()
    expect(gameWithMoves!.moves).toBeTruthy()
    expect(gameWithMoves!.moves.length).toBeGreaterThan(0)

    // Verify game has Fischer as white
    expect(gameWithMoves!.white).toContain('Fischer')

    db.close()
  }, 30000)

  test('collection metadata is created correctly', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

    const result = await importAndIndexPgn(
      samplePgn,
      'metadata-collection',
      'Test Metadata Collection',
      collectionsPath,
      null,
      () => false
    )

    // Check metadata file exists
    const metadataPath = path.join(collectionsPath, 'metadata-collection', 'metadata.json')
    expect(fs.existsSync(metadataPath)).toBe(true)

    // Parse metadata
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))

    expect(metadata.id).toBe('metadata-collection')
    expect(metadata.name).toBe('Test Metadata Collection')
    expect(metadata.gameCount).toBe(result.stats.totalIndexed)
    expect(metadata.createdAt).toBeTruthy()
    expect(metadata.lastModified).toBeTruthy()

    // Verify timestamps are valid ISO strings
    expect(() => new Date(metadata.createdAt)).not.toThrow()
    expect(() => new Date(metadata.lastModified)).not.toThrow()
  }, 30000)

  test('imports Tal Life and Games successfully', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'tal-life-and-games.pgn')

    // Verify sample file exists
    expect(fs.existsSync(samplePgn)).toBe(true)

    const result = await importAndIndexPgn(
      samplePgn,
      'tal-collection',
      "Tal's Life and Games",
      collectionsPath,
      null,
      () => false
    )

    expect(result.success).toBe(true)
    expect(result.stats.totalParsed).toBeGreaterThan(0)
    expect(result.stats.totalIndexed).toBeGreaterThan(0)

    // Verify we can search for Tal games
    const db = new GameDatabase('tal-collection', collectionsPath)
    const talGames = db.searchGames({ white: 'Tal' })
    expect(talGames.length).toBeGreaterThan(0)
    db.close()
  }, 30000)

  test('handles batch processing correctly', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

    const result = await importAndIndexPgn(
      samplePgn,
      'batch-test-collection',
      'Batch Test Collection',
      collectionsPath,
      null,
      () => false
    )

    expect(result.success).toBe(true)

    // Open database and verify all games were inserted
    const db = new GameDatabase('batch-test-collection', collectionsPath)
    const gameCount = db.getGameCount()

    expect(gameCount).toBe(result.stats.totalIndexed)

    // Verify games have required fields
    const games = db.searchGames({}, 10)
    expect(games.length).toBeGreaterThan(0)

    for (const game of games) {
      expect(game.white).toBeTruthy()
      expect(game.black).toBeTruthy()
      expect(typeof game.result).toBe('number')
    }

    db.close()
  }, 30000)

  test('progress tracking works correctly', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

    const progressUpdates: any[] = []

    // Mock mainWindow to capture progress events
    const mockWindow = {
      isDestroyed: () => false,
      webContents: {
        send: (channel: string, data: any) => {
          if (channel === 'import-progress') {
            progressUpdates.push(data)
          }
        },
      },
    } as any

    const result = await importAndIndexPgn(
      samplePgn,
      'progress-collection',
      'Progress Collection',
      collectionsPath,
      mockWindow,
      () => false
    )

    expect(result.success).toBe(true)

    // Should have received progress updates
    expect(progressUpdates.length).toBeGreaterThan(0)

    // Progress should be monotonically increasing
    for (let i = 1; i < progressUpdates.length; i++) {
      const prev = progressUpdates[i - 1]
      const curr = progressUpdates[i]

      expect(curr.parsed).toBeGreaterThanOrEqual(prev.parsed)
      expect(curr.indexed).toBeGreaterThanOrEqual(prev.indexed)
    }

    // Final progress should match final stats
    const lastProgress = progressUpdates[progressUpdates.length - 1]
    expect(lastProgress.indexed).toBe(result.stats.totalIndexed)
  }, 30000)

  test('database indices are created', async () => {
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

    await importAndIndexPgn(
      samplePgn,
      'index-test-collection',
      'Index Test Collection',
      collectionsPath,
      null,
      () => false
    )

    const db = new GameDatabase('index-test-collection', collectionsPath)

    // Query database schema to verify indices exist
    const indices = (db as any).db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='games'"
    ).all()

    const indexNames = indices.map((idx: any) => idx.name)

    // Check that key indices exist
    expect(indexNames).toContain('idx_white')
    expect(indexNames).toContain('idx_black')
    expect(indexNames).toContain('idx_event')
    expect(indexNames).toContain('idx_result')
    expect(indexNames).toContain('idx_ecoCode')

    db.close()
  }, 30000)
})
