import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useGameControls } from '@/hooks/useGameControls'

function makeCallbacks() {
  return {
    onFirst: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onLast: vi.fn(),
    onTogglePlay: vi.fn(),
  }
}

describe('useGameControls', () => {
  let callbacks: ReturnType<typeof makeCallbacks>

  beforeEach(() => {
    callbacks = makeCallbacks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Keyboard ──────────────────────────────────────────────────────────────

  it.each([
    ['ArrowLeft', 'onPrev'],
    ['ArrowRight', 'onNext'],
    ['Home', 'onFirst'],
    ['End', 'onLast'],
    [' ', 'onTogglePlay'],
  ] as const)('pressing %s calls %s', (key, cb) => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key })
    expect(callbacks[cb]).toHaveBeenCalledTimes(1)
  })

  it('key events on input elements are ignored', () => {
    renderHook(() => useGameControls(callbacks))
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(callbacks.onNext).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('unrecognized keys are ignored', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: 'a' })
    Object.values(callbacks).forEach(fn => expect(fn).not.toHaveBeenCalled())
  })

  it('keyboard listeners are removed on unmount', () => {
    const { unmount } = renderHook(() => useGameControls(callbacks))
    unmount()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(callbacks.onPrev).not.toHaveBeenCalled()
  })

  // ── Wheel ─────────────────────────────────────────────────────────────────

  describe('wheel', () => {
    let board: HTMLDivElement
    let panel: HTMLDivElement

    beforeEach(() => {
      board = document.createElement('div')
      board.className = 'chessground-board'
      document.body.appendChild(board)

      panel = document.createElement('div')
      panel.setAttribute('data-testid', 'move-list-panel')
      document.body.appendChild(panel)
    })

    afterEach(() => {
      board.remove()
      panel.remove()
    })

    it('scrolling down over the board navigates to the next move', () => {
      renderHook(() => useGameControls(callbacks))
      fireEvent.wheel(board, { deltaY: 10 })
      expect(callbacks.onNext).toHaveBeenCalledTimes(1)
    })

    it('scrolling up over the move-list panel navigates to the previous move', () => {
      renderHook(() => useGameControls(callbacks))
      fireEvent.wheel(panel, { deltaY: -10 })
      expect(callbacks.onPrev).toHaveBeenCalledTimes(1)
    })

    it('scrolling over other elements is ignored', () => {
      renderHook(() => useGameControls(callbacks))
      fireEvent.wheel(window, { deltaY: 10 })
      expect(callbacks.onNext).not.toHaveBeenCalled()
    })

    it('second scroll within 50ms is ignored (debounce)', () => {
      renderHook(() => useGameControls(callbacks))

      fireEvent.wheel(board, { deltaY: 10 })
      expect(callbacks.onNext).toHaveBeenCalledTimes(1)

      // Fire again immediately (within debounce)
      fireEvent.wheel(board, { deltaY: 10 })
      expect(callbacks.onNext).toHaveBeenCalledTimes(1) // still 1

      // Advance past debounce window
      vi.advanceTimersByTime(51)
      fireEvent.wheel(board, { deltaY: 10 })
      expect(callbacks.onNext).toHaveBeenCalledTimes(2)
    })
  })
})
