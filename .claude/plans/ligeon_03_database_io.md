# ligeon Part 3: Database & I/O

**Goal:** Create SQLite database wrapper, converters, and collection/game handlers

**Key files to create:**
- electron/ipc/gameDatabase.ts (SQLite operations)
- src/utils/{dateConverter,resultConverter}.ts (data conversion)
- electron/ipc/{collectionHandlers,gameHandlers}.ts (CRUD operations)

---

## Implementation Checklist

Use these copyable lists with TodoWrite to track progress. Tick items as complete after implementation.

**Part 3.1 - SQLite Database:**
- [ ] Create electron/ipc/gameDatabase.ts (GameDatabase class)
- [ ] Implement createSchema() with 8 indices
- [ ] Implement insertGame() and insertGamesBatch()
- [ ] Implement searchGames() with dynamic filtering
- [ ] Implement getGameWithMoves() and getGameCount()
- [ ] Implement close() and clearGames()
- [ ] Create unit tests for database operations
- [ ] Test: All CRUD operations work correctly

**Part 3.2 - Data Converters:**
- [ ] Create src/utils/dateConverter.ts (pgnDateToTimestamp, timestampToDisplay)
- [ ] Create src/utils/resultConverter.ts (convertResult, resultNumericToDisplay)
- [ ] Create __tests__/unit/dateConverter.test.ts
- [ ] Create __tests__/unit/resultConverter.test.ts
- [ ] Test: All converters handle edge cases

**Part 3.3 - Collection & Game Handlers:**
- [ ] Create electron/ipc/collectionHandlers.ts (list, rename, delete)
- [ ] Create electron/ipc/gameHandlers.ts (search, getGameMoves)
- [ ] Update electron/main.ts to import and wire handlers
- [ ] Test: Collection operations work
- [ ] Test: Game queries return correct data

---

## Actions to Complete

### 1. Create electron/ipc/gameDatabase.ts

