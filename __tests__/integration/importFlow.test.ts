import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { importAndIndexPgn } from '../../src/main/ipc/importHandlers.js'
import { GameDatabase } from '../../src/main/ipc/gameDatabase.js'

describe('PGN Import Flow - Integration Tests', () => {
  let collectionsPath: string
  let fischerResult: Awaited<ReturnType<typeof importAndIndexPgn>>

  beforeAll(async () => {
    collectionsPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-integration-'))
    const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')
    fischerResult = await importAndIndexPgn(
      samplePgn,
      'fischer-shared',
      "Fischer's 60 Memorable Games",
      collectionsPath,
      null,
      () => false
    )
  }, 30_000)

  afterAll(() => {
    if (fs.existsSync(collectionsPath)) {
      fs.rmSync(collectionsPath, { recursive: true, force: true })
    }
  })

  test('imports Fischer 60 Memorable Games successfully', () => {
    // Import should succeed
    expect(fischerResult.success).toBe(true)
    expect(fischerResult.cancelled).toBe(false)
    expect(fischerResult.error).toBeNull()

    // Should have parsed all 60 games
    expect(fischerResult.stats.totalParsed).toBe(60)
    expect(fischerResult.stats.totalIndexed).toBe(60)
    expect(fischerResult.stats.totalSkipped).toBe(0)

    // Check duration is reasonable
    expect(fischerResult.stats.duration).toBeGreaterThan(0)
    expect(fischerResult.stats.duration).toBeLessThan(30000)
  })

  test('games are searchable after import', () => {
    const db = new GameDatabase('fischer-shared', collectionsPath)

    // Search by white player
    const fischerWhiteGames = db.searchGames({ white: 'Fischer' })
    expect(fischerWhiteGames.length).toBeGreaterThan(0)

    // Search by black player
    const fischerBlackGames = db.searchGames({ black: 'Fischer' })
    expect(fischerBlackGames.length).toBeGreaterThan(0)

    // Get a specific game with moves
    const firstGame = fischerWhiteGames[0]
    const gameWithMoves = db.getGameWithMoves(firstGame.id)

    expect(gameWithMoves).not.toBeNull()
    expect(gameWithMoves!.moves).not.toBe('')
    expect(gameWithMoves!.moves.length).toBeGreaterThan(10)

    // Verify game has Fischer as white
    expect(gameWithMoves!.white).toContain('Fischer')

    db.close()
  })

  test('collection metadata is created correctly', () => {
    // Check metadata file exists
    const metadataPath = path.join(collectionsPath, 'fischer-shared', 'metadata.json')
    expect(fs.existsSync(metadataPath)).toBe(true)

    // Parse metadata
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))

    expect(metadata.id).toBe('fischer-shared')
    expect(metadata.name).toBe("Fischer's 60 Memorable Games")
    expect(metadata.gameCount).toBe(fischerResult.stats.totalIndexed)
    expect(metadata.createdAt).toBeTruthy()
    expect(metadata.lastModified).toBeTruthy()

    // Verify timestamps are valid ISO strings
    expect(() => new Date(metadata.createdAt)).not.toThrow()
    expect(() => new Date(metadata.lastModified)).not.toThrow()
  })

  test('imports Tal Life and Games successfully', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-integration-'))
    try {
      const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'tal-life-and-games.pgn')

      const result = await importAndIndexPgn(
        samplePgn,
        'tal-collection',
        "Tal's Life and Games",
        tempDir,
        null,
        () => false
      )

      expect(result.success).toBe(true)
      expect(result.stats.totalParsed).toBeGreaterThan(0)
      expect(result.stats.totalIndexed).toBeGreaterThan(0)

      // Verify we can search for Tal games
      const db = new GameDatabase('tal-collection', tempDir)
      const talGames = db.searchGames({ white: 'Tal' })
      expect(talGames.length).toBeGreaterThan(0)
      db.close()
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    }
  }, 30000)

  test('handles batch processing correctly', () => {
    const db = new GameDatabase('fischer-shared', collectionsPath)
    const gameCount = db.getGameCount()

    expect(gameCount).toBe(fischerResult.stats.totalIndexed)

    // Verify games have required fields
    const games = db.searchGames({}, 10)
    expect(games.length).toBeGreaterThan(0)

    for (const game of games) {
      expect(game.white).toBeTruthy()
      expect(game.black).toBeTruthy()
      expect(typeof game.result).toBe('number')
    }

    db.close()
  })

  test('progress tracking works correctly', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-integration-'))
    try {
      const samplePgn = path.join(process.cwd(), 'resources', 'sample-games', 'fischer-60-memorable.pgn')

      const progressUpdates: any[] = []

      // Mock WebContents to capture progress events
      const mockWebContents = {
        isDestroyed: () => false,
        send: (channel: string, data: any) => {
          if (channel === 'import-progress') {
            progressUpdates.push(data)
          }
        },
      } as any

      const result = await importAndIndexPgn(
        samplePgn,
        'progress-collection',
        'Progress Collection',
        tempDir,
        mockWebContents,
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
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    }
  }, 30000)

  test('database indices are created', () => {
    const db = new GameDatabase('fischer-shared', collectionsPath)

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
  })
})
