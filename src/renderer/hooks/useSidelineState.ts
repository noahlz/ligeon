/**
 * useSidelineState - manages sideline creation, navigation, and persistence.
 *
 * Owns all sideline state: the list of saved sidelines for the current game,
 * the active SidelineManager (if exploring a sideline), and computed values
 * for BoardDisplay (dests, turnColor) and MoveList (moves, ply).
 */

import { useState, useCallback, useRef } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import type { SidelineData } from '../../shared/types/game.js'
import type { ChessManager } from '../utils/chessManager.js'
import type { NavigableManager } from '../types/navigableManager.js'
import { createSidelineManager, type SidelineManager } from '../utils/sidelineManager.js'
import { getCheckColor } from '../utils/chessHelpers.js'

export interface UseSidelineStateParams {
  chessManager: ChessManager | null
  collectionId: string | null
  gameId: number | null
  currentPly: number
  updateBoardState: (manager: NavigableManager, ply: number) => void
  autoPlayStop: () => void
  forceBoardSync: () => void
}

export interface UseSidelineStateReturn {
  sidelines: SidelineData[]
  isInSideline: boolean
  activeBranchPly: number | null
  sidelineMoves: string[]
  sidelinePly: number
  sidelineMaxPly: number
  handleUserMove: (from: string, to: string) => void
  exitSideline: () => void
  enterSideline: (branchPly: number, targetPly?: number) => void
  jumpToSidelineMove: (branchPly: number, ply: number) => void
  dismissSideline: (branchPly: number) => void
  advanceSideline: () => boolean
  sidelineNav: {
    first: () => void
    prev: () => void
    next: () => void
    last: () => void
    jump: (ply: number) => void
  }
  loadSidelines: (collectionId: string, gameId: number) => Promise<void>
  dests: Map<Key, Key[]>
  turnColor: 'white' | 'black'
  checkColor: 'white' | 'black' | false
}

/**
 * Calculate maximum allowed sidelines based on game length.
 * Formula: max(1, floor(totalPlies / 12))
 * @param totalPlies - Total half-moves in the game
 * @returns Maximum number of sidelines allowed
 */
export function getMaxSidelines(totalPlies: number): number {
  return Math.max(1, Math.floor(totalPlies / 12))
}

