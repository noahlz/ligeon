# ligeon Part 4: PGN Parsing & Indexing

**Goal:** Create PGN parser, import handler with streaming, progress logging

**Key files to create:**
- src/utils/pgnParser.ts (parse metadata, moves)
- electron/ipc/importHandlers.ts (import with progress logging)
- Tests for parser and import flow

---

## Implementation Checklist

Use these copyable lists with TodoWrite to track progress. Tick items as complete after implementation.

**Part 4.1 - PGN Import Handler:**
- [x] Create electron/ipc/importHandlers.ts using chessops parsePgn()
- [x] Implement streaming import with chessops iterator — Uses batch processing (1000 games per batch)
- [x] Implement result validation and skip logic
- [x] Implement progress logging every 10,000 games — Implemented with import-progress events
- [x] Implement detailed skip reason logging — Tracks noResult, invalidResult, parseError
- [x] Implement final statistics summary
- [x] Create __tests__/integration/importAndReplay.test.ts — Created as __tests__/integration/importFlow.test.ts with 7 passing tests
- [x] Test: Import sample PGN file successfully — Tested with Fischer (60 games) and Tal (102 games) sample files
- [x] Test: Progress events sent to renderer
- [x] Test: Skipped games logged with reasons

**Part 4.2 - Import Complete:**
- [x] Wire importAndIndexPgn to electron/main.ts import-pgn handler — Lines 107-119
- [x] Test: Complete import workflow end-to-end

---

## Actions to Complete

### 1. Create src/utils/pgnParser.ts

```typescript
import { parsePgn } from 'chessops/pgn'

export function parseGameMetadata(pgnText: string) {
  try {
    const games = parsePgn(pgnText)
    const firstGame = games.next()

    if (firstGame.done) return null

    const game = firstGame.value
    const headers = game.headers

    return {
      white: headers.get('White') || 'Unknown',
      black: headers.get('Black') || 'Unknown',
      event: headers.get('Event') || null,
      date: headers.get('Date') || null,
      result: headers.get('Result') || null,
      ecoCode: headers.get('ECO') || null,
      whiteElo: headers.get('WhiteElo') ? parseInt(headers.get('WhiteElo')!) : null,
      blackElo: headers.get('BlackElo') ? parseInt(headers.get('BlackElo')!) : null,
      site: headers.get('Site') || null,
      round: headers.get('Round') || null,
    }
  } catch (error) {
    console.error('Error parsing PGN metadata:', error)
    return null
  }
}

export function parseGameMoves(pgnText: string): string[] {
  try {
    const games = parsePgn(pgnText)
    const firstGame = games.next()

    if (firstGame.done) return []

    const game = firstGame.value
    const moves: string[] = []

    // Walk the game tree to extract SAN moves
    for (const node of game.moves.mainline()) {
      if (node.san) {
        moves.push(node.san)
      }
    }

    return moves
  } catch (error) {
    console.error('Error parsing PGN moves:', error)
    return []
  }
}

export function parsePgnGame(pgnText: string) {
  const metadata = parseGameMetadata(pgnText)
  const moves = parseGameMoves(pgnText)
  return { ...metadata, moves, moveCount: moves.length }
}
```

**Checklist:**
- [x] Create src/utils/pgnParser.ts — Implemented as lib/pgn/gameExtractor.ts (shared library pattern)
- [x] Verify chessops/pgn imports correctly
- [x] Test with sample PGN data

---

### 2. Create electron/ipc/importHandlers.ts

