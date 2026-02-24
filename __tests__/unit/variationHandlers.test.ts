import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { getVariations, createVariation, updateVariation, deleteVariation, reorderVariations } from '../../src/main/ipc/variationHandlers.js'
import type { VariationData } from '../../src/shared/types/game.js'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { GameDatabase, DatabaseManager } from '../../src/main/ipc/gameDatabase.js'

// We test via the handler functions (which go through validation + DB layer)
// using a real in-memory SQLite database opened through the GameDatabase class.

const TEST_COLLECTION = 'test-collection-variation-handlers'
let tmpDir: string
let db: GameDatabase

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
  db = new GameDatabase(TEST_COLLECTION, tmpDir)
  db.createSchema()
  // Insert a dummy game so variations have a valid FK
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

describe('getVariations', () => {
  test('returns empty array when no variations exist', async () => {
    const result = await getVariations(TEST_COLLECTION, 1, tmpDir)
    expect(result).toEqual([])
  })

  test('returns variations after creating some', async () => {
    await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    await createVariation(TEST_COLLECTION, 1, 5, 'd4', tmpDir)
    const result = await getVariations(TEST_COLLECTION, 1, tmpDir)
    expect(result.length).toBe(2)
    expect(result[0].branchPly).toBe(3)
    expect(result[0].moves).toBe('e4')
    expect(result[1].branchPly).toBe(5)
    expect(result[1].moves).toBe('d4')
  })

  test('returns empty array for invalid collectionId', async () => {
    const result = await getVariations('', 1, tmpDir)
    expect(result).toEqual([])
  })

  test('returns empty array for invalid gameId', async () => {
    const result = await getVariations(TEST_COLLECTION, 0, tmpDir)
    expect(result).toEqual([])
  })
})

