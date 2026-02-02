import { useState, useEffect, useCallback, useRef } from 'react'

export type AutoPlaySpeed = 'fast' | 'slow'

const SPEED_INTERVALS: Record<AutoPlaySpeed, number> = {
  fast: 3000, // 3 seconds
  slow: 10000 // 10 seconds
}

export interface UseAutoPlayOptions {
  /** Callback to advance to next move */
  onAdvance: () => boolean // Returns true if advanced, false if at end
  /** Current position in the game */
  currentPly: number
  /** Total number of plies in the game */
  maxPly: number
}

export interface UseAutoPlayReturn {
  isPlaying: boolean
  speed: AutoPlaySpeed
  start: () => void
  stop: () => void
  setSpeed: (speed: AutoPlaySpeed) => void
}

/**
 * Hook for auto-playing through a chess game
 * Automatically stops when reaching the end of the game
 */
export function useAutoPlay(options: UseAutoPlayOptions): UseAutoPlayReturn {
  const { onAdvance, currentPly, maxPly } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<AutoPlaySpeed>('fast')
  const intervalRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    setIsPlaying(false)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    // Don't start if already at the end
    if (currentPly >= maxPly) {
      return
    }
    setIsPlaying(true)
  }, [currentPly, maxPly])

  // Effect to manage the interval
  useEffect(() => {
    if (!isPlaying) {
      return
    }

    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval with current speed
    intervalRef.current = window.setInterval(() => {
      const advanced = onAdvance()

      // Stop if we couldn't advance (reached the end)
      if (!advanced) {
        stop()
      }
    }, SPEED_INTERVALS[speed])

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, speed, onAdvance, stop])

  // Auto-stop if we reach the end while playing
  useEffect(() => {
    if (isPlaying && currentPly >= maxPly) {
      stop()
    }
  }, [currentPly, maxPly, isPlaying, stop])

  return {
    isPlaying,
    speed,
    start,
    stop,
    setSpeed
  }
}
