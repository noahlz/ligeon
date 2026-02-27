import fs from 'fs'
import path from 'path'
import os from 'os'
import { GameDatabase, DatabaseManager } from '../../src/main/ipc/gameDatabase.js'

/**
 * Creates a temp dir and opens a GameDatabase with schema created.
 * Use teardownTestDb to clean up after tests.
 */
export function createTestDb(collectionId: string): { db: GameDatabase; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
  const db = new GameDatabase(collectionId, tmpDir)
  db.createSchema()
  return { db, tmpDir }
}

/**
 * Closes the collection and removes the temp dir.
 * Call in afterEach when using createTestDb.
 */
export function teardownTestDb(collectionId: string, tmpDir: string): void {
  DatabaseManager.closeCollection(collectionId, tmpDir)
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
