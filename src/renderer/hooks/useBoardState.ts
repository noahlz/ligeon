import { useState, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import { INITIAL_FEN } from 'chessops/fen'
import type { NavigableManager } from '../types/navigableManager.js'
import { playMoveSound } from '../utils/audioManager.js'

export interface UseBoardStateParams {
  /** Whether sound playback is enabled */
  soundEnabled: boolean
  /** Ref indicating whether audio has been initialized */
  audioInitialized: MutableRefObject<boolean>
}

export interface UseBoardStateReturn {
  /** Current FEN position string */
  fen: string
  /** Current ply (half-move) number */
  currentPly: number
  /** Last move squares for highlighting */
  lastMove: Key[] | undefined
  /** Set FEN state directly */
  setFen: React.Dispatch<React.SetStateAction<string>>
  /** Set currentPly state directly */
  setCurrentPly: React.Dispatch<React.SetStateAction<number>>
  /** Set lastMove state directly */
  setLastMove: React.Dispatch<React.SetStateAction<Key[] | undefined>>
  /** Update board state from a NavigableManager at the given ply, with optional sound */
  updateBoardState: (manager: NavigableManager, ply: number) => void
  /** Counter that increments to force board sync (triggers chessground reset) */
  boardSyncKey: number
  /** Force chessground to resync from current FEN (fixes desync after rejected moves) */
  forceBoardSync: () => void
}

/**
 * Manages chess board display state: FEN, current ply, and last move highlight.
 * Includes integrated sound playback on move updates.
 */
export function useBoardState({
  soundEnabled,
  audioInitialized,
}: UseBoardStateParams): UseBoardStateReturn {
  const [fen, setFen] = useState(INITIAL_FEN)
  const [currentPly, setCurrentPly] = useState(0)
  const [lastMove, setLastMove] = useState<Key[] | undefined>(undefined)
  const [boardSyncKey, setBoardSyncKey] = useState(0)

  const updateBoardState = useCallback((manager: NavigableManager, ply: number) => {
    manager.goto(ply)
    setFen(manager.getFen())
    const move = manager.getLastMove()
    setLastMove(move ? move as Key[] : undefined)
    setCurrentPly(ply)

    if (ply > 0 && soundEnabled && audioInitialized.current) {
      const moveType = manager.getMoveType(ply)
      if (moveType) {
        playMoveSound(moveType)
      }
    }
  }, [soundEnabled, audioInitialized])

  const forceBoardSync = useCallback(() => {
    setBoardSyncKey(k => k + 1)
  }, [])

  return {
    fen,
    currentPly,
    lastMove,
    setFen,
    setCurrentPly,
    setLastMove,
    updateBoardState,
    boardSyncKey,
    forceBoardSync,
  }
}