describe('createVariation', () => {
  test('creates a variation and returns VariationData with id', async () => {
    const result = await createVariation(TEST_COLLECTION, 1, 3, 'e4 e5', tmpDir)
    expect(result).not.toBeNull()
    expect(result!.id).toBeGreaterThan(0)
    expect(result!.branchPly).toBe(3)
    expect(result!.moves).toBe('e4 e5')
    expect(result!.displayOrder).toBe(0)
  })

  test('allows multiple variations at the same ply', async () => {
    const first = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    const second = await createVariation(TEST_COLLECTION, 1, 3, 'd4', tmpDir)
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(first!.displayOrder).toBe(0)
    expect(second!.displayOrder).toBe(1)
    expect(first!.id).not.toBe(second!.id)
  })

  test('allows variations at different plies without limit', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        createVariation(TEST_COLLECTION, 1, i + 1, 'e4', tmpDir)
      )
    )
    expect(results.every(r => r !== null)).toBe(true)
  })

  test('returns null for invalid branchPly', async () => {
    const result = await createVariation(TEST_COLLECTION, 1, 0, 'e4', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid gameId', async () => {
    const result = await createVariation(TEST_COLLECTION, 0, 3, 'e4', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for invalid collectionId', async () => {
    const result = await createVariation('', 1, 3, 'e4', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for empty moves string', async () => {
    const result = await createVariation(TEST_COLLECTION, 1, 3, '   ', tmpDir)
    expect(result).toBeNull()
  })
})

describe('updateVariation', () => {
  test('updates moves of an existing variation', async () => {
    const created = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    expect(created).not.toBeNull()
    const updated = await updateVariation(TEST_COLLECTION, 1, created!.id!, 'e4 e5 Nf3', tmpDir)
    expect(updated).not.toBeNull()
    expect(updated!.moves).toBe('e4 e5 Nf3')
    expect(updated!.id).toBe(created!.id)
  })

  test('returns null for invalid variation id', async () => {
    const result = await updateVariation(TEST_COLLECTION, 1, 0, 'e4', tmpDir)
    expect(result).toBeNull()
  })

  test('throws for non-existent variation id', async () => {
    await expect(updateVariation(TEST_COLLECTION, 1, 9999, 'e4', tmpDir)).rejects.toThrow()
  })

  test('returns null for invalid collectionId', async () => {
    const result = await updateVariation('', 1, 1, 'e4', tmpDir)
    expect(result).toBeNull()
  })

  test('returns null for empty moves string', async () => {
    const created = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    const result = await updateVariation(TEST_COLLECTION, 1, created!.id!, '  ', tmpDir)
    expect(result).toBeNull()
  })
})

describe('deleteVariation', () => {
  test('deletes a variation by id', async () => {
    const created = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    expect(created).not.toBeNull()
    const result = await deleteVariation(TEST_COLLECTION, 1, created!.id!, tmpDir)
    expect(result.success).toBe(true)
    const remaining = db.getVariations(1)
    expect(remaining.find(v => v.id === created!.id)).toBeUndefined()
  })

  test('only deletes the specified variation when multiple exist at same ply', async () => {
    const first = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    const second = await createVariation(TEST_COLLECTION, 1, 3, 'd4', tmpDir)
    await deleteVariation(TEST_COLLECTION, 1, first!.id!, tmpDir)
    const remaining = db.getVariations(1)
    expect(remaining.find(v => v.id === first!.id)).toBeUndefined()
    expect(remaining.find(v => v.id === second!.id)).toBeDefined()
  })

  test('returns false for invalid id', async () => {
    const result = await deleteVariation(TEST_COLLECTION, 1, 0, tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for invalid collectionId', async () => {
    const result = await deleteVariation('', 1, 1, tmpDir)
    expect(result.success).toBe(false)
  })
})

describe('reorderVariations', () => {
  test('updates displayOrder of variations at a ply', async () => {
    const first = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    const second = await createVariation(TEST_COLLECTION, 1, 3, 'd4', tmpDir)
    const third = await createVariation(TEST_COLLECTION, 1, 3, 'c4', tmpDir)
    // Reverse the order
    const result = await reorderVariations(TEST_COLLECTION, 1, 3, [third!.id!, second!.id!, first!.id!], tmpDir)
    expect(result.success).toBe(true)
    const variations = db.getVariations(1) as VariationData[]
    const atPly = variations.filter(v => v.branchPly === 3)
    expect(atPly[0].id).toBe(third!.id)
    expect(atPly[1].id).toBe(second!.id)
    expect(atPly[2].id).toBe(first!.id)
  })

  test('returns false for invalid branchPly', async () => {
    const result = await reorderVariations(TEST_COLLECTION, 1, 0, [1, 2], tmpDir)
    expect(result.success).toBe(false)
  })

  test('returns false for orderedIds containing invalid id', async () => {
    const result = await reorderVariations(TEST_COLLECTION, 1, 3, [1, 0], tmpDir)
    expect(result.success).toBe(false)
  })

  test('no-ops and returns success for empty orderedIds', async () => {
    await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    const result = await reorderVariations(TEST_COLLECTION, 1, 3, [], tmpDir)
    expect(result.success).toBe(true)
    // Existing variation unaffected
    const variations = db.getVariations(1)
    expect(variations.length).toBe(1)
  })

  test('throws for IDs belonging to a different game', async () => {
    // Insert a second game
    db.insertGame({
      white: 'A', black: 'B', event: null, date: null,
      result: 0.5, ecoCode: null, whiteElo: null, blackElo: null,
      site: null, round: null, moveCount: 10, moves: 'd4 d5',
    })
    const game1Var = await createVariation(TEST_COLLECTION, 1, 3, 'e4', tmpDir)
    const game2Var = await createVariation(TEST_COLLECTION, 2, 3, 'd4', tmpDir)
    // Try to reorder game 1's ply using a mix of IDs from both games
    await expect(
      reorderVariations(TEST_COLLECTION, 1, 3, [game1Var!.id!, game2Var!.id!], tmpDir)
    ).rejects.toThrow()
  })
})
