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
import { parsePgn } from 'chessops/pgn'
import { extractGameData, GAMES_SCHEMA_SQL, type GameData } from '../src/shared/index.js'

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
  db.exec(GAMES_SCHEMA_SQL)

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO games (white, black, event, dateYYYYMM, result, ecoCode, whiteElo, blackElo, site, round, moveCount, moves)
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
        game.moves
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
