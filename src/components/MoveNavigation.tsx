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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFirst, onPrev, onNext, onLast, onTogglePlay])

  const isAtStart = currentPly === 0
  const isAtEnd = currentPly === totalPlies

  return (
    <div className="flex flex-col gap-2 items-center p-4">
      {/* Position indicator */}
      <div className="text-sm text-gray-400">
        Move {currentPly} / {totalPlies}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2 items-center">
        <button
          onClick={onFirst}
          disabled={isAtStart}
          className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          title="First (Home)"
        >
          <ChevronsLeft size={20} />
        </button>

        <button
          onClick={onPrev}
          disabled={isAtStart}
          className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          title="Previous (←)"
        >
          <ChevronLeft size={20} />
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
            className={`p-2 rounded ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-slate-600 hover:bg-slate-500'
            } disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Speed menu (when not playing) */}
          {showSpeedMenu && !isPlaying && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-700 rounded shadow-lg z-50 min-w-[120px]">
              <button
                onClick={() => {
                  onSpeedChange('fast')
                  setShowSpeedMenu(false)
                  onTogglePlay()
                }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-600 rounded-t"
              >
                Fast (3s)
              </button>
              <button
                onClick={() => {
                  onSpeedChange('slow')
                  setShowSpeedMenu(false)
                  onTogglePlay()
                }}
                className="block w-full text-left px-4 py-2 hover:bg-slate-600 rounded-b"
              >
                Slow (10s)
              </button>
            </div>
          )}

          {/* Current speed indicator (when playing) */}
          {isPlaying && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-700 rounded text-xs text-gray-300 whitespace-nowrap">
              {speed === 'fast' ? 'Fast (3s)' : 'Slow (10s)'}
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={isAtEnd}
          className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          title="Next (→)"
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={onLast}
          disabled={isAtEnd}
          className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          title="Last (End)"
        >
          <ChevronsRight size={20} />
        </button>
      </div>
    </div>
  )
}
