/**
 * useVariationState - manages variation creation, navigation, and persistence.
 *
 * Owns all variation state: the list of saved variations for the current game,
 * the active VariationManager (if exploring a variation), and computed values
 * for BoardDisplay (dests, turnColor) and MoveList (moves, ply).
 */

import { useState, useCallback, useRef } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import type { VariationData } from '../../shared/types/game.js'
import type { ChessManager } from '../utils/chessManager.js'
import type { NavigableManager } from '../types/navigableManager.js'
import { createVariationManager, type VariationManager } from '../utils/variationManager.js'
import { getCheckColor } from '../utils/chessHelpers.js'

export interface UseVariationStateParams {
  chessManager: ChessManager | null
  collectionId: string | null
  gameId: number | null
  currentPly: number
  updateBoardState: (manager: NavigableManager, ply: number) => void
  autoPlayStop: () => void
  forceBoardSync: () => void
}

export interface UseVariationStateReturn {
  variations: VariationData[]
  isInVariation: boolean
  activeBranchPly: number | null
  activeVariationId: number | null
  variationMoves: string[]
  variationPly: number
  variationMaxPly: number
  handleUserMove: (from: string, to: string) => void
  exitVariation: () => void
  jumpToVariationMove: (id: number, branchPly: number, ply: number) => void
  dismissVariation: (id: number) => void
  advanceVariation: () => boolean
  variationNav: {
    first: () => void
    prev: () => void
    next: () => void
    last: () => void
    jump: (ply: number) => void
  }
  loadVariations: (collectionId: string, gameId: number) => Promise<void>
  dests: Map<Key, Key[]>
  turnColor: 'white' | 'black'
  checkColor: 'white' | 'black' | false
  pendingDeletion: number | null
  requestDeletion: (id: number) => void
  confirmDeletion: () => void
  cancelDeletion: () => void
}

