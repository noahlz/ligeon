import { useState, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import type { ChessManager } from '../utils/chessManager.js'
import { playMoveSound } from '../utils/audioManager.js'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

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
  /** Update board state from a ChessManager at the given ply, with optional sound */
  updateBoardState: (manager: ChessManager, ply: number) => void
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

  const updateBoardState = useCallback((manager: ChessManager, ply: number) => {
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

  return {
    fen,
    currentPly,
    lastMove,
    setFen,
    setCurrentPly,
    setLastMove,
    updateBoardState,
  }
}
