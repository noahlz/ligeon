import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useGameNavigation } from '@/hooks/useGameNavigation'
import type { NavigableManager } from '@/types/navigableManager'

function mockManager(totalPlies = 5): NavigableManager {
  return {
    getFen: vi.fn(),
    getLastMove: vi.fn(),
    getMoveType: vi.fn(),
    goto: vi.fn(),
    getCurrentPly: vi.fn(),
    getTotalPlies: vi.fn().mockReturnValue(totalPlies),
  }
}

function makeNav(currentPly: number, totalPlies = 5) {
  const updateBoardState = vi.fn()
  const manager = mockManager(totalPlies)
  const { result } = renderHook(() =>
    useGameNavigation({ chessManager: manager, currentPly, updateBoardState })
  )
  return { result, updateBoardState, manager }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useGameNavigation', () => {
  describe('when chessManager is null', () => {
    it('all handlers are no-ops and do not call updateBoardState', () => {
      const updateBoardState = vi.fn()
      const { result } = renderHook(() =>
        useGameNavigation({ chessManager: null, currentPly: 2, updateBoardState })
      )
      result.current.handleFirst()
      result.current.handlePrev()
      result.current.handleNext()
      result.current.handleLast()
      result.current.handleJump(3)
      expect(updateBoardState).not.toHaveBeenCalled()
    })
  })

  describe('handleFirst', () => {
    it('calls updateBoardState(manager, 0)', () => {
      const { result, updateBoardState, manager } = makeNav(3)
      result.current.handleFirst()
      expect(updateBoardState).toHaveBeenCalledWith(manager, 0)
    })
  })

  describe('handlePrev', () => {
    it('at ply 3 calls updateBoardState(manager, 2)', () => {
      const { result, updateBoardState, manager } = makeNav(3)
      result.current.handlePrev()
      expect(updateBoardState).toHaveBeenCalledWith(manager, 2)
    })

    it('at ply 0 clamps to 0 and calls updateBoardState(manager, 0)', () => {
      const { result, updateBoardState, manager } = makeNav(0)
      result.current.handlePrev()
      expect(updateBoardState).toHaveBeenCalledWith(manager, 0)
    })
  })

  describe('handleNext', () => {
    it('at ply 2 with totalPlies=5 calls updateBoardState(manager, 3) and returns true', () => {
      const { result, updateBoardState, manager } = makeNav(2, 5)
      const advanced = result.current.handleNext()
      expect(advanced).toBe(true)
      expect(updateBoardState).toHaveBeenCalledWith(manager, 3)
    })

    it('at ply 5 with totalPlies=5 does NOT call updateBoardState and returns false', () => {
      const { result, updateBoardState } = makeNav(5, 5)
      const advanced = result.current.handleNext()
      expect(advanced).toBe(false)
      expect(updateBoardState).not.toHaveBeenCalled()
    })
  })

  describe('handleLast', () => {
    it('calls updateBoardState(manager, getTotalPlies())', () => {
      const { result, updateBoardState, manager } = makeNav(2, 5)
      result.current.handleLast()
      expect(updateBoardState).toHaveBeenCalledWith(manager, 5)
    })
  })

  describe('handleJump', () => {
    it('at currentPly=1 calls updateBoardState(manager, 3) when jumping to ply 3', () => {
      const { result, updateBoardState, manager } = makeNav(1)
      result.current.handleJump(3)
      expect(updateBoardState).toHaveBeenCalledWith(manager, 3)
    })

    it('is a no-op when ply === currentPly', () => {
      const { result, updateBoardState } = makeNav(3)
      result.current.handleJump(3)
      expect(updateBoardState).not.toHaveBeenCalled()
    })
  })
})
