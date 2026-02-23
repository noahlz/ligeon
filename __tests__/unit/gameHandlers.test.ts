import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  searchGames,
  getGameMoves,
  getGameCount,
  getAvailableDates,
  getAvailableEcoCodes,
} from '../../src/main/ipc/gameHandlers.js'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { GameDatabase, DatabaseManager } from '../../src/main/ipc/gameDatabase.js'

// Tests call handler functions directly using a real SQLite DB in a temp directory.
// The basePath parameter is overridden with tmpDir so no real collections path is used.

const TEST_COLLECTION = 'test-collection-game-handlers'
let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
  const db = new GameDatabase(TEST_COLLECTION, tmpDir)
  db.createSchema()

  // Seed with varied games
  db.insertGame({
    white: 'Kasparov', black: 'Karpov', event: 'World Championship',
    date: 19850101, result: 1, ecoCode: 'E12', whiteElo: 2700, blackElo: 2680,
    site: 'Moscow', round: '1', moveCount: 42, moves: 'e4 e5 Nf3',
  })
  db.insertGame({
    white: 'Fischer', black: 'Spassky', event: 'World Championship',
    date: 19720701, result: 0, ecoCode: 'C95', whiteElo: 2785, blackElo: 2660,
    site: 'Reykjavik', round: '2', moveCount: 56, moves: 'd4 d5 c4',
  })
  db.insertGame({
    white: 'Anand', black: 'Kasparov', event: 'Linares',
    date: 19950301, result: 0.5, ecoCode: 'E12', whiteElo: 2725, blackElo: 2800,
    site: 'Linares', round: '5', moveCount: 35, moves: 'e4 c5',
  })
  // Close so handlers re-open via DatabaseManager
  DatabaseManager.closeCollection(TEST_COLLECTION, tmpDir)
})

afterEach(() => {
  DatabaseManager.closeCollection(TEST_COLLECTION, tmpDir)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('searchGames', () => {
  test('returns all games with empty filters', async () => {
    const result = await searchGames(TEST_COLLECTION, {}, tmpDir)
    expect(result.length).toBe(3)
  })

  test('returns empty array for invalid collectionId', async () => {
    const result = await searchGames('', {}, tmpDir)
    expect(result).toEqual([])
  })

  test('filters by white player name (substring match)', async () => {
    const result = await searchGames(TEST_COLLECTION, { white: 'Fischer' }, tmpDir)
    expect(result.length).toBe(1)
    expect(result[0].white).toBe('Fischer')
  })

  test('returns empty array when no games match filter', async () => {
    const result = await searchGames(TEST_COLLECTION, { white: 'Polgar' }, tmpDir)
    expect(result).toEqual([])
  })
})

describe('getGameMoves', () => {
  test('returns full game data for valid id', async () => {
    const result = await getGameMoves(TEST_COLLECTION, 1, tmpDir)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(1)
    expect(result!.white).toBe('Kasparov')
    expect(result!.moves).toBe('e4 e5 Nf3')
  })

  test('returns null for non-existent gameId', async () => {
    const result = await getGameMoves(TEST_COLLECTION, 9999, tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid gameId (zero)', async () => {
    const result = await getGameMoves(TEST_COLLECTION, 0, tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid collectionId', async () => {
    const result = await getGameMoves('', 1, tmpDir)
    expect(result).toBeNull()
  })
})

describe('getGameCount', () => {
  test('returns correct count after insertions', async () => {
    const count = await getGameCount(TEST_COLLECTION, tmpDir)
    expect(count).toBe(3)
  })

  test('returns 0 for invalid collectionId', async () => {
    const count = await getGameCount('', tmpDir)
    expect(count).toBe(0)
  })
})

describe('getAvailableDates', () => {
  test('returns sorted distinct dates as YYYYMMDD integers', async () => {
    const dates = await getAvailableDates(TEST_COLLECTION, undefined, tmpDir)
    expect(dates).toEqual([19720701, 19850101, 19950301])
  })

  test('returns empty array for invalid collectionId', async () => {
    const dates = await getAvailableDates('', undefined, tmpDir)
    expect(dates).toEqual([])
  })
})

describe('getAvailableEcoCodes', () => {
  test('returns ECO codes with counts', async () => {
    const codes = await getAvailableEcoCodes(TEST_COLLECTION, undefined, tmpDir)
    expect(codes.length).toBeGreaterThan(0)
    const e12 = codes.find(c => c.eco === 'E12')
    expect(e12).toBeDefined()
    expect(e12!.count).toBe(2)
  })

  test('returns empty array for invalid collectionId', async () => {
    const codes = await getAvailableEcoCodes('', undefined, tmpDir)
    expect(codes).toEqual([])
  })
})
