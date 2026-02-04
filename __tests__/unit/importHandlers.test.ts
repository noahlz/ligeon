import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { parsePgn } from 'chessops/pgn'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { importAndIndexPgn } from '../../src/main/ipc/importHandlers.js'
import { GameDatabase } from '../../src/main/ipc/gameDatabase.js'
import { extractGameData } from '../../src/shared/pgn/gameExtractor.js'

describe('PGN Import Handler', () => {
  let tempDir: string
  let collectionsPath: string

  beforeEach(() => {
    // Create temporary directory for test databases
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
    collectionsPath = tempDir
  })

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test('parses game with all headers', () => {
    const pgn = `[Event "World Championship"]
[Site "New York, NY USA"]
[Date "1972.08.31"]
[Round "1"]
[White "Fischer, Robert J."]
[Black "Spassky, Boris V."]
[Result "1-0"]
[ECO "B44"]
[WhiteElo "2785"]
[BlackElo "2660"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 1-0`

    const games = Array.from(parsePgn(pgn))
    expect(games).toHaveLength(1)

    const game = games[0]
    expect(game.headers.get('White')).toBe('Fischer, Robert J.')
    expect(game.headers.get('Black')).toBe('Spassky, Boris V.')
    expect(game.headers.get('Event')).toBe('World Championship')
    expect(game.headers.get('Date')).toBe('1972.08.31')
    expect(game.headers.get('Result')).toBe('1-0')
    expect(game.headers.get('ECO')).toBe('B44')
    expect(game.headers.get('WhiteElo')).toBe('2785')
    expect(game.headers.get('BlackElo')).toBe('2660')
  })

  test('parses game with missing optional headers', () => {
    const pgn = `[White "Kasparov"]
[Black "Karpov"]
[Result "1/2-1/2"]

1. d4 d5 1/2-1/2`

    const games = Array.from(parsePgn(pgn))
    expect(games).toHaveLength(1)

    const game = games[0]
    expect(game.headers.get('White')).toBe('Kasparov')
    expect(game.headers.get('Black')).toBe('Karpov')

    // Optional headers may be undefined or "?" when not present
    const eco = game.headers.get('ECO')
    const whiteElo = game.headers.get('WhiteElo')
    const site = game.headers.get('Site')

    expect(eco === undefined || eco === '?').toBe(true)
    expect(whiteElo === undefined || whiteElo === '?').toBe(true)
    expect(site === undefined || site === '?').toBe(true)
  })

  test('counts moves correctly', () => {
    const pgn = `[White "Player1"]
[Black "Player2"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 0-1`

    const games = Array.from(parsePgn(pgn))
    const game = games[0]

    let moveCount = 0
    for (const node of game.moves.mainline()) {
      if (node.san) moveCount++
    }

    expect(moveCount).toBe(10) // 5 white + 5 black moves
  })

  test('skips games with invalid results', () => {
    const pgn = `[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 e5 *`

    const games = Array.from(parsePgn(pgn))
    expect(games).toHaveLength(1)

    const game = games[0]
    expect(game.headers.get('Result')).toBe('*')
  })

  test('imports valid PGN file successfully', async () => {
    const pgnContent = `[Event "Test Event"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]
[Date "2024.01.15"]

1. e4 e5 2. Nf3 1-0

[Event "Test Event 2"]
[White "Player3"]
[Black "Player4"]
[Result "0-1"]
[Date "2024.01.16"]

1. d4 d5 2. c4 0-1`

    // Write PGN to temporary file
    const pgnFile = path.join(tempDir, 'test.pgn')
    fs.writeFileSync(pgnFile, pgnContent)

    const result = await importAndIndexPgn(
      pgnFile,
      'test-collection',
      'Test Collection',
      collectionsPath,
      null,
      () => false
    )

    expect(result.success).toBe(true)
    expect(result.cancelled).toBe(false)
    expect(result.error).toBeNull()
    expect(result.stats.totalParsed).toBe(2)
    expect(result.stats.totalIndexed).toBe(2)
    expect(result.stats.totalSkipped).toBe(0)

    // Verify database contains games
    const db = new GameDatabase('test-collection', collectionsPath)
    const count = db.getGameCount()
    expect(count).toBe(2)
    db.close()

    // Verify metadata file was created
    const metadataPath = path.join(collectionsPath, 'test-collection', 'metadata.json')
    expect(fs.existsSync(metadataPath)).toBe(true)

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    expect(metadata.name).toBe('Test Collection')
    expect(metadata.gameCount).toBe(2)
  })

  test('skips games without valid results', async () => {
    const pgnContent = `[Event "Valid Game"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 1-0

[Event "Unfinished Game"]
[White "Player3"]
[Black "Player4"]
[Result "*"]

1. d4 d5 *

[Event "Another Valid Game"]
[White "Player5"]
[Black "Player6"]
[Result "1/2-1/2"]

1. c4 c5 1/2-1/2`

    const pgnFile = path.join(tempDir, 'mixed.pgn')
    fs.writeFileSync(pgnFile, pgnContent)

    const result = await importAndIndexPgn(
      pgnFile,
      'test-collection-2',
      'Test Collection 2',
      collectionsPath,
      null,
      () => false
    )

    expect(result.success).toBe(true)
    expect(result.stats.totalParsed).toBe(3)
    expect(result.stats.totalIndexed).toBe(2) // Only valid games
    expect(result.stats.totalSkipped).toBe(1) // Unfinished game skipped
    expect(result.stats.skippedReasons.invalidResult).toBe(1)
  })

  test('handles cancellation during import', async () => {
    const pgnContent = Array(100)
      .fill(null)
      .map(
        (_, i) => `[Event "Game ${i}"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 1-0`
      )
      .join('\n\n')

    const pgnFile = path.join(tempDir, 'large.pgn')
    fs.writeFileSync(pgnFile, pgnContent)

    let cancelAfterGames = 50
    let checkCount = 0

    const result = await importAndIndexPgn(
      pgnFile,
      'test-collection-3',
      'Test Collection 3',
      collectionsPath,
      null,
      () => {
        checkCount++
        // Cancel after processing 50 games (check happens after increment)
        return checkCount > cancelAfterGames
      }
    )

    expect(result.cancelled).toBe(true)
    expect(result.success).toBe(false)
    expect(result.stats.totalParsed).toBeGreaterThan(0)
    expect(result.stats.totalParsed).toBeLessThan(100)
  })

  test('handles empty PGN file', async () => {
    const pgnFile = path.join(tempDir, 'empty.pgn')
    fs.writeFileSync(pgnFile, '')

    const result = await importAndIndexPgn(
      pgnFile,
      'test-collection-4',
      'Test Collection 4',
      collectionsPath,
      null,
      () => false
    )

    expect(result.success).toBe(true)
    expect(result.stats.totalParsed).toBe(0)
    expect(result.stats.totalIndexed).toBe(0)
    expect(result.stats.totalSkipped).toBe(0)
  })

  test('handles file read errors', async () => {
    const nonExistentFile = path.join(tempDir, 'nonexistent.pgn')

    const result = await importAndIndexPgn(
      nonExistentFile,
      'test-collection-5',
      'Test Collection 5',
      collectionsPath,
      null,
      () => false
    )

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  test('skips games with both players unknown (malformed headers)', () => {
    const pgn = `[Event "Test"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 1-0

[Site "Malformed"]
[Result "1/2-1/2"]

1. d4 1/2-1/2`

    // Second game has no White/Black headers - should be skipped
    const games = Array.from(parsePgn(pgn))
    expect(games).toHaveLength(2)

    const game1 = extractGameData(games[0])
    const game2 = extractGameData(games[1])

    expect(game1).not.toBeNull()
    expect(game2).toBeNull() // Rejected due to missing player names
  })

  test('stores full PGN text in database', async () => {
    const pgnContent = `[Event "Test Event"]
[White "Carlsen, Magnus"]
[Black "Nakamura, Hikaru"]
[Result "1-0"]
[Date "2024.01.15"]
[ECO "C42"]

1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 1-0`

    const pgnFile = path.join(tempDir, 'single.pgn')
    fs.writeFileSync(pgnFile, pgnContent)

    await importAndIndexPgn(
      pgnFile,
      'test-collection-6',
      'Test Collection 6',
      collectionsPath,
      null,
      () => false
    )

    const db = new GameDatabase('test-collection-6', collectionsPath)
    const game = db.getGameWithMoves(1)
    db.close()

    expect(game).toBeTruthy()
    expect(game!.moves).toContain('e4 e5')
    expect(game!.white).toBe('Carlsen, Magnus')
    expect(game!.black).toBe('Nakamura, Hikaru')
    expect(game!.event).toBe('Test Event')
    expect(game!.ecoCode).toBe('C42')
    expect(game!.result).toBe(1.0) // White win
  })
})
