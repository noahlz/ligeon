import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useAutoPlay } from '@/hooks/useAutoPlay'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoPlay', () => {
  describe('start()', () => {
    it('is a no-op when currentPly >= maxPly', () => {
      const onAdvance = vi.fn()
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 5, maxPly: 5 })
      )

      act(() => {
        result.current.start()
      })

      expect(onAdvance).not.toHaveBeenCalled()
      expect(result.current.isPlaying).toBe(false)
    })

    it('calls onAdvance immediately and sets isPlaying = true when onAdvance returns true', () => {
      const onAdvance = vi.fn().mockReturnValue(true)
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 5 })
      )

      act(() => {
        result.current.start()
      })

      expect(onAdvance).toHaveBeenCalledTimes(1)
      expect(result.current.isPlaying).toBe(true)
    })

    it('does NOT set isPlaying when onAdvance returns false', () => {
      const onAdvance = vi.fn().mockReturnValue(false)
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 5 })
      )

      act(() => {
        result.current.start()
      })

      expect(onAdvance).toHaveBeenCalledTimes(1)
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('interval behavior', () => {
    it('calls onAdvance again after 1000ms tick following start', () => {
      const onAdvance = vi.fn().mockReturnValue(true)
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 10 })
      )

      act(() => {
        result.current.start()
      })
      // onAdvance called once immediately by start()
      expect(onAdvance).toHaveBeenCalledTimes(1)

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      // onAdvance called once more by the interval tick
      expect(onAdvance).toHaveBeenCalledTimes(2)
    })

    it('stops calling onAdvance after stop() is called', () => {
      const onAdvance = vi.fn().mockReturnValue(true)
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 10 })
      )

      act(() => {
        result.current.start()
      })
      expect(onAdvance).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.stop()
      })
      expect(result.current.isPlaying).toBe(false)

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      // No additional calls after stop()
      expect(onAdvance).toHaveBeenCalledTimes(1)
    })

    it('sets isPlaying to false when onAdvance returns false during an interval tick', () => {
      // Returns true on start()'s immediate call, then false on the first interval tick
      const onAdvance = vi.fn().mockReturnValueOnce(true).mockReturnValue(false)
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 10 })
      )

      act(() => {
        result.current.start()
      })
      expect(result.current.isPlaying).toBe(true)

      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('auto-stop from prop changes', () => {
    it('stops playing when re-rendered with currentPly >= maxPly while isPlaying', () => {
      const onAdvance = vi.fn().mockReturnValue(true)
      const { result, rerender } = renderHook(
        ({ currentPly, maxPly }) => useAutoPlay({ onAdvance, currentPly, maxPly }),
        { initialProps: { currentPly: 4, maxPly: 5 } }
      )

      act(() => {
        result.current.start()
      })
      expect(result.current.isPlaying).toBe(true)

      // Simulate reaching the end via a prop update (parent advances ply to maxPly)
      act(() => {
        rerender({ currentPly: 5, maxPly: 5 })
      })
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('clears the interval on unmount so onAdvance is not called after unmount', () => {
      const onAdvance = vi.fn().mockReturnValue(true)
      const { result, unmount } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 10 })
      )

      act(() => {
        result.current.start()
      })
      expect(onAdvance).toHaveBeenCalledTimes(1)

      unmount()

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      // Still only the one call from start(); no interval ticks after unmount
      expect(onAdvance).toHaveBeenCalledTimes(1)
    })
  })

  describe('speed', () => {
    it('has a default speed of 1000ms', () => {
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance: vi.fn(), currentPly: 0, maxPly: 5 })
      )
      expect(result.current.speed).toBe(1000)
    })

    it('uses the new interval delay after setSpeed(500)', () => {
      const onAdvance = vi.fn().mockReturnValue(true)
      const { result } = renderHook(() =>
        useAutoPlay({ onAdvance, currentPly: 0, maxPly: 10 })
      )

      act(() => {
        result.current.start()
      })
      expect(onAdvance).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.setSpeed(500)
      })

      // At 499ms the new 500ms interval has not yet fired
      act(() => {
        vi.advanceTimersByTime(499)
      })
      expect(onAdvance).toHaveBeenCalledTimes(1)

      // At 500ms the tick fires
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onAdvance).toHaveBeenCalledTimes(2)
    })
  })
})