```typescript
import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

const collectionsPath = path.join(app.getPath('userData'), 'ligeon', 'collections')

export class GameDatabase {
  constructor(collectionId) {
    this.collectionId = collectionId
    this.collectionDir = path.join(collectionsPath, collectionId)
    this.dbPath = path.join(this.collectionDir, 'games.db')

    if (!fs.existsSync(this.collectionDir)) {
      fs.mkdirSync(this.collectionDir, { recursive: true })
    }

    try {
      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL')
    } catch (error) {
      console.error('Error opening database:', error)
      throw error
    }
  }

  createSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        white TEXT NOT NULL,
        black TEXT NOT NULL,
        event TEXT,
        date INTEGER,
        result REAL NOT NULL,
        ecoCode TEXT,
        whiteElo INTEGER,
        blackElo INTEGER,
        site TEXT,
        round TEXT,
        moveCount INTEGER,
        pgn TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_white ON games(white);
      CREATE INDEX IF NOT EXISTS idx_black ON games(black);
      CREATE INDEX IF NOT EXISTS idx_event ON games(event);
      CREATE INDEX IF NOT EXISTS idx_date ON games(date);
      CREATE INDEX IF NOT EXISTS idx_result ON games(result);
      CREATE INDEX IF NOT EXISTS idx_ecoCode ON games(ecoCode);
      CREATE INDEX IF NOT EXISTS idx_whiteElo ON games(whiteElo);
      CREATE INDEX IF NOT EXISTS idx_blackElo ON games(blackElo);
    `)
    console.log('✓ Database schema created')
  }

  insertGame(gameData) {
    const stmt = this.db.prepare(`
      INSERT INTO games (white, black, event, date, result, ecoCode, whiteElo, blackElo, site, round, moveCount, pgn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    return stmt.run(gameData.white, gameData.black, gameData.event, gameData.date, gameData.result, gameData.ecoCode, gameData.whiteElo, gameData.blackElo, gameData.site, gameData.round, gameData.moveCount, gameData.pgn)
  }

  insertGamesBatch(games) {
    const stmt = this.db.prepare(`
      INSERT INTO games (white, black, event, date, result, ecoCode, whiteElo, blackElo, site, round, moveCount, pgn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertMany = this.db.transaction((games) => {
      for (const game of games) {
        stmt.run(game.white, game.black, game.event, game.date, game.result, game.ecoCode, game.whiteElo, game.blackElo, game.site, game.round, game.moveCount, game.pgn)
      }
    })
    return insertMany(games)
  }

  searchGames(filters, limit = 1000) {
    let query = 'SELECT id, white, black, event, date, result, whiteElo, blackElo, ecoCode FROM games WHERE 1=1'
    const params = []

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
      query += ' AND date >= ?'
      params.push(filters.dateFrom)
    }
    if (filters.dateTo !== null && filters.dateTo !== undefined) {
      query += ' AND date <= ?'
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
      return stmt.all(...params)
    } catch (error) {
      console.error('Error searching games:', error)
      return []
    }
  }

  getGameWithMoves(gameId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM games WHERE id = ?')
      return stmt.get(gameId)
    } catch (error) {
      console.error('Error getting game:', error)
      return null
    }
  }

  getGameCount() {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM games')
      return stmt.get().count
    } catch (error) {
      console.error('Error getting game count:', error)
      return 0
    }
  }

  close() {
    try {
      if (this.db) this.db.close()
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }

  clearGames() {
    try {
      this.db.prepare('DELETE FROM games').run()
      console.log('✓ Cleared all games')
    } catch (error) {
      console.error('Error clearing games:', error)
    }
  }
}
```

**Checklist:**
- [ ] Create electron/ipc/gameDatabase.ts
- [ ] Verify all methods present
- [ ] Test with sample game data

---

### 2. Create src/utils/dateConverter.ts

```typescript
export function pgnDateToTimestamp(pgnDate) {
  if (!pgnDate || pgnDate === '?.?.?') return null

  try {
    const parts = pgnDate.split('.')
    const year = parseInt(parts[0])
    if (isNaN(year)) return null

    const month = parts[1] === '??' ? 0 : parseInt(parts[1]) - 1
    const day = parts[2] === '??' ? 1 : parseInt(parts[2])

    const date = new Date(year, month, day)
    return Math.floor(date.getTime() / 1000)
  } catch (error) {
    console.warn('Error parsing date:', pgnDate, error)
    return null
  }
}

export function timestampToDisplay(timestamp) {
  if (!timestamp) return 'Unknown'

  try {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    console.warn('Error formatting timestamp:', timestamp, error)
    return 'Unknown'
  }
}
```

**Checklist:**
- [ ] Create src/utils/dateConverter.ts
- [ ] Test: "1985.01.15" converts to timestamp
- [ ] Test: "1985.??.??" handles partial dates
- [ ] Test: "?.?.?" returns null

---

### 3. Create src/utils/resultConverter.ts

```typescript
export function convertResult(pgnResult) {
  const trimmed = pgnResult.trim()

  switch (trimmed) {
    case '1-0':
      return { numeric: 1.0, display: 'White Wins', skip: false }
    case '0-1':
      return { numeric: 0.0, display: 'Black Wins', skip: false }
    case '1/2-1/2':
      return { numeric: 0.5, display: 'Draw', skip: false }
    case '*':
      return { numeric: null, display: 'Unfinished', skip: true }
    default:
      return { numeric: null, display: 'Unknown', skip: true }
  }
}

export function resultNumericToDisplay(resultNumeric) {
  switch (resultNumeric) {
    case 1.0:
      return 'White Wins'
    case 0.5:
      return 'Draw'
    case 0.0:
      return 'Black Wins'
    default:
      return 'Unknown'
  }
}
```

**Checklist:**
- [ ] Create src/utils/resultConverter.ts
- [ ] Test: "1-0" → 1.0, "White Wins"
- [ ] Test: "1/2-1/2" → 0.5, "Draw"
- [ ] Test: "*" → skip: true

---

### 4. Create Unit Tests

**File: `__tests__/unit/dateConverter.test.ts`**

```typescript
import { pgnDateToTimestamp, timestampToDisplay } from '../../src/utils/dateConverter'

