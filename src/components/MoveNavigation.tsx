import { useEffect, useState } from 'react'
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
} from 'lucide-react'

interface MoveNavigationProps {
  onFirst: () => void
  onPrev: () => void
  onNext: () => void
  onLast: () => void
  onTogglePlay: () => void
  isPlaying: boolean
  speed: 'fast' | 'slow'
  onSpeedChange: (speed: 'fast' | 'slow') => void
  currentPly: number
  totalPlies: number
}

export default function MoveNavigation({
  onFirst,
  onPrev,
  onNext,
  onLast,
  onTogglePlay,
  isPlaying,
  speed,
  onSpeedChange,
  currentPly,
  totalPlies,
}: MoveNavigationProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const lastScrollTime = { current: 0 }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

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
      // Don't interfere if scrolling in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Skip if hovering over game list sidebar (let it scroll natively)
      const gameListSidebar = document.querySelector('[data-testid="game-list-sidebar"]')
      if (gameListSidebar?.contains(e.target as Node)) {
        return
      }

      // Debounce: 50ms between scroll actions
      const now = Date.now()
      if (now - lastScrollTime.current < 50) return

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

  const isAtStart = currentPly === 0
  const isAtEnd = currentPly === totalPlies

  return (
    <div className="flex flex-col gap-1 items-center py-2">
      {/* Navigation buttons */}
      <div className="flex gap-1.5 items-center justify-center">
          <button
            onClick={onFirst}
            disabled={isAtStart}
            className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 disabled:cursor-not-allowed rounded"
            title="First (Home)"
          >
            <ChevronsLeft size={18} />
          </button>

          <button
            onClick={onPrev}
            disabled={isAtStart}
            className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 disabled:cursor-not-allowed rounded"
            title="Previous (←)"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Play/Pause with speed menu */}
          <div className="relative">
            <button
              onClick={() => {
                if (isPlaying) {
                  onTogglePlay()
                } else {
                  setShowSpeedMenu(!showSpeedMenu)
                }
              }}
              disabled={isAtEnd && !isPlaying}
              className={`p-1.5 rounded ${
                isPlaying
                  ? 'bg-ui-accent hover:bg-orange-600'
                  : 'bg-ui-bg-element hover:bg-ui-bg-hover'
              } disabled:bg-ui-bg-box disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Speed menu (when not playing) */}
            {showSpeedMenu && !isPlaying && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-ui-bg-element rounded shadow-lg z-50 min-w-[100px]">
                <button
                  onClick={() => {
                    onSpeedChange('fast')
                    setShowSpeedMenu(false)
                    onTogglePlay()
                  }}
                  className="block w-full text-left px-3 py-1.5 hover:bg-ui-bg-hover rounded-t text-sm"
                >
                  Fast (3s)
                </button>
                <button
                  onClick={() => {
                    onSpeedChange('slow')
                    setShowSpeedMenu(false)
                    onTogglePlay()
                  }}
                  className="block w-full text-left px-3 py-1.5 hover:bg-ui-bg-hover rounded-b text-sm"
                >
                  Slow (10s)
                </button>
              </div>
            )}

            {/* Current speed indicator (when playing) */}
            {isPlaying && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-ui-bg-element rounded text-xs text-ui-text-dim whitespace-nowrap">
                {speed === 'fast' ? 'Fast (3s)' : 'Slow (10s)'}
              </div>
            )}
          </div>

          <button
            onClick={onNext}
            disabled={isAtEnd}
            className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 disabled:cursor-not-allowed rounded"
            title="Next (→)"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={onLast}
            disabled={isAtEnd}
            className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 disabled:cursor-not-allowed rounded"
            title="Last (End)"
          >
            <ChevronsRight size={18} />
          </button>
        </div>
    </div>
  )
}
