import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shouldShowTour, markTourSeen, TOUR_SEEN_KEY } from '../../src/renderer/utils/tourUtils.js'

// happy-dom localStorage does not implement .clear(); use an in-memory mock instead.
function makeLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}

describe('shouldShowTour', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  it('returns true in dev mode even if tour was already seen', () => {
    localStorage.setItem(TOUR_SEEN_KEY, 'true')
    expect(shouldShowTour(true)).toBe(true)
  })

  it('returns true in production when tour has not been seen', () => {
    expect(shouldShowTour(false)).toBe(true)
  })

  it('returns false in production when tour has already been seen', () => {
    localStorage.setItem(TOUR_SEEN_KEY, 'true')
    expect(shouldShowTour(false)).toBe(false)
  })
})

describe('markTourSeen', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  it('sets the tour-seen key so shouldShowTour returns false in production', () => {
    markTourSeen()
    expect(localStorage.getItem(TOUR_SEEN_KEY)).toBe('true')
    expect(shouldShowTour(false)).toBe(false)
  })
})
