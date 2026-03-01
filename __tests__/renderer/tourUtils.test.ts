import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  shouldShowWelcome,
  markWelcomeSeen,
  shouldShowCollectionTour,
  markCollectionTourSeen,
  shouldShowGameTour,
  markGameTourSeen,
} from '../../src/renderer/utils/tourUtils.js'

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

describe('shouldShowWelcome', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  it('returns true in dev mode even if welcome was already seen', () => {
    markWelcomeSeen()
    expect(shouldShowWelcome(true)).toBe(true)
  })

  it('returns true in production when welcome has not been seen', () => {
    expect(shouldShowWelcome(false)).toBe(true)
  })

  it('returns false in production after markWelcomeSeen', () => {
    markWelcomeSeen()
    expect(shouldShowWelcome(false)).toBe(false)
  })
})

describe('shouldShowCollectionTour', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  it('returns true in production when collection tour has not been seen', () => {
    expect(shouldShowCollectionTour(false)).toBe(true)
  })

  it('returns false in production after markCollectionTourSeen', () => {
    markCollectionTourSeen()
    expect(shouldShowCollectionTour(false)).toBe(false)
  })
})

describe('shouldShowGameTour', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock())
  })

  it('returns true in production when game tour has not been seen', () => {
    expect(shouldShowGameTour(false)).toBe(true)
  })

  it('returns false in production after markGameTourSeen', () => {
    markGameTourSeen()
    expect(shouldShowGameTour(false)).toBe(false)
  })
})