describe('Date Converter', () => {
  test('converts complete date', () => {
    const result = pgnDateToTimestamp('1985.01.15')
    expect(result).toBeDefined()
    expect(typeof result).toBe('number')
  })

  test('handles partial dates', () => {
    const result = pgnDateToTimestamp('1985.??.??')
    expect(result).toBeDefined()
  })

  test('handles unknown year', () => {
    expect(pgnDateToTimestamp('?.?.?')).toBeNull()
  })

  test('converts timestamp to display', () => {
    const ts = pgnDateToTimestamp('1985.01.15')
    const display = timestampToDisplay(ts)
    expect(display).toContain('1985')
  })

  test('handles null timestamp', () => {
    expect(timestampToDisplay(null)).toBe('Unknown')
  })
})
```

**File: `__tests__/unit/resultConverter.test.ts`**

```typescript
import { convertResult, resultNumericToDisplay } from '../../src/utils/resultConverter'

describe('Result Converter', () => {
  test('converts white win', () => {
    const result = convertResult('1-0')
    expect(result.numeric).toBe(1.0)
    expect(result.skip).toBe(false)
  })

  test('converts draw', () => {
    const result = convertResult('1/2-1/2')
    expect(result.numeric).toBe(0.5)
  })

  test('skips unfinished games', () => {
    const result = convertResult('*')
    expect(result.skip).toBe(true)
  })

  test('converts numeric to display', () => {
    expect(resultNumericToDisplay(1.0)).toBe('White Wins')
    expect(resultNumericToDisplay(0.5)).toBe('Draw')
    expect(resultNumericToDisplay(0.0)).toBe('Black Wins')
  })
})
```

**Checklist:**
- [ ] Create __tests__/unit/dateConverter.test.ts
- [ ] Create __tests__/unit/resultConverter.test.ts
- [ ] Run `npm test` - all tests pass (Vitest compatible)

---

**File: `__tests__/unit/database.test.ts`**

```typescript
import { GameDatabase } from '../../electron/ipc/gameDatabase'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

describe('GameDatabase', () => {
  let db
  const testId = 'test-' + Date.now()

  beforeEach(() => {
    db = new GameDatabase(testId)
    db.createSchema()
  })

  afterEach(() => {
    db.close()
    // Clean up
    const dir = path.join(app.getPath('userData'), 'ligeon', 'collections', testId)
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  test('creates schema', () => {
    expect(() => db.createSchema()).not.toThrow()
  })

  test('inserts game', () => {
    const game = {
      white: 'Kasparov',
      black: 'Karpov',
      event: 'Championship',
      date: 474633600,
      result: 1.0,
      ecoCode: 'C95',
      whiteElo: 2740,
      blackElo: 2710,
      site: 'Moscow',
      round: '1',
      moveCount: 42,
      pgn: '1. e4 c5...',
    }
    const result = db.insertGame(game)
    expect(result.changes).toBe(1)
  })

  test('searches by white player', () => {
    db.insertGame({
      white: 'Kasparov',
      black: 'Karpov',
      event: 'Test',
      date: 1,
      result: 1.0,
      ecoCode: null,
      whiteElo: 2740,
      blackElo: 2710,
      site: null,
      round: null,
      moveCount: 1,
      pgn: '1. e4',
    })
    const results = db.searchGames({ white: 'Kasparov' })
    expect(results.length).toBe(1)
    expect(results[0].white).toBe('Kasparov')
  })

  test('searches by result', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E',
      date: 1,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      pgn: '1. e4',
    })
    const results = db.searchGames({ result: 1.0 })
    expect(results.length).toBe(1)
  })

  test('retrieves game with moves', () => {
    db.insertGame({
      white: 'Test',
      black: 'Player',
      event: 'Event',
      date: 1,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 3,
      pgn: '1. e4 c5 2. Nf3',
    })
    const game = db.getGameWithMoves(1)
    expect(game.pgn).toBe('1. e4 c5 2. Nf3')
  })

  test('returns game count', () => {
    const games = Array(5).fill(null).map((_, i) => ({
      white: `P${i}`,
      black: 'O',
      event: 'T',
      date: i,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      pgn: '1. e4',
    }))
    db.insertGamesBatch(games)
    expect(db.getGameCount()).toBe(5)
  })
})
```

**Checklist:**
- [ ] Create __tests__/unit/database.test.ts
- [ ] Run `npm test` - all tests pass

---

### 5. Create Collection Handlers

**File: `electron/ipc/collectionHandlers.ts`**

```typescript
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

