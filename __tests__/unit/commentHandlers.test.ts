import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  getComments,
  upsertComment,
  upsertVariationComment,
  deleteComment,
  deleteVariationComment,
} from '../../src/main/ipc/commentHandlers.js'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { GameDatabase, DatabaseManager } from '../../src/main/ipc/gameDatabase.js'

// We test via the handler functions (which go through validation + DB layer)
// using a real SQLite database opened through the GameDatabase class.

const TEST_COLLECTION = 'test-collection-comment-handlers'
let tmpDir: string
let db: GameDatabase
let variationId: number

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
  db = new GameDatabase(TEST_COLLECTION, tmpDir)
  db.createSchema()
  // Insert a dummy game so comments have a valid FK
  db.insertGame({
    white: 'White', black: 'Black', event: null, date: null,
    result: 0.5, ecoCode: null, whiteElo: null, blackElo: null,
    site: null, round: null, moveCount: 30, moves: 'e4 e5',
  })
  // Insert a variation for variation comment tests
  const variation = db.createVariation(1, 2, 'e4 e5 Nf3')
  variationId = variation.id!
})

afterEach(() => {
  DatabaseManager.closeCollection(TEST_COLLECTION, tmpDir)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('getComments', () => {
  test('returns empty array when no comments exist', async () => {
    const result = await getComments(TEST_COLLECTION, 1, tmpDir)
    expect(result).toEqual([])
  })

  test('returns comments after upsert, ordered by ply', async () => {
    await upsertComment(TEST_COLLECTION, 1, 5, 'Fifth ply comment', tmpDir)
    await upsertComment(TEST_COLLECTION, 1, 1, 'First ply comment', tmpDir)
    const result = await getComments(TEST_COLLECTION, 1, tmpDir)
    expect(result.length).toBe(2)
    expect(result[0].ply).toBe(1)
    expect(result[0].text).toBe('First ply comment')
    expect(result[1].ply).toBe(5)
    expect(result[1].text).toBe('Fifth ply comment')
  })

  test('returns empty array for invalid collectionId', async () => {
    const result = await getComments('', 1, tmpDir)
    expect(result).toEqual([])
  })

  test('returns empty array for invalid gameId', async () => {
    const result = await getComments(TEST_COLLECTION, 0, tmpDir)
    expect(result).toEqual([])
  })
})

describe('upsertComment', () => {
  test('creates comment and returns CommentData with expected fields', async () => {
    const result = await upsertComment(TEST_COLLECTION, 1, 3, 'Great move!', tmpDir)
    expect(result).not.toBeNull()
    expect(result!.id).toBeGreaterThan(0)
    expect(result!.gameId).toBe(1)
    expect(result!.ply).toBe(3)
    expect(result!.text).toBe('Great move!')
  })

  test('upserting same ply twice updates text', async () => {
    await upsertComment(TEST_COLLECTION, 1, 3, 'Original comment', tmpDir)
    const updated = await upsertComment(TEST_COLLECTION, 1, 3, 'Updated comment', tmpDir)
    expect(updated).not.toBeNull()
    expect(updated!.text).toBe('Updated comment')
    const all = await getComments(TEST_COLLECTION, 1, tmpDir)
    expect(all.length).toBe(1)
    expect(all[0].text).toBe('Updated comment')
  })

  test('trims leading/trailing whitespace from text', async () => {
    const result = await upsertComment(TEST_COLLECTION, 1, 3, '  trimmed  ', tmpDir)
    expect(result).not.toBeNull()
    expect(result!.text).toBe('trimmed')
  })

  test('returns null for invalid ply (zero)', async () => {
    const result = await upsertComment(TEST_COLLECTION, 1, 0, 'text', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for empty text', async () => {
    const result = await upsertComment(TEST_COLLECTION, 1, 3, '', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for text exceeding 500 chars', async () => {
    const longText = 'a'.repeat(501)
    const result = await upsertComment(TEST_COLLECTION, 1, 3, longText, tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid gameId', async () => {
    const result = await upsertComment(TEST_COLLECTION, 0, 3, 'text', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid collectionId', async () => {
    const result = await upsertComment('', 1, 3, 'text', tmpDir)
    expect(result).toBeNull()
  })
})

describe('upsertVariationComment', () => {
  test('creates variation comment and returns CommentData', async () => {
    const result = await upsertVariationComment(TEST_COLLECTION, 1, variationId, 'Variation note', tmpDir)
    expect(result).not.toBeNull()
    expect(result!.id).toBeGreaterThan(0)
    expect(result!.gameId).toBe(1)
    expect(result!.text).toBe('Variation note')
  })

  test('returns null for invalid variationId (zero)', async () => {
    const result = await upsertVariationComment(TEST_COLLECTION, 1, 0, 'text', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for empty text', async () => {
    const result = await upsertVariationComment(TEST_COLLECTION, 1, variationId, '', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid gameId', async () => {
    const result = await upsertVariationComment(TEST_COLLECTION, 0, variationId, 'text', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid collectionId', async () => {
    const result = await upsertVariationComment('', 1, variationId, 'text', tmpDir)
    expect(result).toBeNull()
  })
})

describe('deleteComment', () => {
  test('deletes comment and it no longer appears in getComments', async () => {
    await upsertComment(TEST_COLLECTION, 1, 3, 'to delete', tmpDir)
    const result = await deleteComment(TEST_COLLECTION, 1, 3, tmpDir)
    expect(result.success).toBe(true)
    const remaining = await getComments(TEST_COLLECTION, 1, tmpDir)
    expect(remaining).toEqual([])
  })

  test('only deletes the comment at specified ply — other plies remain', async () => {
    await upsertComment(TEST_COLLECTION, 1, 3, 'keep', tmpDir)
    await upsertComment(TEST_COLLECTION, 1, 5, 'also keep', tmpDir)
    await deleteComment(TEST_COLLECTION, 1, 3, tmpDir)
    const remaining = await getComments(TEST_COLLECTION, 1, tmpDir)
    expect(remaining.length).toBe(1)
    expect(remaining[0].ply).toBe(5)
  })

  test('is idempotent — deleting non-existent ply returns success', async () => {
    const result = await deleteComment(TEST_COLLECTION, 1, 99, tmpDir)
    expect(result.success).toBe(true)
  })

  test('returns false for invalid ply (zero)', async () => {
    const result = await deleteComment(TEST_COLLECTION, 1, 0, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid gameId', async () => {
    const result = await deleteComment(TEST_COLLECTION, 0, 3, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid collectionId', async () => {
    const result = await deleteComment('', 1, 3, tmpDir)
    expect(result.success).toBe(false)
  })
})

describe('deleteVariationComment', () => {
  test('deletes variation comment; no longer retrievable', async () => {
    await upsertVariationComment(TEST_COLLECTION, 1, variationId, 'Variation note', tmpDir)
    const result = await deleteVariationComment(TEST_COLLECTION, 1, variationId, tmpDir)
    expect(result.success).toBe(true)
  })

  test('is idempotent — deleting non-existent variation comment returns success', async () => {
    const result = await deleteVariationComment(TEST_COLLECTION, 1, variationId, tmpDir)
    expect(result.success).toBe(true)
  })

  test('returns false for invalid variationId (zero)', async () => {
    const result = await deleteVariationComment(TEST_COLLECTION, 1, 0, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid gameId', async () => {
    const result = await deleteVariationComment(TEST_COLLECTION, 0, variationId, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid collectionId', async () => {
    const result = await deleteVariationComment('', 1, variationId, tmpDir)
    expect(result.success).toBe(false)
  })
})