```typescript
import fs from 'fs'
import { parsePgn } from 'chessops/pgn'
import { GameDatabase } from './gameDatabase'
import { convertResult } from '../../src/utils/resultConverter'
import { pgnDateToTimestamp } from '../../src/utils/dateConverter'

export async function importAndIndexPgn(
  filePath: string,
  collectionId: string,
  collectionName: string,
  mainWindow: any
): Promise<any> {
  const stats = {
    totalParsed: 0,
    totalIndexed: 0,
    totalSkipped: 0,
    skippedReasons: { noResult: 0, invalidResult: 0, parseError: 0 },
    logs: [] as any[],
  }

  const db = new GameDatabase(collectionId)
  db.createSchema()

  const logMessage = (message: string, type = 'info') => {
    const logEntry = { timestamp: new Date(), type, message }
    stats.logs.push(logEntry)
    if (mainWindow) {
      mainWindow.webContents.send('import-progress-log', logEntry)
    }
  }

  try {
    const content = await fs.promises.readFile(filePath, 'utf-8')

    // chessops parsePgn returns an iterator over games
    for (const game of parsePgn(content)) {
      stats.totalParsed++

      try {
        const headers = game.headers
        const resultStr = headers.get('Result')

        if (!resultStr) {
          stats.totalSkipped++
          stats.skippedReasons.noResult++
          const white = headers.get('White') || 'Unknown'
          const black = headers.get('Black') || 'Unknown'
          logMessage(`Skipped: [${white} vs ${black}] - no result field`)
          continue
        }

        const result = convertResult(resultStr)
        if (result.skip) {
          stats.totalSkipped++
          stats.skippedReasons.invalidResult++
          const white = headers.get('White') || 'Unknown'
          const black = headers.get('Black') || 'Unknown'
          logMessage(`Skipped: [${white} vs ${black}] - invalid result "${resultStr}"`)
          continue
        }

        // Extract moves from game tree
        const moves: string[] = []
        for (const node of game.moves.mainline()) {
          if (node.san) {
            moves.push(node.san)
          }
        }

        db.insertGame({
          white: headers.get('White') || 'Unknown',
          black: headers.get('Black') || 'Unknown',
          event: headers.get('Event') || null,
          date: pgnDateToTimestamp(headers.get('Date')),
          result: result.numeric,
          ecoCode: headers.get('ECO') || null,
          whiteElo: headers.get('WhiteElo') ? parseInt(headers.get('WhiteElo')!) : null,
          blackElo: headers.get('BlackElo') ? parseInt(headers.get('BlackElo')!) : null,
          site: headers.get('Site') || null,
          round: headers.get('Round') || null,
          moveCount: moves.length,
        })

        stats.totalIndexed++

        if (stats.totalIndexed % 10000 === 0) {
          const remaining = stats.totalParsed - stats.totalIndexed
          logMessage(`Progress: Indexed ${stats.totalIndexed.toLocaleString()} games (${remaining.toLocaleString()} remaining)`)
          if (mainWindow) {
            mainWindow.webContents.send('import-progress', {
              parsed: stats.totalParsed,
              indexed: stats.totalIndexed,
              skipped: stats.totalSkipped,
              logs: stats.logs,
            })
          }
        }
      } catch (e: any) {
        stats.totalSkipped++
        stats.skippedReasons.parseError++
        logMessage(`Skipped game: Parse error - ${e.message}`)
      }
    }

    logMessage('\n═══════════════════════════════════')
    logMessage('Import Complete!')
    logMessage(`Total indexed: ${stats.totalIndexed.toLocaleString()} games`)
    logMessage(`Total skipped: ${stats.totalSkipped.toLocaleString()} games`)
    logMessage(`  - No result: ${stats.skippedReasons.noResult.toLocaleString()}`)
    logMessage(`  - Invalid result: ${stats.skippedReasons.invalidResult.toLocaleString()}`)
    logMessage(`  - Parse error: ${stats.skippedReasons.parseError.toLocaleString()}`)
    logMessage('═══════════════════════════════════')

    db.close()

    if (mainWindow) {
      mainWindow.webContents.send('import-complete', { success: true, stats })
    }

    return stats
  } catch (error: any) {
    logMessage(`File read error: ${error.message}`, 'error')
    db.close()
    if (mainWindow) {
      mainWindow.webContents.send('import-complete', { success: false, error: error.message })
    }
    throw error
  }
}
```

**Checklist:**
- [x] Create electron/ipc/importHandlers.ts
- [x] Verify streaming works with chessops iterator — Uses batch processing (1000 games per batch)
- [x] Progress logs every 10k games — Sends import-progress events
- [x] Skips logged immediately — Sends import-progress-log events with reasons
- [x] Final summary provided — Returns ImportStats with duration and breakdown

---

### 3. Create Unit Tests

**File: `__tests__/unit/pgnParser.test.ts`**

