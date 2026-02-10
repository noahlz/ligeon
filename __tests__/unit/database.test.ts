import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { GameDatabase } from '../../src/main/ipc/gameDatabase.js'
import type { GameData } from '../../src/main/ipc/types.js'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('GameDatabase', () => {
  let db: GameDatabase
  let testDir: string
  const testId = 'test-collection'

  beforeEach(() => {
    // Create unique temp directory for each test
    testDir = path.join(os.tmpdir(), 'ligeon-test-' + Date.now())
    fs.mkdirSync(testDir, { recursive: true })
    db = new GameDatabase(testId, testDir)
    db.createSchema()
  })

  afterEach(() => {
    db.close()
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  test('creates schema', () => {
    expect(() => db.createSchema()).not.toThrow()
  })

  test('inserts game', () => {
    const game: GameData = {
      white: 'Kasparov',
      black: 'Karpov',
      event: 'Championship',
      date: 19850315,
      result: 1.0,
      ecoCode: 'C95',
      whiteElo: 2740,
      blackElo: 2710,
      site: 'Moscow',
      round: '1',
      moveCount: 42,
      moves: '1. e4 c5...',
    }
    const result = db.insertGame(game)
    expect(result.changes).toBe(1)
  })

  test('searches by white player', () => {
    db.insertGame({
      white: 'Kasparov',
      black: 'Karpov',
      event: 'Test',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: 2740,
      blackElo: 2710,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    const results = db.searchGames({ white: 'Kasparov' })
    expect(results.length).toBe(1)
    expect(results[0].white).toBe('Kasparov')
  })

  test('searches by black player', () => {
    db.insertGame({
      white: 'Anand',
      black: 'Carlsen',
      event: 'Test',
      date: 19560101,
      result: 0.0,
      ecoCode: null,
      whiteElo: 2800,
      blackElo: 2850,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    const results = db.searchGames({ black: 'Carlsen' })
    expect(results.length).toBe(1)
    expect(results[0].black).toBe('Carlsen')
  })

  test('searches by player (white or black)', () => {
    db.insertGame({
      white: 'Fischer',
      black: 'Spassky',
      event: 'Test 1',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: 2700,
      blackElo: 2650,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    db.insertGame({
      white: 'Tal',
      black: 'Fischer',
      event: 'Test 2',
      date: 19560315,
      result: 0.0,
      ecoCode: null,
      whiteElo: 2680,
      blackElo: 2700,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. d4',
    })
    db.insertGame({
      white: 'Petrosian',
      black: 'Korchnoi',
      event: 'Test 3',
      date: 19571231,
      result: 0.5,
      ecoCode: null,
      whiteElo: 2650,
      blackElo: 2640,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. c4',
    })
    const results = db.searchGames({ player: 'Fischer' })
    expect(results.length).toBe(2)
    expect(results.some(r => r.white === 'Fischer')).toBe(true)
    expect(results.some(r => r.black === 'Fischer')).toBe(true)
  })

  test('searches by result', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    const results = db.searchGames({ results: [1.0] })
    expect(results.length).toBe(1)
  })

  test('searches by ELO range', () => {
    db.insertGame({
      white: 'Player1',
      black: 'Player2',
      event: 'Test',
      date: 19560101,
      result: 0.5,
      ecoCode: null,
      whiteElo: 2500,
      blackElo: 2400,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    const results = db.searchGames({ whiteEloMin: 2400, whiteEloMax: 2600 })
    expect(results.length).toBe(1)
    expect(results[0].whiteElo).toBe(2500)
  })

  test('retrieves game with moves', () => {
    db.insertGame({
      white: 'Test',
      black: 'Player',
      event: 'Event',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 3,
      moves: '1. e4 c5 2. Nf3',
    })
    const game = db.getGameWithMoves(1)
    expect(game).not.toBeNull()
    expect(game?.moves).toBe('1. e4 c5 2. Nf3')
  })

  test('returns null for non-existent game', () => {
    const game = db.getGameWithMoves(999)
    expect(game).toBeNull()
  })

  test('returns game count', () => {
    const games: GameData[] = Array(5)
      .fill(null)
      .map((_, i) => ({
        white: `P${i}`,
        black: 'O',
        event: 'T',
        date: 20000101 + i,
        result: 1.0,
        ecoCode: null,
        whiteElo: null,
        blackElo: null,
        site: null,
        round: null,
        moveCount: 1,
        moves: '1. e4',
      }))
    db.insertGamesBatch(games)
    expect(db.getGameCount()).toBe(5)
  })

  test('batch insert works', () => {
    const games: GameData[] = [
      {
        white: 'Player1',
        black: 'Player2',
        event: 'Game1',
        date: 19560101,
        result: 1.0,
        ecoCode: null,
        whiteElo: null,
        blackElo: null,
        site: null,
        round: null,
        moveCount: 1,
        moves: '1. e4',
      },
      {
        white: 'Player3',
        black: 'Player4',
        event: 'Game2',
        date: 19560315,
        result: 0.5,
        ecoCode: null,
        whiteElo: null,
        blackElo: null,
        site: null,
        round: null,
        moveCount: 1,
        moves: '1. d4',
      },
    ]
    db.insertGamesBatch(games)
    expect(db.getGameCount()).toBe(2)
  })

  test('clears all games', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    expect(db.getGameCount()).toBe(1)
    db.clearGames()
    expect(db.getGameCount()).toBe(0)
  })

  test('returns available dates (YYYYMMDD)', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E1',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    db.insertGame({
      white: 'C',
      black: 'D',
      event: 'E2',
      date: 19560315,
      result: 0.5,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. d4',
    })
    db.insertGame({
      white: 'E',
      black: 'F',
      event: 'E3',
      date: 19571231,
      result: 0.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. c4',
    })
    db.insertGame({
      white: 'G',
      black: 'H',
      event: 'E4',
      date: 19560315, // Duplicate date
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. Nf3',
    })
    const dates = db.getAvailableDates()
    expect(dates).toEqual([19560101, 19560315, 19571231]) // Sorted, distinct
  })

  test('filters games by date range with null dates included', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E1',
      date: 19560101,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    db.insertGame({
      white: 'C',
      black: 'D',
      event: 'E2',
      date: 19560315,
      result: 0.5,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. d4',
    })
    db.insertGame({
      white: 'E',
      black: 'F',
      event: 'E3',
      date: null, // Unknown date
      result: 0.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. c4',
    })
    // Filter for dates >= 19560315
    const results = db.searchGames({ dateFrom: 19560315 })
    // Should include both 19560315 and null date game
    expect(results.length).toBe(2)
    expect(results.some(r => r.date === 19560315)).toBe(true)
    expect(results.some(r => r.date === null)).toBe(true)
  })

  // --- Filtered getAvailableDates tests ---

  function insertFilterTestGames(db: GameDatabase) {
    db.insertGamesBatch([
      { white: 'Kasparov', black: 'Karpov', event: 'WC', date: 19850315, result: 1.0, ecoCode: 'C95', whiteElo: 2740, blackElo: 2710, site: null, round: null, moveCount: 1, moves: '1. e4' },
      { white: 'Kasparov', black: 'Anand', event: 'WC', date: 19950901, result: 0.5, ecoCode: 'B90', whiteElo: 2800, blackElo: 2770, site: null, round: null, moveCount: 1, moves: '1. e4' },
      { white: 'Carlsen', black: 'Anand', event: 'WC', date: 20131122, result: 1.0, ecoCode: 'C67', whiteElo: 2870, blackElo: 2775, site: null, round: null, moveCount: 1, moves: '1. e4' },
      { white: 'Carlsen', black: 'Caruana', event: 'WC', date: 20181109, result: 0.5, ecoCode: 'B33', whiteElo: 2835, blackElo: 2832, site: null, round: null, moveCount: 1, moves: '1. e4' },
      { white: 'Anand', black: 'Carlsen', event: 'WC', date: 20131122, result: 0.0, ecoCode: 'D37', whiteElo: 2775, blackElo: 2870, site: null, round: null, moveCount: 1, moves: '1. d4' },
    ])
  }

  test('getAvailableDates with player filter', () => {
    insertFilterTestGames(db)
    const dates = db.getAvailableDates({ player: 'Kasparov' })
    expect(dates).toEqual([19850315, 19950901])
  })

  test('getAvailableDates with results filter', () => {
    insertFilterTestGames(db)
    const dates = db.getAvailableDates({ results: [1.0] })
    expect(dates).toEqual([19850315, 20131122])
  })

  test('getAvailableDates with player + results filter', () => {
    insertFilterTestGames(db)
    const dates = db.getAvailableDates({ player: 'Carlsen', results: [1.0] })
    expect(dates).toEqual([20131122])
  })

  test('getAvailableDates with no filters returns all dates', () => {
    insertFilterTestGames(db)
    const dates = db.getAvailableDates()
    expect(dates).toEqual([19850315, 19950901, 20131122, 20181109])
  })

  test('getAvailableDates with empty filters returns all dates', () => {
    insertFilterTestGames(db)
    const dates = db.getAvailableDates({})
    expect(dates).toEqual([19850315, 19950901, 20131122, 20181109])
  })

  // --- Filtered getAvailableEcoCodes tests ---

  test('getAvailableEcoCodes with player filter', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes({ player: 'Kasparov' })
    const ecos = codes.map(c => c.eco)
    expect(ecos).toEqual(['B90', 'C95'])
  })

  test('getAvailableEcoCodes with results filter', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes({ results: [0.5] })
    const ecos = codes.map(c => c.eco)
    expect(ecos).toEqual(['B33', 'B90'])
  })

  test('getAvailableEcoCodes with player + results filter', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes({ player: 'Carlsen', results: [0.5] })
    expect(codes).toEqual([{ eco: 'B33', count: 1 }])
  })

  test('getAvailableEcoCodes with date filter', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes({ dateFrom: 20000101 })
    const ecos = codes.map(c => c.eco)
    expect(ecos).toEqual(['B33', 'C67', 'D37'])
  })

  test('getAvailableEcoCodes returns accurate counts per filter', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes({ player: 'Carlsen' })
    expect(codes).toEqual([
      { eco: 'B33', count: 1 },
      { eco: 'C67', count: 1 },
      { eco: 'D37', count: 1 },
    ])
  })

  test('getAvailableEcoCodes with no filters returns all codes', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes()
    expect(codes.length).toBe(5)
  })

  test('getAvailableEcoCodes with empty filters returns all codes', () => {
    insertFilterTestGames(db)
    const codes = db.getAvailableEcoCodes({})
    expect(codes.length).toBe(5)
  })

  describe('Sidelines', () => {
    let gameId: number

    beforeEach(() => {
      // Insert a test game
      const result = db.insertGame({
        white: 'Player1',
        black: 'Player2',
        event: 'Test',
        date: 20200101,
        result: 0.5,
        ecoCode: 'C50',
        whiteElo: 2000,
        blackElo: 2000,
        site: null,
        round: null,
        moveCount: 20,
        moves: '1. e4 e5 2. Nf3 Nc6',
      })
      gameId = result.lastInsertRowid as number
    })

    test('getSidelines returns empty array for game with no sidelines', () => {
      const sidelines = db.getSidelines(gameId)
      expect(sidelines).toEqual([])
    })

    test('upsertSideline inserts new sideline', () => {
      const result = db.upsertSideline(gameId, 3, 'd6 3. Bb5')
      expect(result.gameId).toBe(gameId)
      expect(result.branchPly).toBe(3)
      expect(result.moves).toBe('d6 3. Bb5')
      expect(result.id).toBeDefined()
    })

    test('upsertSideline updates existing sideline at same branchPly', () => {
      const first = db.upsertSideline(gameId, 3, 'd6')
      const second = db.upsertSideline(gameId, 3, 'd6 3. Bb5 a6')

      expect(second.id).toBe(first.id)
      expect(second.moves).toBe('d6 3. Bb5 a6')

      const sidelines = db.getSidelines(gameId)
      expect(sidelines.length).toBe(1)
    })

    test('getSidelines returns sidelines ordered by branchPly', () => {
      db.upsertSideline(gameId, 5, 'Nc6')
      db.upsertSideline(gameId, 1, 'd5')
      db.upsertSideline(gameId, 3, 'd6')

      const sidelines = db.getSidelines(gameId)
      expect(sidelines.length).toBe(3)
      expect(sidelines[0].branchPly).toBe(1)
      expect(sidelines[1].branchPly).toBe(3)
      expect(sidelines[2].branchPly).toBe(5)
    })

    test('deleteSideline removes sideline', () => {
      db.upsertSideline(gameId, 3, 'd6')
      db.deleteSideline(gameId, 3)

      const sidelines = db.getSidelines(gameId)
      expect(sidelines.length).toBe(0)
    })

    test('deleteSideline is idempotent', () => {
      db.upsertSideline(gameId, 3, 'd6')
      db.deleteSideline(gameId, 3)
      expect(() => db.deleteSideline(gameId, 3)).not.toThrow()
    })

    test('unique constraint prevents duplicate branchPly', () => {
      db.upsertSideline(gameId, 3, 'first')
      // Second insert at same ply should update (upsert behavior)
      const result = db.upsertSideline(gameId, 3, 'second')
      expect(result.moves).toBe('second')

      const sidelines = db.getSidelines(gameId)
      expect(sidelines.length).toBe(1)
    })

    test('sidelines cascade delete with game', () => {
      db.upsertSideline(gameId, 3, 'd6')
      db.upsertSideline(gameId, 5, 'Nc6')

      // Verify sidelines exist
      let sidelines = db.getSidelines(gameId)
      expect(sidelines.length).toBe(2)

      // Delete the game using a DELETE statement (clearGames uses DELETE FROM games)
      // This should trigger ON DELETE CASCADE due to foreign key constraint
      db.clearGames()

      // Sidelines should be automatically deleted due to CASCADE
      sidelines = db.getSidelines(gameId)
      expect(sidelines.length).toBe(0)
    })
  })
})
