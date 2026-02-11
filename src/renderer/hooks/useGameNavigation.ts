import { useCallback } from 'react'
import type { NavigableManager } from '../types/navigableManager.js'

export interface UseGameNavigationParams {
  /** Chess manager instance (null if no game is loaded) */
  chessManager: NavigableManager | null
  /** Current ply (half-move) position */
  currentPly: number
  /** Callback to update board state at a given ply */
  updateBoardState: (manager: NavigableManager, ply: number) => void
}

export interface UseGameNavigationReturn {
  /** Navigate to the initial position (ply 0) */
  handleFirst: () => void
  /** Navigate to the previous move */
  handlePrev: () => void
  /** Navigate to the next move. Returns true if advanced, false if at end */
  handleNext: () => boolean
  /** Navigate to the final position */
  handleLast: () => void
  /** Jump to a specific ply */
  handleJump: (ply: number) => void
}

/**
 * Provides navigation handlers for stepping through a chess game.
 * All handlers are no-ops when chessManager is null.
 */
export function useGameNavigation({
  chessManager,
  currentPly,
  updateBoardState,
}: UseGameNavigationParams): UseGameNavigationReturn {

  const handleFirst = useCallback(() => {
    if (!chessManager) return
    updateBoardState(chessManager, 0)
  }, [chessManager, updateBoardState])

  const handlePrev = useCallback(() => {
    if (!chessManager) return
    updateBoardState(chessManager, Math.max(0, currentPly - 1))
  }, [chessManager, currentPly, updateBoardState])

  const handleNext = useCallback((): boolean => {
    if (!chessManager) return false
    const totalPlies = chessManager.getTotalPlies()
    if (currentPly < totalPlies) {
      updateBoardState(chessManager, currentPly + 1)
      return true
    }
    return false
  }, [chessManager, currentPly, updateBoardState])

  const handleLast = useCallback(() => {
    if (!chessManager) return
    updateBoardState(chessManager, chessManager.getTotalPlies())
  }, [chessManager, updateBoardState])

  const handleJump = useCallback((ply: number) => {
    if (!chessManager) return
    updateBoardState(chessManager, ply)
  }, [chessManager, updateBoardState])

  return {
    handleFirst,
    handlePrev,
    handleNext,
    handleLast,
    handleJump,
  }
}