```typescript
import { parseGameMetadata, parseGameMoves, parsePgnGame } from '../../src/utils/pgnParser'

describe('PGN Parser', () => {
  const samplePgn = `[Event "Test"]
[White "Kasparov"]
[Black "Karpov"]
[Date "1985.01.15"]
[Result "1-0"]
[ECO "C95"]
[WhiteElo "2740"]
[BlackElo "2710"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4`

  test('parses metadata', () => {
    const meta = parseGameMetadata(samplePgn)
    expect(meta.white).toBe('Kasparov')
    expect(meta.black).toBe('Karpov')
    expect(meta.event).toBe('Test')
    expect(meta.ecoCode).toBe('C95')
  })

  test('parses moves', () => {
    const moves = parseGameMoves(samplePgn)
    expect(moves.length).toBeGreaterThan(0)
  })

  test('handles missing headers', () => {
    const pgn = '[White "A"]\n[Black "B"]\n\n1. e4'
    const meta = parseGameMetadata(pgn)
    expect(meta.event).toBeNull()
  })

  test('parses full game', () => {
    const game = parsePgnGame(samplePgn)
    expect(game.white).toBe('Kasparov')
    expect(game.moves.length).toBeGreaterThan(0)
  })
})
```

**Checklist:**
- [x] Create __tests__/unit/pgnParser.test.ts — Implemented as __tests__/unit/importHandlers.test.ts with 10 passing tests
- [x] Run `npm test` - all tests pass (Vitest)

---

**File: `__tests__/integration/importAndReplay.test.ts`**

```typescript
import { importAndIndexPgn } from '../../electron/ipc/importHandlers'
import { GameDatabase } from '../../electron/ipc/gameDatabase'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

describe('Import and Replay Integration', () => {
  let testCollectionId
  const samplePgnContent = `[Event "Test 1"]
[White "Player A"]
[Black "Player B"]
[Date "1985.01.15"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6

[Event "Test 2"]
[White "Player C"]
[Black "Player D"]
[Date "1985.01.16"]
[Result "0-1"]

1. d4 Nf6 2. c4 e6
`

  beforeEach(() => {
    testCollectionId = 'test-' + Date.now()
  })

  afterEach(() => {
    const dir = path.join(app.getPath('userData'), 'ligeon', 'collections', testCollectionId)
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  test('imports PGN and indexes games', async () => {
    // Create temp PGN file
    const tempFile = path.join('/tmp', `test-${Date.now()}.pgn`)
    fs.writeFileSync(tempFile, samplePgnContent)

    try {
      const stats = await importAndIndexPgn(tempFile, testCollectionId, 'Test Collection', null)
      expect(stats.totalIndexed).toBe(2)
      expect(stats.totalSkipped).toBe(0)
    } finally {
      fs.unlinkSync(tempFile)
    }
  })

  test('searches imported games', async () => {
    const tempFile = path.join('/tmp', `test-${Date.now()}.pgn`)
    fs.writeFileSync(tempFile, samplePgnContent)

    try {
      await importAndIndexPgn(tempFile, testCollectionId, 'Test Collection', null)

      const db = new GameDatabase(testCollectionId)
      const results = db.searchGames({ white: 'Player A' })
      expect(results.length).toBe(1)
      expect(results[0].white).toBe('Player A')
      db.close()
    } finally {
      fs.unlinkSync(tempFile)
    }
  })
})
```

**Checklist:**
- [x] Create __tests__/integration/importAndReplay.test.ts — Implemented as __tests__/integration/importFlow.test.ts with 7 passing tests
- [x] Run `npm test` - integration tests pass

---

### 4. Test Import Flow

```bash
npm dev
```

Then in UI: Click "Import New" → select PGN → watch progress → verify games indexed

**Checklist:**
- [x] Launch app in dev mode — Running on http://localhost:5174
- [ ] Manual UI test: Import PGN and verify functionality — Requires user testing

### 5. Run Tests

```bash
npm test pgnParser.test
npm test importAndReplay.test
npm dev
```

Expected: Tests pass (Vitest), import works correctly

**Checklist:**
- [x] Run all tests — 45 tests passing
- [x] Run typecheck — Passed
- [x] Launch dev app — Running successfully

