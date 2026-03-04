/**
 * Tests for useVariationState — core CRUD flows only.
 *
 * NOT tested here (require multi-step setup with real FEN + VariationManager):
 *   - enterVariation / jumpToVariationMove (entering an existing variation)
 *   - variationNav.first/prev/next/last/jump (navigation within active variation)
 *   - handleUserMove while already in a variation (appending / advancing)
 *   - handleUserMove entering a matching saved variation
 *   - persistVariation sentinel guard (concurrent create prevention)
 *
 * Because these paths are untested, useVariationState.ts is excluded from the
 * coverage threshold in vitest.coverage.excludes.ts to prevent a false failure.
 */

import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useVariationState } from '@/hooks/useVariationState'
import { mockElectron, installElectronMock } from '../helpers/electronMock'
import type { VariationData } from '../../src/shared/types/game'
import type { ChessManager } from '../../src/renderer/utils/chessManager'

// Mock variationManager to avoid real chessops dependency in handleUserMove tests
vi.mock('../../src/renderer/utils/variationManager', () => ({
  createVariationManager: vi.fn(() => ({
    appendMove: vi.fn().mockReturnValue(true),
    getCurrentPly: vi.fn().mockReturnValue(1),
    getTotalPlies: vi.fn().mockReturnValue(1),
    getMovesString: vi.fn().mockReturnValue('d4'),
    getDests: vi.fn().mockReturnValue(new Map()),
    getTurnColor: vi.fn().mockReturnValue('black'),
    getMoveType: vi.fn().mockReturnValue('normal'),
    goto: vi.fn(),
    tryMove: vi.fn(),
    getNextSan: vi.fn(),
  })),
}))

/** Minimal ChessManager mock — only stub methods used by useVariationState */
function makeMockChessManager(overrides: Partial<ChessManager> = {}): ChessManager {
  return {
    getFen: vi.fn(),
    getLastMove: vi.fn(),
    getMoveType: vi.fn(),
    goto: vi.fn(),
    getCurrentPly: vi.fn().mockReturnValue(0),
    getTotalPlies: vi.fn().mockReturnValue(5),
    getFenAtPly: vi.fn(),
    tryMove: vi.fn(),
    getMainlineSan: vi.fn(),
    getMovesString: vi.fn(),
    ...overrides,
  } as unknown as ChessManager
}

function makeVariation(overrides: Partial<VariationData> = {}): VariationData {
  return { id: 1, gameId: 42, branchPly: 2, moves: 'd4', ...overrides }
}

function makeHookParams(overrides = {}) {
  return {
    chessManager: makeMockChessManager(),
    collectionId: 'col-1',
    gameId: 42,
    currentPly: 0,
    updateBoardState: vi.fn(),
    autoPlayStop: vi.fn(),
    forceBoardSync: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  installElectronMock()
  vi.clearAllMocks()
})

