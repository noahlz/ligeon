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

  it('ArrowLeft calls onPrev', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(callbacks.onPrev).toHaveBeenCalledTimes(1)
  })

  it('ArrowRight calls onNext', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(callbacks.onNext).toHaveBeenCalledTimes(1)
  })

  it('Home calls onFirst', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: 'Home' })
    expect(callbacks.onFirst).toHaveBeenCalledTimes(1)
  })

  it('End calls onLast', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: 'End' })
    expect(callbacks.onLast).toHaveBeenCalledTimes(1)
  })

  it('Space calls onTogglePlay', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: ' ' })
    expect(callbacks.onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('keydown on HTMLInputElement is ignored', () => {
    renderHook(() => useGameControls(callbacks))
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(callbacks.onNext).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('unrecognized key does nothing', () => {
    renderHook(() => useGameControls(callbacks))
    fireEvent.keyDown(window, { key: 'a' })
    Object.values(callbacks).forEach(fn => expect(fn).not.toHaveBeenCalled())
  })

  it('removes keydown listener on unmount', () => {
    const { unmount } = renderHook(() => useGameControls(callbacks))
    unmount()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(callbacks.onPrev).not.toHaveBeenCalled()
  })

  // ── Wheel ─────────────────────────────────────────────────────────────────

  it('wheel down over board calls onNext', () => {
    const board = document.createElement('div')
    board.className = 'chessground-board'
    document.body.appendChild(board)

    renderHook(() => useGameControls(callbacks))
    fireEvent.wheel(board, { deltaY: 10 })
    expect(callbacks.onNext).toHaveBeenCalledTimes(1)

    document.body.removeChild(board)
  })

  it('wheel up over move-list panel calls onPrev', () => {
    const panel = document.createElement('div')
    panel.setAttribute('data-testid', 'move-list-panel')
    document.body.appendChild(panel)

    renderHook(() => useGameControls(callbacks))
    fireEvent.wheel(panel, { deltaY: -10 })
    expect(callbacks.onPrev).toHaveBeenCalledTimes(1)

    document.body.removeChild(panel)
  })

  it('wheel event outside board or panel is ignored', () => {
    renderHook(() => useGameControls(callbacks))
    // No board/panel elements in DOM
    fireEvent.wheel(window, { deltaY: 10 })
    expect(callbacks.onNext).not.toHaveBeenCalled()
  })

  it('second wheel event within 50ms debounce window is ignored', () => {
    const board = document.createElement('div')
    board.className = 'chessground-board'
    document.body.appendChild(board)

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

    document.body.removeChild(board)
  })
})
