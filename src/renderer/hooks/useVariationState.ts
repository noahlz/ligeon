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

/**
 * Pending variation replacement request awaiting user confirmation.
 * Set when user makes a move that would replace an existing variation at the same branch point.
 */
export interface PendingVariationReplacement {
  /** 1-based mainline ply where the variation branches */
  branchPly: number
  /** Space-separated SAN moves of the existing variation that would be replaced */
  existingMoves: string
  /** SAN of the new move the user attempted */
  newMove: string
}

export interface UseVariationStateReturn {
  variations: VariationData[]
  isInVariation: boolean
  activeBranchPly: number | null
  variationMoves: string[]
  variationPly: number
  variationMaxPly: number
  handleUserMove: (from: string, to: string) => void
  exitVariation: () => void
  enterVariation: (branchPly: number, targetPly?: number) => void
  jumpToVariationMove: (branchPly: number, ply: number) => void
  dismissVariation: (branchPly: number) => void
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
  pendingReplacement: PendingVariationReplacement | null
  confirmReplacement: () => void
  cancelReplacement: () => void
  pendingDeletion: number | null
  requestDeletion: (branchPly: number) => void
  confirmDeletion: () => void
  cancelDeletion: () => void
}

/**
 * Calculate maximum allowed variations based on game length.
 * Formula: max(1, floor(totalPlies / 12))
 * @param totalPlies - Total half-moves in the game
 * @returns Maximum number of variations allowed
 */