const collectionsPath = path.join(app.getPath('userData'), 'ligeon', 'collections')

export async function listCollections() {
  console.log('Listing collections...')
  try {
    if (!fs.existsSync(collectionsPath)) return []

    const dirs = fs.readdirSync(collectionsPath).filter(f => {
      try {
        return fs.statSync(path.join(collectionsPath, f)).isDirectory()
      } catch {
        return false
      }
    })

    const collections = []
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

export async function renameCollection(collectionId, newName) {
  console.log('Renaming collection:', collectionId, '→', newName)
  try {
    const metaPath = path.join(collectionsPath, collectionId, 'metadata.json')
    if (!fs.existsSync(metaPath)) throw new Error('Collection not found')

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

export async function deleteCollection(collectionId) {
  console.log('Deleting collection:', collectionId)
  try {
    const collDir = path.join(collectionsPath, collectionId)
    if (!fs.existsSync(collDir)) throw new Error('Collection not found')

    fs.rmSync(collDir, { recursive: true, force: true })
    return { success: true }
  } catch (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}
```

**Checklist:**
- [ ] Create electron/ipc/collectionHandlers.ts
- [ ] All three methods implemented: list, rename, delete

---

### 6. Create Game Handlers

**File: `electron/ipc/gameHandlers.ts`**

```typescript
import { GameDatabase } from './gameDatabase'

export async function searchGames(collectionId, filters) {
  console.log('Searching games:', collectionId, filters)
  try {
    const db = new GameDatabase(collectionId)
    const results = db.searchGames(filters, filters.limit || 1000)
    db.close()
    return results
  } catch (error) {
    console.error('Error searching games:', error)
    return []
  }
}

export async function getGameMoves(collectionId, gameId) {
  console.log('Getting game:', collectionId, gameId)
  try {
    const db = new GameDatabase(collectionId)
    const game = db.getGameWithMoves(gameId)
    db.close()
    return game
  } catch (error) {
    console.error('Error getting game:', error)
    return null
  }
}
```

**Checklist:**
- [ ] Create electron/ipc/gameHandlers.ts
- [ ] Both methods implemented: searchGames, getGameMoves

---

### 7. Wire Handlers in electron/main.ts

Add imports to top of electron/main.ts:
```typescript
import { listCollections, renameCollection, deleteCollection } from './ipc/collectionHandlers'
import { searchGames, getGameMoves } from './ipc/gameHandlers'
```

Replace stubs in setupIpcHandlers():
```typescript
ipcMain.handle('list-collections', async () => listCollections())
ipcMain.handle('rename-collection', async (event, { collectionId, newName }) => renameCollection(collectionId, newName))
ipcMain.handle('delete-collection', async (event, { collectionId }) => deleteCollection(collectionId))
ipcMain.handle('search-games', async (event, { collectionId, filters }) => searchGames(collectionId, filters))
ipcMain.handle('get-game-moves', async (event, { collectionId, gameId }) => getGameMoves(collectionId, gameId))
```

### 8. Test Database & I/O

```bash
npm test dateConverter.test
npm test resultConverter.test
npm test database.test
npm dev
```

Expected: All tests pass (Vitest), app starts without errors