export function useSidelineState({
  chessManager,
  collectionId,
  gameId,
  currentPly,
  updateBoardState,
  autoPlayStop,
  forceBoardSync,
}: UseSidelineStateParams): UseSidelineStateReturn {
  const [sidelines, setSidelines] = useState<SidelineData[]>([])
  const [activeSideline, setActiveSideline] = useState<SidelineManager | null>(null)
  const [activeBranchPly, setActiveBranchPly] = useState<number | null>(null)
  const [sidelinePly, setSidelinePly] = useState(0)
  const [sidelineMaxPly, setSidelineMaxPly] = useState(0)
  const [sidelineMoves, setSidelineMoves] = useState<string[]>([])
  const [dests, setDests] = useState<Map<Key, Key[]>>(new Map())
  const [turnColor, setTurnColor] = useState<'white' | 'black'>('white')
  const [checkColor, setCheckColor] = useState<'white' | 'black' | false>(false)

  // Mirror currentPly in a ref to avoid re-creating handleUserMove on every ply change.
  // Keeps callback reference stable for performance and prevents unnecessary re-renders.
  const currentPlyRef = useRef(currentPly)
  currentPlyRef.current = currentPly

  const isInSideline = activeSideline !== null

  /** Update sideline-derived state from the active manager */
  const syncSidelineState = useCallback((manager: SidelineManager) => {
    const movesStr = manager.getMovesString()
    setSidelineMoves(movesStr ? movesStr.split(' ') : [])
    const ply = manager.getCurrentPly()
    setSidelinePly(ply)
    setSidelineMaxPly(manager.getTotalPlies())
    setDests(manager.getDests() as Map<Key, Key[]>)
    const turn = manager.getTurnColor()
    setTurnColor(turn)
    const moveType = manager.getMoveType(ply)
    setCheckColor(getCheckColor(moveType, turn))
  }, [])

  const exitSideline = useCallback(() => {
    autoPlayStop()
    setActiveSideline(null)
    setActiveBranchPly(null)
    setSidelineMoves([])
    setSidelinePly(0)
    setSidelineMaxPly(0)
    setDests(new Map())
    setCheckColor(false)
  }, [autoPlayStop])

  /** Enter an existing saved sideline by branchPly, optionally jumping to a target ply. */
  const enterSideline = useCallback((branchPly: number, targetPly?: number) => {
    if (!chessManager) return
    autoPlayStop()
    const sidelineData = sidelines.find(s => s.branchPly === branchPly)
    if (!sidelineData) return
    const fen = chessManager.getFenAtPly(branchPly - 1)
    if (!fen) return
    const manager = createSidelineManager(fen, sidelineData.moves)
    const ply = targetPly ?? manager.getTotalPlies()
    manager.goto(ply)
    setActiveSideline(manager)
    setActiveBranchPly(branchPly)
    updateBoardState(manager, ply)
    syncSidelineState(manager)
  }, [chessManager, sidelines, updateBoardState, syncSidelineState, autoPlayStop])

  const loadSidelines = useCallback(async (colId: string, gId: number) => {
    const data = await window.electron.getSidelines(colId, gId)
    setSidelines(data)
    // Clear active sideline when loading new game
    exitSideline()
  }, [exitSideline])

  const dismissSideline = useCallback(async (branchPly: number) => {
    if (!collectionId || gameId === null) return

    try {
      await window.electron.deleteSideline(collectionId, gameId, branchPly)
      setSidelines(prev => prev.filter(s => s.branchPly !== branchPly))

      // If we're dismissing the active sideline, exit and navigate to the mainline move that was replaced
      if (activeBranchPly === branchPly) {
        exitSideline()
        if (chessManager) {
          updateBoardState(chessManager, branchPly)
        }
      }
    } catch (error) {
      console.error('Failed to delete sideline:', error)
    }
  }, [collectionId, gameId, activeBranchPly, exitSideline, chessManager, updateBoardState])

  /** Persist sideline to database and update local state */
  const persistSideline = useCallback((branchPly: number, movesStr: string) => {
    if (!collectionId || gameId === null) return

    window.electron.upsertSideline(collectionId, gameId, branchPly, movesStr)
      .then(saved => {
        if (saved) {
          setSidelines(prev => {
            const idx = prev.findIndex(s => s.branchPly === branchPly)
            if (idx >= 0) {
              const updated = [...prev]
              updated[idx] = saved
              return updated
            }
            return [...prev, saved]
          })
        }
      })
      .catch(error => {
        console.error('Failed to persist sideline:', error)
      })
  }, [collectionId, gameId])

  const handleUserMove = useCallback((from: string, to: string) => {
    if (!chessManager || !collectionId || gameId === null) return

    autoPlayStop()

    /** Attempt move and handle success/failure paths. Returns true on success. */
    const attemptMove = (): boolean => {
      // Three-way branch: already in sideline, matches mainline, or creates new sideline.
      // Priority: extend active sideline first, then check if move continues mainline,
      // finally create a new sideline if the move differs from mainline.
      if (activeSideline && activeBranchPly !== null) {
        // Already in a sideline — try appending the move
        const san = activeSideline.tryMove(from, to)
        if (!san) return false

        activeSideline.appendMove(san)

        // Update board from sideline manager
        updateBoardState(activeSideline, activeSideline.getCurrentPly())
        syncSidelineState(activeSideline)

        // Persist
        persistSideline(activeBranchPly, activeSideline.getMovesString())
        return true
      }

      // Not in a sideline — check if the move matches the mainline.
      // If it matches, just advance the mainline without creating a sideline.
      const ply = currentPlyRef.current
      const san = chessManager.tryMove(from, to)
      if (!san) return false

      const mainlineSan = chessManager.getMainlineSan(ply + 1)
      if (mainlineSan === san) {
        // Matches mainline — just advance
        updateBoardState(chessManager, ply + 1)
        return true
      }

      // Different move — create a sideline.
      // Density limit prevents UI clutter: max 1 sideline per 12 plys (6 full moves).
      // Short games get fewer sideline slots.
      const totalPlies = chessManager.getTotalPlies()
      const maxSidelines = getMaxSidelines(totalPlies)
      if (sidelines.length >= maxSidelines) {
        console.warn(`Sideline density limit reached (${maxSidelines})`)
        return false
      }

      // Check if a sideline already exists at this branch point.
      // branchPly is ply + 1 (1-indexed) — it's the mainline ply the sideline *replaces*.
      const branchPly = ply + 1
      const existing = sidelines.find(s => s.branchPly === branchPly)

      const fen = chessManager.getFenAtPly(ply)
      if (!fen) return false

      // If a sideline already exists at this branch point, load it and go to the end.
      // This lets the user extend an existing variation rather than overwriting it.
      const manager = createSidelineManager(fen, existing?.moves)
      manager.goto(manager.getTotalPlies()) // Go to end of existing moves

      // Append the new move
      if (!manager.appendMove(san)) return false

      setActiveSideline(manager)
      setActiveBranchPly(branchPly)

      // Update board from sideline manager
      updateBoardState(manager, manager.getCurrentPly())
      syncSidelineState(manager)

      // Persist
      persistSideline(branchPly, manager.getMovesString())
      return true
    }

    if (!attemptMove()) {
      forceBoardSync()
    }
  }, [chessManager, collectionId, gameId, activeSideline, activeBranchPly, sidelines, updateBoardState, syncSidelineState, autoPlayStop, persistSideline, forceBoardSync])

  /** Navigate sideline to a computed ply. Returns true if navigation occurred.
   * Takes a compute function instead of a ply number to DRY the null-check + goto + sync pattern.
   * Each nav direction (first/prev/next/last) just provides its own compute logic.
   */
  const navigateSideline = useCallback((computePly: (manager: SidelineManager) => number | null): boolean => {
    if (!activeSideline) return false
    const ply = computePly(activeSideline)
    if (ply === null) return false
    activeSideline.goto(ply)
    updateBoardState(activeSideline, ply)
    syncSidelineState(activeSideline)
    return true
  }, [activeSideline, updateBoardState, syncSidelineState])

  /** Advance sideline by one ply. Returns true if advanced, false if at end or not in sideline. */
  const advanceSideline = useCallback((): boolean => {
    return navigateSideline(m => {
      const ply = m.getCurrentPly()
      return ply < m.getTotalPlies() ? ply + 1 : null
    })
  }, [navigateSideline])

  // Sideline navigation
  const sidelineNav = {
    first: useCallback(() => {
      navigateSideline(() => 0)
    }, [navigateSideline]),

    prev: useCallback(() => {
      navigateSideline(m => {
        const ply = m.getCurrentPly()
        return ply > 0 ? ply - 1 : null
      })
    }, [navigateSideline]),

    next: useCallback(() => {
      navigateSideline(m => {
        const ply = m.getCurrentPly()
        return ply < m.getTotalPlies() ? ply + 1 : null
      })
    }, [navigateSideline]),

    last: useCallback(() => {
      navigateSideline(m => m.getTotalPlies())
    }, [navigateSideline]),

    jump: useCallback((ply: number) => {
      navigateSideline(() => ply)
    }, [navigateSideline]),
  }

  /**
   * Jump to a specific move in a sideline.
   * If already in the target sideline, navigates to the ply.
   * Otherwise, enters the sideline and navigates to the ply.
   */
  const jumpToSidelineMove = useCallback((branchPly: number, ply: number) => {
    if (activeBranchPly === branchPly && isInSideline) {
      navigateSideline(() => ply)
    } else {
      enterSideline(branchPly, ply)
    }
  }, [activeBranchPly, isInSideline, navigateSideline, enterSideline])

  return {
    sidelines,
    isInSideline,
    activeBranchPly,
    sidelineMoves,
    sidelinePly,
    sidelineMaxPly,
    handleUserMove,
    exitSideline,
    enterSideline,
    jumpToSidelineMove,
    dismissSideline,
    advanceSideline,
    sidelineNav,
    loadSidelines,
    dests,
    turnColor,
    checkColor,
  }
}
