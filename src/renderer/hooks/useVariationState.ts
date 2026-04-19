/**
 * useVariationState - manages variation creation, navigation, and persistence.
 *
 * Owns all variation state: the list of saved variations for the current game,
 * the active VariationManager (if exploring a variation), and computed values
 * for BoardDisplay (dests, turnColor) and MoveList (moves, ply).
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import { showErrorToast } from '../utils/errorToast.js'
import type { Key } from '@lichess-org/chessground/types'
import type { VariationData } from '../../shared/types/game.js'
import type { ChessManager } from '../utils/chessManager.js'
import type { NavigableManager } from '../types/navigableManager.js'
import { createVariationManager, type VariationManager } from '../utils/variationManager.js'
import { getCheckColor } from '../utils/chessHelpers.js'
import { resolveVariationMove, resolveMainlineMove } from '../utils/variationRouter.js'

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
  dismissVariation: (id: number) => Promise<void>
  advanceVariation: () => boolean
  variationNav: {
    first: () => void
    prev: () => void
    next: () => void
    last: () => void
    jump: (ply: number) => void
  }
  loadVariations: (collectionId: string, gameId: number) => Promise<void>
  reorderLocalVariations: (branchPly: number, orderedIds: number[]) => void
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

  /**
   * Optimistically reorder local variation state after a drag-to-reorder IPC call.
   * Does NOT call exitVariation, so the active variation is preserved.
   */
  const reorderLocalVariations = useCallback((branchPly: number, orderedIds: number[]) => {
    setVariations(prev => {
      const byId = new Map(prev.map(v => [v.id, v]))
      const reorderedPly = orderedIds
        .map(id => byId.get(id))
        .filter((v): v is VariationData => v !== undefined)
      return [...prev.filter(v => v.branchPly !== branchPly), ...reorderedPly]
    })
  }, [])

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
      showErrorToast('Failed to delete variation', error)
    }
  }, [collectionId, gameId, activeVariationId, exitVariation, chessManager, updateBoardState, variations])

  /**
   * Persist variation to database and update local state.
   * Uses activeVariationIdRef to determine create vs update — the ref is updated
   * synchronously when a variation is entered or created, so it's always current.
   *
   * Sentinel: ref is set to -1 while createVariation is in flight to prevent a
   * second rapid move from issuing a duplicate create. Moves made during the
   * sentinel window are skipped; the next move after creation completes will
   * call updateVariation with the full movesString, so nothing is lost.
   */
  const persistVariation = useCallback((branchPly: number, movesStr: string) => {
    if (!collectionId || gameId === null) return

    const currentId = activeVariationIdRef.current

    if (currentId === -1) {
      // Creation in progress — skip; next move will updateVariation with full string
      return
    }

    if (currentId !== null) {
      // Update existing variation
      window.electron.updateVariation(collectionId, gameId, currentId, movesStr)
        .then(saved => {
          if (saved) {
            setVariations(prev => prev.map(s => s.id === currentId ? saved : s))
          }
        })
        .catch(error => {
          showErrorToast('Failed to save variation', error)
        })
    } else {
      // Create new variation — sentinel prevents duplicate creates during IPC round-trip
      activeVariationIdRef.current = -1
      window.electron.createVariation(collectionId, gameId, branchPly, movesStr)
        .then(saved => {
          if (saved) {
            activeVariationIdRef.current = saved.id ?? null
            setActiveVariationId(saved.id ?? null)
            setVariations(prev => [...prev, saved])
          } else {
            activeVariationIdRef.current = null
          }
        })
        .catch(error => {
          showErrorToast('Failed to save variation', error)
          activeVariationIdRef.current = null
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
      void dismissVariation(pendingDeletion)
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
      if (activeVariation && activeBranchPly !== null && activeVariation.getCurrentPly() > 0) {
        // Already in a variation — try appending the move
        const san = activeVariation.tryMove(from, to)
        if (!san) return false

        const action = resolveVariationMove({
          san,
          nextSan: activeVariation.getNextSan() ?? undefined,
          currentVariationPly: activeVariation.getCurrentPly(),
        })
        if (action.type === 'advance') {
          activeVariation.goto(action.nextPly)
          updateBoardState(activeVariation, action.nextPly)
          syncVariationState(activeVariation)
          return true
        }
        // truncate_and_append
        activeVariation.appendMove(action.san)
        updateBoardState(activeVariation, activeVariation.getCurrentPly())
        syncVariationState(activeVariation)
        persistVariation(activeBranchPly, activeVariation.getMovesString())
        return true
      }

      // At ply 0 of a variation — user navigated back to the branch point.
      // Exit so the mainline logic handles this move correctly.
      if (activeVariation && activeBranchPly !== null && activeVariation.getCurrentPly() === 0) {
        exitVariation()
      }

      // Not in a variation — check if the move matches the mainline.
      const ply = currentPlyRef.current
      const san = chessManager.tryMove(from, to)
      if (!san) return false

      const action = resolveMainlineMove({
        san,
        currentPly: ply,
        mainlineSan: chessManager.getMainlineSan(ply + 1),
        variations,
      })
      if (action.type === 'advance_mainline') {
        updateBoardState(chessManager, action.nextPly)
        return true
      }
      if (action.type === 'enter_variation') {
        enterVariation(action.id, action.branchPly, 1)
        return true
      }
      // create_variation
      const fen = chessManager.getFenAtPly(ply)
      if (!fen) return false

      activeVariationIdRef.current = null
      setActiveVariationId(null)

      const manager = createVariationManager(fen)
      if (!manager.appendMove(action.san)) return false

      setActiveVariation(manager)
      setActiveBranchPly(action.branchPly)
      updateBoardState(manager, manager.getCurrentPly())
      syncVariationState(manager)
      persistVariation(action.branchPly, manager.getMovesString())
      return true
    }

    if (!attemptMove()) {
      forceBoardSync()
    }
  }, [chessManager, collectionId, gameId, activeVariation, activeBranchPly, variations, enterVariation, exitVariation, updateBoardState, syncVariationState, autoPlayStop, persistVariation, forceBoardSync])

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

  const variationNavFirst = useCallback(() => {
    navigateVariation(() => 0)
  }, [navigateVariation])

  const variationNavPrev = useCallback(() => {
    // At variation ply <= 1, "back" exits the variation and lands on the mainline
    // at branchPly - 1 (the parent position). At ply 1 this moves the board one step
    // back; at ply 0 it just clears variation state (board FEN is already equal).
    if (activeVariation && activeBranchPly !== null && chessManager && activeVariation.getCurrentPly() <= 1) {
      exitVariation()
      updateBoardState(chessManager, Math.max(0, activeBranchPly - 1))
      return
    }
    navigateVariation(m => {
      const ply = m.getCurrentPly()
      return ply > 0 ? ply - 1 : null
    })
  }, [navigateVariation, activeVariation, activeBranchPly, chessManager, exitVariation, updateBoardState])

  const variationNavNext = useCallback(() => {
    navigateVariation(m => {
      const ply = m.getCurrentPly()
      return ply < m.getTotalPlies() ? ply + 1 : null
    })
  }, [navigateVariation])

  const variationNavLast = useCallback(() => {
    navigateVariation(m => m.getTotalPlies())
  }, [navigateVariation])

  const variationNavJump = useCallback((ply: number) => {
    navigateVariation(() => ply)
  }, [navigateVariation])

  const variationNav = useMemo(() => ({
    first: variationNavFirst,
    prev: variationNavPrev,
    next: variationNavNext,
    last: variationNavLast,
    jump: variationNavJump,
  }), [variationNavFirst, variationNavPrev, variationNavNext, variationNavLast, variationNavJump])

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
    reorderLocalVariations,
    dests,
    turnColor,
    checkColor,
    pendingDeletion,
    requestDeletion,
    confirmDeletion,
    cancelDeletion,
  }
}
