import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { getAnnotations, upsertAnnotation, deleteAnnotation } from '../../src/main/ipc/annotationHandlers.js'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { GameDatabase, DatabaseManager } from '../../src/main/ipc/gameDatabase.js'

// We test via the handler functions (which go through validation + DB layer)
// using a real SQLite database opened through the GameDatabase class.

const TEST_COLLECTION = 'test-collection-annotation-handlers'
let tmpDir: string
let db: GameDatabase

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
  db = new GameDatabase(TEST_COLLECTION, tmpDir)
  db.createSchema()
  // Insert a dummy game so annotations have a valid FK
  db.insertGame({
    white: 'White', black: 'Black', event: null, date: null,
    result: 0.5, ecoCode: null, whiteElo: null, blackElo: null,
    site: null, round: null, moveCount: 30, moves: 'e4 e5',
  })
})

afterEach(() => {
  DatabaseManager.closeCollection(TEST_COLLECTION, tmpDir)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('getAnnotations', () => {
  test('returns empty array when no annotations exist', async () => {
    const result = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(result).toEqual([])
  })

  test('returns annotations after upserting, ordered by ply', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 5, 2, tmpDir)
    await upsertAnnotation(TEST_COLLECTION, 1, 1, 1, tmpDir)
    const result = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(result.length).toBe(2)
    expect(result[0].ply).toBe(1)
    expect(result[0].nag).toBe(1)
    expect(result[1].ply).toBe(5)
    expect(result[1].nag).toBe(2)
  })

  test('returns multiple NAGs at same ply', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)  // Good move
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 7, tmpDir)  // Forced move
    const result = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(result.length).toBe(2)
    expect(result.map(a => a.nag).sort()).toEqual([1, 7])
    expect(result.every(a => a.ply === 3)).toBe(true)
  })

  test('returns empty array for invalid collectionId', async () => {
    const result = await getAnnotations('', 1, tmpDir)
    expect(result).toEqual([])
  })

  test('returns empty array for invalid gameId', async () => {
    const result = await getAnnotations(TEST_COLLECTION, 0, tmpDir)
    expect(result).toEqual([])
  })
})

describe('upsertAnnotation', () => {
  test('creates annotation and returns AnnotationData with id', async () => {
    const result = await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    expect(result).not.toBeNull()
    expect(result!.id).toBeGreaterThan(0)
    expect(result!.gameId).toBe(1)
    expect(result!.ply).toBe(3)
    expect(result!.nag).toBe(1)
  })

  test('inserting same (ply, nag) twice is idempotent — returns same record', async () => {
    const first = await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    expect(first).not.toBeNull()
    const second = await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    expect(second).not.toBeNull()
    expect(second!.nag).toBe(1)
    // Still only one annotation at (ply 3, nag 1)
    const all = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(all.length).toBe(1)
    expect(all[0].nag).toBe(1)
  })

  test('two different NAGs at same ply both persist', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)   // Good move
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 7, tmpDir)   // Forced move
    const all = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(all.length).toBe(2)
    expect(all.map(a => a.nag).sort()).toEqual([1, 7])
  })

  test('allows annotations at different plies', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 1, 1, tmpDir)
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 2, tmpDir)
    await upsertAnnotation(TEST_COLLECTION, 1, 5, 4, tmpDir)
    const result = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(result.length).toBe(3)
  })

  test('returns null for invalid NAG code', async () => {
    const result = await upsertAnnotation(TEST_COLLECTION, 1, 3, 999, tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid ply (zero)', async () => {
    const result = await upsertAnnotation(TEST_COLLECTION, 1, 0, 1, tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid gameId', async () => {
    const result = await upsertAnnotation(TEST_COLLECTION, 0, 3, 1, tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid collectionId', async () => {
    const result = await upsertAnnotation('', 1, 3, 1, tmpDir)
    expect(result).toBeNull()
  })
})

describe('deleteAnnotation', () => {
  test('deletes specific annotation and it no longer appears in getAnnotations', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    const result = await deleteAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    expect(result.success).toBe(true)
    const remaining = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(remaining).toEqual([])
  })

  test('only deletes the specified NAG — other NAGs at same ply remain', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)   // Good move
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 7, tmpDir)   // Forced move
    await deleteAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)   // Remove Good move
    const remaining = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(remaining.length).toBe(1)
    expect(remaining[0].nag).toBe(7)
    expect(remaining[0].ply).toBe(3)
  })

  test('only deletes annotation at specified ply', async () => {
    await upsertAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    await upsertAnnotation(TEST_COLLECTION, 1, 5, 2, tmpDir)
    await deleteAnnotation(TEST_COLLECTION, 1, 3, 1, tmpDir)
    const remaining = await getAnnotations(TEST_COLLECTION, 1, tmpDir)
    expect(remaining.length).toBe(1)
    expect(remaining[0].ply).toBe(5)
  })

  test('is idempotent — deleting non-existent annotation returns success', async () => {
    const result = await deleteAnnotation(TEST_COLLECTION, 1, 99, 1, tmpDir)
    expect(result.success).toBe(true)
  })

  test('returns false for invalid ply (zero)', async () => {
    const result = await deleteAnnotation(TEST_COLLECTION, 1, 0, 1, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid NAG code', async () => {
    const result = await deleteAnnotation(TEST_COLLECTION, 1, 3, 999, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid collectionId', async () => {
    const result = await deleteAnnotation('', 1, 3, 1, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid gameId', async () => {
    const result = await deleteAnnotation(TEST_COLLECTION, 0, 3, 1, tmpDir)
    expect(result.success).toBe(false)
  })
})