export function useVariationState({
  chessManager,
  collectionId,
  gameId,
  currentPly,
  updateBoardState,
  autoPlayStop,
  forceBoardSync,
}: UseVariationStateParams): UseVariationStateReturn {
  const [variations, setVariations] = useState<VariationData[]>([])
  const [activeVariation, setActiveVariation] = useState<VariationManager | null>(null)
  const [activeBranchPly, setActiveBranchPly] = useState<number | null>(null)
  const [activeVariationId, setActiveVariationId] = useState<number | null>(null)
  const [variationPly, setVariationPly] = useState(0)
  const [variationMaxPly, setVariationMaxPly] = useState(0)
  const [variationMoves, setVariationMoves] = useState<string[]>([])
  const [dests, setDests] = useState<Map<Key, Key[]>>(new Map())
  const [turnColor, setTurnColor] = useState<'white' | 'black'>('white')
  const [checkColor, setCheckColor] = useState<'white' | 'black' | false>(false)
  const [pendingDeletion, setPendingDeletion] = useState<number | null>(null)

  // Mirror currentPly in a ref to avoid re-creating handleUserMove on every ply change.
  const currentPlyRef = useRef(currentPly)
  currentPlyRef.current = currentPly

  // Ref for the active variation id — allows persistVariation to access it synchronously
  // without being in its dependency array (avoids stale closures).
  const activeVariationIdRef = useRef<number | null>(null)

  const isInVariation = activeVariation !== null

  /** Update variation-derived state from the active manager */
  const syncVariationState = useCallback((manager: VariationManager) => {
    const movesStr = manager.getMovesString()
    setVariationMoves(movesStr ? movesStr.split(' ') : [])
    const ply = manager.getCurrentPly()
    setVariationPly(ply)
    setVariationMaxPly(manager.getTotalPlies())
    setDests(manager.getDests() as Map<Key, Key[]>)
    const turn = manager.getTurnColor()
    setTurnColor(turn)
    const moveType = manager.getMoveType(ply)
    setCheckColor(getCheckColor(moveType, turn))
  }, [])

  const exitVariation = useCallback(() => {
    autoPlayStop()
    setActiveVariation(null)
    setActiveBranchPly(null)
    setActiveVariationId(null)
    activeVariationIdRef.current = null
    setVariationMoves([])
    setVariationPly(0)
    setVariationMaxPly(0)
    setDests(new Map())
    setCheckColor(false)
  }, [autoPlayStop])

  /** Enter an existing saved variation by id, optionally jumping to a target ply. */
  const enterVariation = useCallback((id: number, branchPly: number, targetPly?: number) => {
    if (!chessManager) return
    autoPlayStop()
    const variationData = variations.find(s => s.id === id)
    if (!variationData) return
    const fen = chessManager.getFenAtPly(branchPly - 1)
    if (!fen) return
    const manager = createVariationManager(fen, variationData.moves)
    const ply = targetPly ?? manager.getTotalPlies()
    manager.goto(ply)
    setActiveVariation(manager)
    setActiveBranchPly(branchPly)
    setActiveVariationId(id)
    activeVariationIdRef.current = id
    updateBoardState(manager, ply)
    syncVariationState(manager)
  }, [chessManager, variations, updateBoardState, syncVariationState, autoPlayStop])

  const loadVariations = useCallback(async (colId: string, gId: number) => {
    const data = await window.electron.getVariations(colId, gId)
    setVariations(data)
    exitVariation()
  }, [exitVariation])

  const dismissVariation = useCallback(async (id: number) => {
    if (!collectionId || gameId === null) return
    // Capture before removal so we can navigate mainline after dismissal
    const dismissed = variations.find(s => s.id === id)

    try {
      await window.electron.deleteVariation(collectionId, gameId, id)
      setVariations(prev => prev.filter(s => s.id !== id))

      if (activeVariationId === id) {
        exitVariation()
        if (chessManager && dismissed) {
          updateBoardState(chessManager, dismissed.branchPly)
        }
      }
    } catch (error) {
      console.error('Failed to delete variation:', error)
    }
  }, [collectionId, gameId, activeVariationId, exitVariation, chessManager, updateBoardState, variations])

  /**
   * Persist variation to database and update local state.
   * Uses activeVariationIdRef to determine create vs update — the ref is updated
   * synchronously when a variation is entered or created, so it's always current.
   */
  const persistVariation = useCallback((branchPly: number, movesStr: string) => {
    if (!collectionId || gameId === null) return

    const currentId = activeVariationIdRef.current

    if (currentId !== null) {
      // Update existing variation
      window.electron.updateVariation(collectionId, gameId, currentId, movesStr)
        .then(saved => {
          if (saved) {
            setVariations(prev => prev.map(s => s.id === currentId ? saved : s))
          }
        })
        .catch(error => {
          console.error('Failed to update variation:', error)
        })
    } else {
      // Create new variation
      window.electron.createVariation(collectionId, gameId, branchPly, movesStr)
        .then(saved => {
          if (saved) {
            activeVariationIdRef.current = saved.id ?? null
            setActiveVariationId(saved.id ?? null)
            setVariations(prev => [...prev, saved])
          }
        })
        .catch(error => {
          console.error('Failed to create variation:', error)
        })
    }
  }, [collectionId, gameId])

  /** Request deletion of a variation (shows confirmation dialog) */
  const requestDeletion = useCallback((id: number) => {
    setPendingDeletion(id)
  }, [])

  /** Confirm deletion of pending variation */
  const confirmDeletion = useCallback(() => {
    if (pendingDeletion !== null) {
      dismissVariation(pendingDeletion)
      setPendingDeletion(null)
    }
  }, [pendingDeletion, dismissVariation])

  /** Cancel deletion of pending variation */
  const cancelDeletion = useCallback(() => {
    setPendingDeletion(null)
  }, [])

  const handleUserMove = useCallback((from: string, to: string) => {
    if (!chessManager || !collectionId || gameId === null) return

    autoPlayStop()

    const attemptMove = (): boolean => {
      if (activeVariation && activeBranchPly !== null) {
        // Already in a variation — try appending the move
        const san = activeVariation.tryMove(from, to)
        if (!san) return false

        const nextSan = activeVariation.getNextSan()
        if (nextSan === san) {
          // Advance through existing variation without truncation
          const nextPly = activeVariation.getCurrentPly() + 1
          activeVariation.goto(nextPly)
          updateBoardState(activeVariation, nextPly)
          syncVariationState(activeVariation)
          return true
        }

        // Different move — truncate and append
        activeVariation.appendMove(san)
        updateBoardState(activeVariation, activeVariation.getCurrentPly())
        syncVariationState(activeVariation)
        persistVariation(activeBranchPly, activeVariation.getMovesString())
        return true
      }

      // Not in a variation — check if the move matches the mainline.
      const ply = currentPlyRef.current
      const san = chessManager.tryMove(from, to)
      if (!san) return false

      const mainlineSan = chessManager.getMainlineSan(ply + 1)
      if (mainlineSan === san) {
        // Matches mainline — just advance
        updateBoardState(chessManager, ply + 1)
        return true
      }

      // Different move — check for a matching existing variation at this branch point.
      const branchPly = ply + 1
      const matchingVariation = variations.find(s => {
        if (s.branchPly !== branchPly) return false
        return s.moves.split(' ')[0] === san
      })

      if (matchingVariation) {
        // Enter the matching variation
        enterVariation(matchingVariation.id!, branchPly, 1)
        return true
      }

      // No matching variation — create a new one (stacks with any existing at this ply).
      const fen = chessManager.getFenAtPly(ply)
      if (!fen) return false

      // Reset id ref so persistVariation calls createVariation
      activeVariationIdRef.current = null
      setActiveVariationId(null)

      const manager = createVariationManager(fen)
      if (!manager.appendMove(san)) return false

      setActiveVariation(manager)
      setActiveBranchPly(branchPly)
      updateBoardState(manager, manager.getCurrentPly())
      syncVariationState(manager)
      persistVariation(branchPly, manager.getMovesString())
      return true
    }

    if (!attemptMove()) {
      forceBoardSync()
    }
  }, [chessManager, collectionId, gameId, activeVariation, activeBranchPly, variations, enterVariation, updateBoardState, syncVariationState, autoPlayStop, persistVariation, forceBoardSync])

  /** Navigate variation to a computed ply. */
  const navigateVariation = useCallback((computePly: (manager: VariationManager) => number | null): boolean => {
    if (!activeVariation) return false
    const ply = computePly(activeVariation)
    if (ply === null) return false
    if (ply === activeVariation.getCurrentPly()) return false
    activeVariation.goto(ply)
    updateBoardState(activeVariation, ply)
    syncVariationState(activeVariation)
    return true
  }, [activeVariation, updateBoardState, syncVariationState])

  /** Advance variation by one ply. Returns true if advanced. */
  const advanceVariation = useCallback((): boolean => {
    return navigateVariation(m => {
      const ply = m.getCurrentPly()
      return ply < m.getTotalPlies() ? ply + 1 : null
    })
  }, [navigateVariation])

  const variationNav = {
    first: useCallback(() => {
      navigateVariation(() => 0)
    }, [navigateVariation]),

    prev: useCallback(() => {
      navigateVariation(m => {
        const ply = m.getCurrentPly()
        return ply > 0 ? ply - 1 : null
      })
    }, [navigateVariation]),

    next: useCallback(() => {
      navigateVariation(m => {
        const ply = m.getCurrentPly()
        return ply < m.getTotalPlies() ? ply + 1 : null
      })
    }, [navigateVariation]),

    last: useCallback(() => {
      navigateVariation(m => m.getTotalPlies())
    }, [navigateVariation]),

    jump: useCallback((ply: number) => {
      navigateVariation(() => ply)
    }, [navigateVariation]),
  }

  /**
   * Jump to a specific move in a variation by id.
   * If already in the target variation, navigates to the ply.
   * Otherwise, enters the variation and navigates to the ply.
   */
  const jumpToVariationMove = useCallback((id: number, branchPly: number, ply: number) => {
    if (activeBranchPly === branchPly && activeVariationId === id && isInVariation) {
      navigateVariation(() => ply)
    } else {
      enterVariation(id, branchPly, ply)
    }
  }, [activeBranchPly, activeVariationId, isInVariation, navigateVariation, enterVariation])

  return {
    variations,
    isInVariation,
    activeBranchPly,
    activeVariationId,
    variationMoves,
    variationPly,
    variationMaxPly,
    handleUserMove,
    exitVariation,
    jumpToVariationMove,
    dismissVariation,
    advanceVariation,
    variationNav,
    loadVariations,
    dests,
    turnColor,
    checkColor,
    pendingDeletion,
    requestDeletion,
    confirmDeletion,
    cancelDeletion,
  }
}