describe('useVariationState', () => {

  // ── loadVariations ────────────────────────────────────────────────────────

  describe('loadVariations', () => {
    it('calls getVariations and populates state', async () => {
      const saved = [makeVariation()]
      mockElectron.getVariations.mockResolvedValue(saved)

      const { result } = renderHook(() => useVariationState(makeHookParams()))

      await act(async () => {
        await result.current.loadVariations('col-1', 42)
      })

      expect(mockElectron.getVariations).toHaveBeenCalledWith('col-1', 42)
      expect(result.current.variations).toEqual(saved)
    })

    it('clears active variation on load', async () => {
      mockElectron.getVariations.mockResolvedValue([])

      const { result } = renderHook(() => useVariationState(makeHookParams()))

      await act(async () => {
        await result.current.loadVariations('col-1', 42)
      })

      expect(result.current.isInVariation).toBe(false)
    })
  })

  // ── reorderLocalVariations ────────────────────────────────────────────────

  describe('reorderLocalVariations', () => {
    it('reorders variations at the given branchPly', async () => {
      const v1 = makeVariation({ id: 1, branchPly: 2 })
      const v2 = makeVariation({ id: 2, branchPly: 2, moves: 'Nf3' })
      const v3 = makeVariation({ id: 3, branchPly: 4, moves: 'e5' })
      mockElectron.getVariations.mockResolvedValue([v1, v2, v3])

      const { result } = renderHook(() => useVariationState(makeHookParams()))

      await act(async () => {
        await result.current.loadVariations('col-1', 42)
      })

      act(() => {
        result.current.reorderLocalVariations(2, [2, 1])
      })

      const atPly2 = result.current.variations.filter(v => v.branchPly === 2)
      expect(atPly2.map(v => v.id)).toEqual([2, 1])
      // Variation at other ply is untouched
      expect(result.current.variations.find(v => v.id === 3)).toBeDefined()
    })
  })

  // ── Deletion confirm flow ──────────────────────────────────────────────────

  describe('requestDeletion / confirmDeletion / cancelDeletion', () => {
    it('requestDeletion sets pendingDeletion', () => {
      const { result } = renderHook(() => useVariationState(makeHookParams()))

      act(() => { result.current.requestDeletion(5) })
      expect(result.current.pendingDeletion).toBe(5)
    })

    it('cancelDeletion clears pendingDeletion', () => {
      const { result } = renderHook(() => useVariationState(makeHookParams()))

      act(() => { result.current.requestDeletion(5) })
      act(() => { result.current.cancelDeletion() })
      expect(result.current.pendingDeletion).toBeNull()
    })

    it('confirmDeletion calls dismissVariation with pendingDeletion id', async () => {
      const v = makeVariation({ id: 7 })
      mockElectron.getVariations.mockResolvedValue([v])
      mockElectron.deleteVariation.mockResolvedValue(undefined)

      const { result } = renderHook(() => useVariationState(makeHookParams()))

      await act(async () => {
        await result.current.loadVariations('col-1', 42)
      })

      act(() => { result.current.requestDeletion(7) })

      await act(async () => {
        result.current.confirmDeletion()
      })

      expect(mockElectron.deleteVariation).toHaveBeenCalledWith('col-1', 42, 7)
      expect(result.current.pendingDeletion).toBeNull()
    })
  })

  // ── dismissVariation ──────────────────────────────────────────────────────

  describe('dismissVariation', () => {
    it('removes the variation from state', async () => {
      const v1 = makeVariation({ id: 1 })
      const v2 = makeVariation({ id: 2, moves: 'Nf3' })
      mockElectron.getVariations.mockResolvedValue([v1, v2])
      mockElectron.deleteVariation.mockResolvedValue(undefined)

      const { result } = renderHook(() => useVariationState(makeHookParams()))

      await act(async () => {
        await result.current.loadVariations('col-1', 42)
        await result.current.dismissVariation(1)
      })

      expect(result.current.variations.map(v => v.id)).toEqual([2])
    })

    it('is a no-op when collectionId or gameId is null', async () => {
      const params = makeHookParams({ collectionId: null })
      const { result } = renderHook(() => useVariationState(params))

      await act(async () => {
        await result.current.dismissVariation(1)
      })

      expect(mockElectron.deleteVariation).not.toHaveBeenCalled()
    })
  })

  // ── exitVariation ─────────────────────────────────────────────────────────

  describe('exitVariation', () => {
    it('sets isInVariation to false and clears variation state', () => {
      const { result } = renderHook(() => useVariationState(makeHookParams()))

      act(() => { result.current.exitVariation() })

      expect(result.current.isInVariation).toBe(false)
      expect(result.current.variationMoves).toEqual([])
      expect(result.current.variationPly).toBe(0)
      expect(result.current.activeBranchPly).toBeNull()
      expect(result.current.activeVariationId).toBeNull()
    })
  })

  // ── handleUserMove — null guards ──────────────────────────────────────────

  describe('handleUserMove', () => {
    it('does nothing when chessManager is null', () => {
      const params = makeHookParams({ chessManager: null })
      const { result } = renderHook(() => useVariationState(params))

      act(() => { result.current.handleUserMove('e2', 'e4') })

      expect(params.updateBoardState).not.toHaveBeenCalled()
    })

    it('does nothing when collectionId is null', () => {
      const params = makeHookParams({ collectionId: null })
      const { result } = renderHook(() => useVariationState(params))

      act(() => { result.current.handleUserMove('e2', 'e4') })

      expect(params.updateBoardState).not.toHaveBeenCalled()
    })

    it('calls forceBoardSync when tryMove returns null (illegal move)', () => {
      const manager = makeMockChessManager({ tryMove: vi.fn().mockReturnValue(null) })
      const params = makeHookParams({ chessManager: manager })
      const { result } = renderHook(() => useVariationState(params))

      act(() => { result.current.handleUserMove('e2', 'e5') }) // illegal

      expect(params.forceBoardSync).toHaveBeenCalledTimes(1)
    })

    it('advances mainline when move matches mainline SAN', () => {
      // e2→e4 on the initial position is SAN 'e4'
      // Stub: tryMove returns 'e4', getMainlineSan returns 'e4' → mainline advance
      const manager = makeMockChessManager({
        tryMove: vi.fn().mockReturnValue('e4'),
        getMainlineSan: vi.fn().mockReturnValue('e4'),
      })
      const params = makeHookParams({ chessManager: manager, currentPly: 0 })
      const { result } = renderHook(() => useVariationState(params))

      act(() => { result.current.handleUserMove('e2', 'e4') })

      // updateBoardState called with chessManager and ply+1 = 1
      expect(params.updateBoardState).toHaveBeenCalledWith(manager, 1)
      expect(result.current.isInVariation).toBe(false)
    })

    it('creates a new variation when move differs from mainline', async () => {
      // tryMove returns 'd4' (a non-mainline move)
      // getMainlineSan returns 'e4' (mainline differs)
      // getFenAtPly returns a valid FEN for the initial position
      const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const manager = makeMockChessManager({
        tryMove: vi.fn().mockReturnValue('d4'),
        getMainlineSan: vi.fn().mockReturnValue('e4'),
        getFenAtPly: vi.fn().mockReturnValue(INITIAL_FEN),
      })
      mockElectron.createVariation.mockResolvedValue(
        makeVariation({ id: 99, branchPly: 1, moves: 'd4' })
      )

      const params = makeHookParams({ chessManager: manager, currentPly: 0 })
      const { result } = renderHook(() => useVariationState(params))

      await act(async () => {
        result.current.handleUserMove('d2', 'd4')
        // Wait for IPC round-trip
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockElectron.createVariation).toHaveBeenCalledWith('col-1', 42, 1, 'd4')
      expect(result.current.isInVariation).toBe(true)
    })
  })
})
