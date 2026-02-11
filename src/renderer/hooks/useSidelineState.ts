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

export interface UseSidelineStateParams {
  chessManager: ChessManager | null
  collectionId: string | null
  gameId: number | null
  currentPly: number
  updateBoardState: (manager: NavigableManager, ply: number) => void
  autoPlayStop: () => void
}

export interface UseSidelineStateReturn {
  sidelines: SidelineData[]
  isInSideline: boolean
  activeBranchPly: number | null
  sidelineMoves: string[]
  sidelinePly: number
  handleUserMove: (from: string, to: string) => void
  exitSideline: () => void
  dismissSideline: (branchPly: number) => void
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
}: UseSidelineStateParams): UseSidelineStateReturn {
  const [sidelines, setSidelines] = useState<SidelineData[]>([])
  const [activeSideline, setActiveSideline] = useState<SidelineManager | null>(null)
  const [activeBranchPly, setActiveBranchPly] = useState<number | null>(null)
  const [sidelinePly, setSidelinePly] = useState(0)
  const [sidelineMoves, setSidelineMoves] = useState<string[]>([])
  const [dests, setDests] = useState<Map<Key, Key[]>>(new Map())
  const [turnColor, setTurnColor] = useState<'white' | 'black'>('white')

  // Refs for stable access in callbacks without re-creating them
  const currentPlyRef = useRef(currentPly)
  currentPlyRef.current = currentPly

  const isInSideline = activeSideline !== null

  /** Update sideline-derived state from the active manager */
  const syncSidelineState = useCallback((manager: SidelineManager) => {
    const movesStr = manager.getMovesString()
    setSidelineMoves(movesStr ? movesStr.split(' ') : [])
    setSidelinePly(manager.getCurrentPly())
    setDests(manager.getDests() as Map<Key, Key[]>)
    setTurnColor(manager.getTurnColor())
  }, [])

  const exitSideline = useCallback(() => {
    setActiveSideline(null)
    setActiveBranchPly(null)
    setSidelineMoves([])
    setSidelinePly(0)
    setDests(new Map())
  }, [])

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

      // If we're dismissing the active sideline, exit it
      if (activeBranchPly === branchPly) {
        exitSideline()
      }
    } catch (error) {
      console.error('Failed to delete sideline:', error)
    }
  }, [collectionId, gameId, activeBranchPly, exitSideline])

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

    if (activeSideline && activeBranchPly !== null) {
      // Already in a sideline — try appending the move
      const san = activeSideline.tryMove(from, to)
      if (!san) return

      activeSideline.appendMove(san)

      // Update board from sideline manager
      updateBoardState(activeSideline, activeSideline.getCurrentPly())
      syncSidelineState(activeSideline)

      // Persist
      persistSideline(activeBranchPly, activeSideline.getMovesString())
      return
    }

    // Not in a sideline — check if the move matches the mainline
    const ply = currentPlyRef.current
    const san = chessManager.tryMove(from, to)
    if (!san) return

    const mainlineSan = chessManager.getMainlineSan(ply + 1)
    if (mainlineSan === san) {
      // Matches mainline — just advance
      updateBoardState(chessManager, ply + 1)
      return
    }

    // Different move — create a sideline
    const totalPlies = chessManager.getTotalPlies()
    const maxSidelines = getMaxSidelines(totalPlies)
    if (sidelines.length >= maxSidelines) {
      console.warn(`Sideline density limit reached (${maxSidelines})`)
      return
    }

    // Check if a sideline already exists at this branch point
    const branchPly = ply + 1
    const existing = sidelines.find(s => s.branchPly === branchPly)

    const fen = chessManager.getFenAtPly(ply)
    if (!fen) return

    const manager = createSidelineManager(fen, existing?.moves)
    manager.goto(manager.getTotalPlies()) // Go to end of existing moves

    // Append the new move
    if (!manager.appendMove(san)) return

    setActiveSideline(manager)
    setActiveBranchPly(branchPly)

    // Update board from sideline manager
    updateBoardState(manager, manager.getCurrentPly())
    syncSidelineState(manager)

    // Persist
    persistSideline(branchPly, manager.getMovesString())
  }, [chessManager, collectionId, gameId, activeSideline, activeBranchPly, sidelines, updateBoardState, syncSidelineState, autoPlayStop, persistSideline])

  /** Navigate sideline to a computed ply */
  const navigateSideline = useCallback((computePly: (manager: SidelineManager) => number | null) => {
    if (!activeSideline) return
    const ply = computePly(activeSideline)
    if (ply === null) return
    activeSideline.goto(ply)
    updateBoardState(activeSideline, ply)
    syncSidelineState(activeSideline)
  }, [activeSideline, updateBoardState, syncSidelineState])

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

  return {
    sidelines,
    isInSideline,
    activeBranchPly,
    sidelineMoves,
    sidelinePly,
    handleUserMove,
    exitSideline,
    dismissSideline,
    sidelineNav,
    loadSidelines,
    dests,
    turnColor,
  }
}
