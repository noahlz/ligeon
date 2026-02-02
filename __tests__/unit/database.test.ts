import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { GameDatabase } from '../../electron/ipc/gameDatabase'
import type { GameData } from '../../electron/ipc/types'
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
      date: 198503,
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
      date: 195601,
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
      date: 195601,
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
      date: 195601,
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
      date: 195603,
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
      date: 195712,
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
      date: 195601,
      result: 1.0,
      ecoCode: null,
      whiteElo: null,
      blackElo: null,
      site: null,
      round: null,
      moveCount: 1,
      moves: '1. e4',
    })
    const results = db.searchGames({ result: 1.0 })
    expect(results.length).toBe(1)
  })

  test('searches by ELO range', () => {
    db.insertGame({
      white: 'Player1',
      black: 'Player2',
      event: 'Test',
      date: 195601,
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
      date: 195601,
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
        date: 200001 + i,
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
        date: 195601,
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
        date: 195603,
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
      date: 195601,
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

  test('returns available dates (YYYYMM)', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E1',
      date: 195601,
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
      date: 195603,
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
      date: 195712,
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
      date: 195603, // Duplicate date
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
    expect(dates).toEqual([195601, 195603, 195712]) // Sorted, distinct
  })

  test('filters games by date range with null dates included', () => {
    db.insertGame({
      white: 'A',
      black: 'B',
      event: 'E1',
      date: 195601,
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
      date: 195603,
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
    // Filter for dates >= 195603
    const results = db.searchGames({ dateFrom: 195603 })
    // Should include both 195603 and null date game
    expect(results.length).toBe(2)
    expect(results.some(r => r.date === 195603)).toBe(true)
    expect(results.some(r => r.date === null)).toBe(true)
  })
})
