#!/usr/bin/env node
/**
 * CLI tool to convert a PGN file to a SQLite database
 *
 * Usage: npx tsx scripts/pgn-to-sqlite.ts <pgn-file> [output-dir]
 *
 * Example:
 *   npx tsx scripts/pgn-to-sqlite.ts resources/sample-games/tal-life-and-games.pgn ./out
 */

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { parsePgn, makePgn } from 'chessops/pgn'
import type { Game, PgnNodeData } from 'chessops/pgn'

// Inline converters to avoid Electron-dependent imports
// TODO: Extract these out so we don't have duplicated logic

function pgnDateToTimestamp(pgnDate: string | null | undefined): number | null {
  if (!pgnDate || pgnDate === '?.?.?') return null

  try {
    const parts = pgnDate.split('.')
    const year = parseInt(parts[0])
    if (isNaN(year)) return null

    const month = parts[1] === '??' ? 0 : parseInt(parts[1]) - 1
    const day = parts[2] === '??' ? 1 : parseInt(parts[2])

    const date = new Date(year, month, day)
    return Math.floor(date.getTime() / 1000)
  } catch {
    return null
  }
}

// TODO: More duplicated logic... refactor
function convertResult(pgnResult: string): { numeric: number | null; skip: boolean } {
  const trimmed = pgnResult.trim()
  switch (trimmed) {
    case '1-0':
      return { numeric: 1.0, skip: false }
    case '0-1':
      return { numeric: 0.0, skip: false }
    case '1/2-1/2':
      return { numeric: 0.5, skip: false }
    case '*':
    default:
      return { numeric: null, skip: true }
  }
}

interface GameData {
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  ecoCode: string | null
  whiteElo: number | null
  blackElo: number | null
  site: string | null
  round: string | null
  moveCount: number
  pgn: string
}

function extractGameData(game: Game<PgnNodeData>): GameData | null {
  const headers = game.headers

  const resultStr = headers.get('Result') || '*'
  const resultData = convertResult(resultStr)

  if (resultData.skip) {
    return null
  }

  const white = headers.get('White') || 'Unknown'
  const black = headers.get('Black') || 'Unknown'
  const event = headers.get('Event') || null
  const dateStr = headers.get('Date')
  const date = pgnDateToTimestamp(dateStr)
  const ecoCode = headers.get('ECO') || null
  const site = headers.get('Site') || null
  const round = headers.get('Round') || null

  const whiteEloStr = headers.get('WhiteElo')
  const blackEloStr = headers.get('BlackElo')
  const whiteElo = whiteEloStr ? parseInt(whiteEloStr) : null
  const blackElo = blackEloStr ? parseInt(blackEloStr) : null

  let moveCount = 0
  for (const node of game.moves.mainline()) {
    if (node.san) moveCount++
  }

  const pgn = makePgn(game)

  return {
    white,
    black,
    event,
    date,
    result: resultData.numeric!,
    ecoCode,
    whiteElo: whiteElo && !isNaN(whiteElo) ? whiteElo : null,
    blackElo: blackElo && !isNaN(blackElo) ? blackElo : null,
    site,
    round,
    moveCount,
    pgn,
  }
}

function createSchema(db: Database.Database): void {
  db.exec(`
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
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/pgn-to-sqlite.ts <pgn-file> [output-dir]')
    console.error('')
    console.error('Examples:')
    console.error('  npx tsx scripts/pgn-to-sqlite.ts resources/sample-games/tal-life-and-games.pgn')
    console.error('  npx tsx scripts/pgn-to-sqlite.ts resources/sample-games/fischer-60-memorable.pgn ./output')
    process.exit(1)
  }

  const pgnPath = path.resolve(args[0])
  const outputDir = args[1] ? path.resolve(args[1]) : path.dirname(pgnPath)

  if (!fs.existsSync(pgnPath)) {
    console.error(`Error: PGN file not found: ${pgnPath}`)
    process.exit(1)
  }

  // Create output directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const baseName = path.basename(pgnPath, '.pgn')
  const dbPath = path.join(outputDir, `${baseName}.db`)

  // Remove existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
    console.log(`Removed existing database: ${dbPath}`)
  }

  console.log(`Input:  ${pgnPath}`)
  console.log(`Output: ${dbPath}`)
  console.log('')

  const startTime = Date.now()

  // Open database
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  createSchema(db)

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO games (white, black, event, date, result, ecoCode, whiteElo, blackElo, site, round, moveCount, pgn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Read and parse PGN
  console.log('Reading PGN file...')
  const fileContent = fs.readFileSync(pgnPath, 'utf-8')

  let totalParsed = 0
  let totalIndexed = 0
  let totalSkipped = 0
  const BATCH_SIZE = 1000
  let batch: GameData[] = []

  const insertBatch = db.transaction((games: GameData[]) => {
    for (const game of games) {
      insertStmt.run(
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
        game.pgn
      )
    }
  })

  console.log('Parsing and importing games...')

  for (const game of parsePgn(fileContent)) {
    totalParsed++

    try {
      const gameData = extractGameData(game)

      if (gameData === null) {
        totalSkipped++
        continue
      }

      batch.push(gameData)

      if (batch.length >= BATCH_SIZE) {
        insertBatch(batch)
        totalIndexed += batch.length
        batch = []
        process.stdout.write(`\r  Processed: ${totalParsed}, Indexed: ${totalIndexed}, Skipped: ${totalSkipped}`)
      }
    } catch (error) {
      totalSkipped++
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    insertBatch(batch)
    totalIndexed += batch.length
  }

  db.close()

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('')
  console.log('')
  console.log('═══════════════════════════════════')
  console.log('Import Complete')
  console.log('═══════════════════════════════════')
  console.log(`Total parsed:  ${totalParsed.toLocaleString()}`)
  console.log(`Total indexed: ${totalIndexed.toLocaleString()}`)
  console.log(`Total skipped: ${totalSkipped.toLocaleString()}`)
  console.log(`Duration:      ${duration}s`)
  console.log('')
  console.log(`Database: ${dbPath}`)
  console.log('')
  console.log('Query examples:')
  console.log(`  sqlite3 "${dbPath}" "SELECT COUNT(*) FROM games"`)
  console.log(`  sqlite3 "${dbPath}" "SELECT white, black, event, result FROM games LIMIT 10"`)
}

main()