export function getMaxVariations(totalPlies: number): number {
  return Math.max(1, Math.floor(totalPlies / 12))
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
  const [variationPly, setVariationPly] = useState(0)
  const [variationMaxPly, setVariationMaxPly] = useState(0)
  const [variationMoves, setVariationMoves] = useState<string[]>([])
  const [dests, setDests] = useState<Map<Key, Key[]>>(new Map())
  const [turnColor, setTurnColor] = useState<'white' | 'black'>('white')
  const [checkColor, setCheckColor] = useState<'white' | 'black' | false>(false)
  const [pendingReplacement, setPendingReplacement] = useState<PendingVariationReplacement | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<number | null>(null)

  // Mirror currentPly in a ref to avoid re-creating handleUserMove on every ply change.
  // Keeps callback reference stable for performance and prevents unnecessary re-renders.
  const currentPlyRef = useRef(currentPly)
  currentPlyRef.current = currentPly

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
    setVariationMoves([])
    setVariationPly(0)
    setVariationMaxPly(0)
    setDests(new Map())
    setCheckColor(false)
  }, [autoPlayStop])

  /** Enter an existing saved variation by branchPly, optionally jumping to a target ply. */
  const enterVariation = useCallback((branchPly: number, targetPly?: number) => {
    if (!chessManager) return
    autoPlayStop()
    const variationData = variations.find(s => s.branchPly === branchPly)
    if (!variationData) return
    const fen = chessManager.getFenAtPly(branchPly - 1)
    if (!fen) return
    const manager = createVariationManager(fen, variationData.moves)
    const ply = targetPly ?? manager.getTotalPlies()
    manager.goto(ply)
    setActiveVariation(manager)
    setActiveBranchPly(branchPly)
    updateBoardState(manager, ply)
    syncVariationState(manager)
  }, [chessManager, variations, updateBoardState, syncVariationState, autoPlayStop])

  const loadVariations = useCallback(async (colId: string, gId: number) => {
    const data = await window.electron.getVariations(colId, gId)
    setVariations(data)
    // Clear active variation when loading new game
    exitVariation()
  }, [exitVariation])

  const dismissVariation = useCallback(async (branchPly: number) => {
    if (!collectionId || gameId === null) return

    try {
      await window.electron.deleteVariation(collectionId, gameId, branchPly)
      setVariations(prev => prev.filter(s => s.branchPly !== branchPly))

      // If we're dismissing the active variation, exit and navigate to the mainline move that was replaced
      if (activeBranchPly === branchPly) {
        exitVariation()
        if (chessManager) {
          updateBoardState(chessManager, branchPly)
        }
      }
    } catch (error) {
      console.error('Failed to delete variation:', error)
    }
  }, [collectionId, gameId, activeBranchPly, exitVariation, chessManager, updateBoardState])

  /** Persist variation to database and update local state */
  const persistVariation = useCallback((branchPly: number, movesStr: string) => {
    if (!collectionId || gameId === null) return

    window.electron.upsertVariation(collectionId, gameId, branchPly, movesStr)
      .then(saved => {
        if (saved) {
          setVariations(prev => {
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
        console.error('Failed to persist variation:', error)
      })
  }, [collectionId, gameId])

  /** Confirm replacement of existing variation */
  const confirmReplacement = useCallback(() => {
    if (!pendingReplacement || !chessManager) return

    const { branchPly, newMove } = pendingReplacement
    const ply = branchPly - 1
    const fen = chessManager.getFenAtPly(ply)
    if (!fen) return

    // Create new variation with just the new move (replaces existing via upsert)
    const manager = createVariationManager(fen)
    if (!manager.appendMove(newMove)) return

    setActiveVariation(manager)
    setActiveBranchPly(branchPly)
    updateBoardState(manager, manager.getCurrentPly())
    syncVariationState(manager)
    persistVariation(branchPly, manager.getMovesString())

    setPendingReplacement(null)
  }, [pendingReplacement, chessManager, updateBoardState, syncVariationState, persistVariation])

  /** Cancel replacement of existing variation */
  const cancelReplacement = useCallback(() => {
    setPendingReplacement(null)
    forceBoardSync()
  }, [forceBoardSync])

  /** Request deletion of a variation (shows confirmation dialog) */
  const requestDeletion = useCallback((branchPly: number) => {
    setPendingDeletion(branchPly)
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

    /** Attempt move and handle success/failure paths. Returns true on success. */
    const attemptMove = (): boolean => {
      // Three-way branch: already in variation, matches mainline, or creates new variation.
      // Priority: extend active variation first, then check if move continues mainline,
      // finally create a new variation if the move differs from mainline.
      if (activeVariation && activeBranchPly !== null) {
        // Already in a variation — try appending the move
        const san = activeVariation.tryMove(from, to)
        if (!san) return false

        // Check if this move matches the next existing move in the variation
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

        // Update board from variation manager
        updateBoardState(activeVariation, activeVariation.getCurrentPly())
        syncVariationState(activeVariation)

        // Persist
        persistVariation(activeBranchPly, activeVariation.getMovesString())
        return true
      }

      // Not in a variation — check if the move matches the mainline.
      // If it matches, just advance the mainline without creating a variation.
      const ply = currentPlyRef.current
      const san = chessManager.tryMove(from, to)
      if (!san) return false

      const mainlineSan = chessManager.getMainlineSan(ply + 1)
      if (mainlineSan === san) {
        // Matches mainline — just advance
        updateBoardState(chessManager, ply + 1)
        return true
      }

      // Different move — create a variation.
      // Density limit prevents UI clutter: max 1 variation per 12 plys (6 full moves).
      // Short games get fewer variation slots.
      const totalPlies = chessManager.getTotalPlies()
      const maxVariations = getMaxVariations(totalPlies)
      if (variations.length >= maxVariations) {
        console.warn(`Variation density limit reached (${maxVariations})`)
        return false
      }

      // Check if a variation already exists at this branch point.
      // branchPly is ply + 1 (1-indexed) — it's the mainline ply the variation *replaces*.
      const branchPly = ply + 1
      const existing = variations.find(s => s.branchPly === branchPly)

      if (existing) {
        const firstVariationMove = existing.moves.split(' ')[0]
        if (firstVariationMove === san) {
          // Move matches first variation move — enter the variation
          enterVariation(branchPly, 1)
          return true
        }
        // Different move but variation already exists at this branch point — request confirmation
        setPendingReplacement({
          branchPly,
          existingMoves: existing.moves,
          newMove: san,
        })
        return false
      }

      // No existing variation — create new one
      const fen = chessManager.getFenAtPly(ply)
      if (!fen) return false

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

  /** Navigate variation to a computed ply. Returns true if navigation occurred.
   * Takes a compute function instead of a ply number to DRY the null-check + goto + sync pattern.
   * Each nav direction (first/prev/next/last) just provides its own compute logic.
   */
  const navigateVariation = useCallback((computePly: (manager: VariationManager) => number | null): boolean => {
    if (!activeVariation) return false
    const ply = computePly(activeVariation)
    if (ply === null) return false
    activeVariation.goto(ply)
    updateBoardState(activeVariation, ply)
    syncVariationState(activeVariation)
    return true
  }, [activeVariation, updateBoardState, syncVariationState])

  /** Advance variation by one ply. Returns true if advanced, false if at end or not in variation. */
  const advanceVariation = useCallback((): boolean => {
    return navigateVariation(m => {
      const ply = m.getCurrentPly()
      return ply < m.getTotalPlies() ? ply + 1 : null
    })
  }, [navigateVariation])

  // Variation navigation
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
   * Jump to a specific move in a variation.
   * If already in the target variation, navigates to the ply.
   * Otherwise, enters the variation and navigates to the ply.
   */
  const jumpToVariationMove = useCallback((branchPly: number, ply: number) => {
    if (activeBranchPly === branchPly && isInVariation) {
      navigateVariation(() => ply)
    } else {
      enterVariation(branchPly, ply)
    }
  }, [activeBranchPly, isInVariation, navigateVariation, enterVariation])

  return {
    variations,
    isInVariation,
    activeBranchPly,
    variationMoves,
    variationPly,
    variationMaxPly,
    handleUserMove,
    exitVariation,
    enterVariation,
    jumpToVariationMove,
    dismissVariation,
    advanceVariation,
    variationNav,
    loadVariations,
    dests,
    turnColor,
    checkColor,
    pendingReplacement,
    confirmReplacement,
    cancelReplacement,
    pendingDeletion,
    requestDeletion,
    confirmDeletion,
    cancelDeletion,
  }
}
