# ligeon Part 4: PGN Parsing & Indexing

**Goal:** Create PGN parser, import handler with streaming, progress logging

**Files to create:**
- src/utils/pgnParser.js (parse metadata, moves)
- electron/ipc/importHandlers.js (import with progress logging)
- Tests for parser and import flow

---

## Actions to Complete

### 1. Create src/utils/pgnParser.js

```javascript
import { parse as parsePgn } from 'pgn-parser'

export function parseGameMetadata(pgnText) {
  try {
    const games = parsePgn(pgnText)
    if (!games || games.length === 0) return null

    const game = games[0]
    const headers = game.headers || {}

    return {
      white: headers.White || 'Unknown',
      black: headers.Black || 'Unknown',
      event: headers.Event || null,
      date: headers.Date || null,
      result: headers.Result || null,
      ecoCode: headers.ECO || null,
      whiteElo: headers.WhiteElo ? parseInt(headers.WhiteElo) : null,
      blackElo: headers.BlackElo ? parseInt(headers.BlackElo) : null,
      site: headers.Site || null,
      round: headers.Round || null,
    }
  } catch (error) {
    console.error('Error parsing PGN metadata:', error)
    return null
  }
}

export function parseGameMoves(pgnText) {
  try {
    const games = parsePgn(pgnText)
    if (!games || games.length === 0) return []
    return games[0].moves || []
  } catch (error) {
    console.error('Error parsing PGN moves:', error)
    return []
  }
}

export function parsePgnGame(pgnText) {
  const metadata = parseGameMetadata(pgnText)
  const moves = parseGameMoves(pgnText)
  return { ...metadata, moves, moveCount: moves.length }
}
```

**Checklist:**
- [ ] Create src/utils/pgnParser.js
- [ ] Verify pgn-parser imports correctly
- [ ] Test with sample PGN data

---

### 2. Create electron/ipc/importHandlers.js

```javascript
import readline from 'readline'
import fs from 'fs'
import { GameDatabase } from './gameDatabase.js'
import { parseGameMetadata, parseGameMoves } from '../../src/utils/pgnParser.js'
import { convertResult } from '../../src/utils/resultConverter.js'
import { pgnDateToTimestamp } from '../../src/utils/dateConverter.js'

export async function importAndIndexPgn(filePath, collectionId, collectionName, mainWindow) {
  const stats = {
    totalParsed: 0,
    totalIndexed: 0,
    totalSkipped: 0,
    skippedReasons: { noResult: 0, invalidResult: 0, parseError: 0 },
    logs: [],
  }

  const db = new GameDatabase(collectionId)
  db.createSchema()

  const logMessage = (message, type = 'info') => {
    const logEntry = { timestamp: new Date(), type, message }
    stats.logs.push(logEntry)
    if (mainWindow) {
      mainWindow.webContents.send('import-progress-log', logEntry)
    }
  }

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    })

    let currentGame = ''
    let lineNumber = 0
    let gameStartLine = 0

    rl.on('line', (line) => {
      lineNumber++
      currentGame += line + '\n'

      if (line === '' && currentGame.includes('[')) {
        try {
          const metadata = parseGameMetadata(currentGame)

          if (!metadata) {
            stats.totalSkipped++
            stats.skippedReasons.parseError++
            logMessage(`Skipped at line ${gameStartLine}: PGN parse error`)
            currentGame = ''
            gameStartLine = lineNumber
            return
          }

          stats.totalParsed++

          if (!metadata.result) {
            stats.totalSkipped++
            stats.skippedReasons.noResult++
            logMessage(`Skipped: [${metadata.white} vs ${metadata.black}] - no result field`)
            currentGame = ''
            gameStartLine = lineNumber
            return
          }

          const result = convertResult(metadata.result)
          if (result.skip) {
            stats.totalSkipped++
            stats.skippedReasons.invalidResult++
            logMessage(`Skipped: [${metadata.white} vs ${metadata.black}] - invalid result "${metadata.result}"`)
            currentGame = ''
            gameStartLine = lineNumber
            return
          }

          const moves = parseGameMoves(currentGame)

          db.insertGame({
            white: metadata.white,
            black: metadata.black,
            event: metadata.event,
            date: pgnDateToTimestamp(metadata.date),
            result: result.numeric,
            ecoCode: metadata.ecoCode,
            whiteElo: metadata.whiteElo,
            blackElo: metadata.blackElo,
            site: metadata.site,
            round: metadata.round,
            moveCount: moves.length,
            pgn: currentGame,
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

          currentGame = ''
          gameStartLine = lineNumber
        } catch (e) {
          stats.totalSkipped++
          stats.skippedReasons.parseError++
          logMessage(`Skipped at line ${gameStartLine}: Parse error - ${e.message}`)
          currentGame = ''
          gameStartLine = lineNumber
        }
      }
    })

    rl.on('close', () => {
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

      resolve(stats)
    })

    rl.on('error', (error) => {
      logMessage(`File read error: ${error.message}`, 'error')
      db.close()
      if (mainWindow) {
        mainWindow.webContents.send('import-complete', { success: false, error: error.message })
      }
      reject(error)
    })
  })
}
```

**Checklist:**
- [ ] Create electron/ipc/importHandlers.js
- [ ] Verify streaming works with readline
- [ ] Progress logs every 10k games
- [ ] Skips logged immediately
- [ ] Final summary provided

---

### 3. Create Unit Tests

**File: `__tests__/unit/pgnParser.test.js`**

```javascript
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
- [ ] Create __tests__/unit/pgnParser.test.js
- [ ] Run `npm test` - all tests pass

---

**File: `__tests__/integration/importAndReplay.test.js`**

```javascript
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
- [ ] Create __tests__/integration/importAndReplay.test.js
- [ ] Run `npm test` - integration tests pass

---

### 4. Test Import Flow

```bash
npm run dev
```

Then in UI: Click "Import New" → select PGN → watch progress → verify games indexed

### 5. Run Tests

```bash
npm test -- pgnParser.test
npm test -- importAndReplay.test
npm run dev
```

Expected: Tests pass, import works correctly

**Summary:** PGN parser, import handler with streaming, progress logging created

**Next:** Proceed to ligeon_05-1_react_components.md