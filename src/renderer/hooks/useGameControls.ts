import { useEffect, useRef } from 'react'
import { isEditableInput } from '../utils/domUtils.js'

const WHEEL_DEBOUNCE_MS = 50

export interface UseGameControlsParams {
  /** Navigate to first position */
  onFirst: () => void
  /** Navigate to previous move */
  onPrev: () => void
  /** Navigate to next move */
  onNext: () => void
  /** Navigate to last position */
  onLast: () => void
  /** Toggle auto-play */
  onTogglePlay: () => void
}

/**
 * Registers keyboard (arrows, Home, End, Space) and mouse-wheel handlers
 * for game navigation.  Wheel scrolling only triggers navigation when the
 * cursor is over the board or the move-list panel.
 *
 * Side-effect-only hook — no return value.
 */
export function useGameControls({
  onFirst,
  onPrev,
  onNext,
  onLast,
  onTogglePlay,
}: UseGameControlsParams): void {
  const lastScrollTime = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableInput(e.target)) return

      switch (e.key) {
        case 'ArrowLeft':
          onPrev()
          break
        case 'ArrowRight':
          onNext()
          break
        case 'Home':
          onFirst()
          break
        case 'End':
          onLast()
          break
        case ' ':
          e.preventDefault()
          onTogglePlay()
          break
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (isEditableInput(e.target)) return

      // Only navigate when wheel is over board or move-list panel
      const board = document.querySelector('.chessground-board')
      const moveListPanel = document.querySelector('[data-testid="move-list-panel"]')

      const isOverBoard = board?.contains(e.target as Node)
      const isOverMoveList = moveListPanel?.contains(e.target as Node)

      if (!isOverBoard && !isOverMoveList) {
        return
      }

      // Debounce rapid scroll ticks
      const now = Date.now()
      if (now - lastScrollTime.current < WHEEL_DEBOUNCE_MS) return

      if (e.deltaY > 0) {
        e.preventDefault()
        onNext()
      } else if (e.deltaY < 0) {
        e.preventDefault()
        onPrev()
      }
      lastScrollTime.current = now
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [onFirst, onPrev, onNext, onLast, onTogglePlay])
}
