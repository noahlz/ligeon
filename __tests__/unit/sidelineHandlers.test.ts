import { describe, test, expect } from 'vitest'
import { checkDensityLimit } from '../../src/main/ipc/sidelineHandlers.js'
import type { SidelineData } from '../../src/shared/types/game.js'

describe('checkDensityLimit', () => {
  test('allows first sideline in empty list', () => {
    expect(checkDensityLimit([], 1)).toBe(true)
    expect(checkDensityLimit([], 15)).toBe(true)
  })

  test('allows sidelines in different buckets', () => {
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 1, moves: 'e4' }, // Bucket 0 (plys 1-12)
    ]
    expect(checkDensityLimit(existing, 13)).toBe(true) // Bucket 1 (plys 13-24)
    expect(checkDensityLimit(existing, 25)).toBe(true) // Bucket 2 (plys 25-36)
  })

  test('rejects sidelines in same bucket', () => {
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 5, moves: 'e4' }, // Bucket 0 (plys 1-12)
    ]
    expect(checkDensityLimit(existing, 1)).toBe(false)  // Bucket 0
    expect(checkDensityLimit(existing, 8)).toBe(false)  // Bucket 0
    expect(checkDensityLimit(existing, 12)).toBe(false) // Bucket 0
  })

  test('allows upsert at same branchPly', () => {
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 5, moves: 'e4' },
    ]
    // Upserting at branchPly 5 should be allowed (same position)
    expect(checkDensityLimit(existing, 5)).toBe(true)
  })

  test('handles multiple sidelines in different buckets', () => {
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 5, moves: 'e4' },  // Bucket 0 (1-12)
      { gameId: 1, branchPly: 15, moves: 'd4' }, // Bucket 1 (13-24)
      { gameId: 1, branchPly: 30, moves: 'c4' }, // Bucket 2 (25-36)
    ]
    expect(checkDensityLimit(existing, 1)).toBe(false)  // Bucket 0 - conflict with ply 5
    expect(checkDensityLimit(existing, 13)).toBe(false) // Bucket 1 - conflict with ply 15
    expect(checkDensityLimit(existing, 37)).toBe(true)  // Bucket 3 - no conflict
  })

  test('bucket calculation edge cases', () => {
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 1, moves: 'e4' },  // Bucket 0: floor((1-1)/12) = 0
      { gameId: 1, branchPly: 13, moves: 'd4' }, // Bucket 1: floor((13-1)/12) = 1
    ]
    expect(checkDensityLimit(existing, 12)).toBe(false) // Bucket 0: floor((12-1)/12) = 0
    expect(checkDensityLimit(existing, 24)).toBe(false) // Bucket 1: floor((24-1)/12) = 1
    expect(checkDensityLimit(existing, 25)).toBe(true)  // Bucket 2: floor((25-1)/12) = 2
  })

  test('density limit with realistic game scenario', () => {
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 5, moves: 'd6' },   // Bucket 0 (1-12)
      { gameId: 1, branchPly: 15, moves: 'a6' },  // Bucket 1 (13-24)
      { gameId: 1, branchPly: 30, moves: 'h6' },  // Bucket 2 (25-36)
    ]

    // Can add to bucket 3
    expect(checkDensityLimit(existing, 37)).toBe(true)
    expect(checkDensityLimit(existing, 48)).toBe(true)

    // Cannot add to existing buckets
    expect(checkDensityLimit(existing, 1)).toBe(false)
    expect(checkDensityLimit(existing, 11)).toBe(false)
    expect(checkDensityLimit(existing, 13)).toBe(false)
    expect(checkDensityLimit(existing, 24)).toBe(false)
    expect(checkDensityLimit(existing, 25)).toBe(false)
    expect(checkDensityLimit(existing, 36)).toBe(false)
  })
})
