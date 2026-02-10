import { describe, test, expect } from 'vitest'
import { checkSidelineLimit } from '../../src/main/ipc/sidelineHandlers.js'
import type { SidelineData } from '../../src/shared/types/game.js'

describe('checkSidelineLimit', () => {
  // 60-move game → max 10 sidelines (60/6)
  const MOVE_COUNT_60 = 60

  // 6-move game → max 1 sideline (6/6)
  const MOVE_COUNT_6 = 6

  // 30-move game → max 5 sidelines (30/6)
  const MOVE_COUNT_30 = 30

  test('allows first sideline in empty list', () => {
    expect(checkSidelineLimit([], 1, MOVE_COUNT_60)).toBe(true)
    expect(checkSidelineLimit([], 15, MOVE_COUNT_6)).toBe(true)
  })

  test('allows sidelines up to the limit', () => {
    // 6-move game allows 1 sideline
    expect(checkSidelineLimit([], 3, MOVE_COUNT_6)).toBe(true)
  })

  test('rejects sideline when limit reached', () => {
    // 6-move game allows 1 sideline; already have 1
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 3, moves: 'e4' },
    ]
    expect(checkSidelineLimit(existing, 5, MOVE_COUNT_6)).toBe(false)
  })

  test('allows upsert at same branchPly even when at limit', () => {
    // 6-move game allows 1 sideline; upserting the existing one is fine
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 3, moves: 'e4' },
    ]
    expect(checkSidelineLimit(existing, 3, MOVE_COUNT_6)).toBe(true)
  })

  test('allows adjacent sidelines', () => {
    // 30-move game allows 5 sidelines; add at adjacent plys
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 1, moves: 'e4' },
      { gameId: 1, branchPly: 2, moves: 'd4' },
      { gameId: 1, branchPly: 3, moves: 'c4' },
      { gameId: 1, branchPly: 4, moves: 'Nf3' },
    ]
    expect(checkSidelineLimit(existing, 5, MOVE_COUNT_30)).toBe(true)
  })

  test('rejects when at max for 30-move game', () => {
    // 30-move game allows 5 sidelines; already have 5
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 1, moves: 'e4' },
      { gameId: 1, branchPly: 2, moves: 'd4' },
      { gameId: 1, branchPly: 3, moves: 'c4' },
      { gameId: 1, branchPly: 4, moves: 'Nf3' },
      { gameId: 1, branchPly: 5, moves: 'g3' },
    ]
    expect(checkSidelineLimit(existing, 10, MOVE_COUNT_30)).toBe(false)
  })

  test('60-move game allows up to 10 sidelines', () => {
    const existing: SidelineData[] = Array.from({ length: 9 }, (_, i) => ({
      gameId: 1, branchPly: i + 1, moves: 'e4',
    }))
    // 9 existing, adding 10th should succeed
    expect(checkSidelineLimit(existing, 20, MOVE_COUNT_60)).toBe(true)

    // 10 existing, adding 11th should fail
    existing.push({ gameId: 1, branchPly: 20, moves: 'e4' })
    expect(checkSidelineLimit(existing, 30, MOVE_COUNT_60)).toBe(false)
  })

  test('very short game (< 6 moves) still allows at least 1 sideline', () => {
    expect(checkSidelineLimit([], 1, 3)).toBe(true)
    expect(checkSidelineLimit([], 1, 1)).toBe(true)

    // But not 2
    const existing: SidelineData[] = [
      { gameId: 1, branchPly: 1, moves: 'e4' },
    ]
    expect(checkSidelineLimit(existing, 2, 3)).toBe(false)
  })

  test('zero moveCount still allows 1 sideline', () => {
    expect(checkSidelineLimit([], 1, 0)).toBe(true)
  })
})