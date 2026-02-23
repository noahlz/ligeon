import { describe, test, expect } from 'vitest'
import {
  searchAvailableOpenings,
  getOpeningByEco,
} from '../../src/renderer/utils/openings.js'

// Pure functions — openings.json is a static asset bundled at build time.
// No mocking needed.

// Sample available ECO codes for use across tests
const sampleAvailable = [
  { eco: 'A00', count: 3 },
  { eco: 'A01', count: 1 },
  { eco: 'E12', count: 5 },
  { eco: 'C95', count: 2 },
]

describe('searchAvailableOpenings', () => {
  test('empty query returns all available codes with names and counts', () => {
    const result = searchAvailableOpenings('', sampleAvailable)
    expect(result.length).toBe(4)
    result.forEach(r => {
      expect(r.eco).toBeDefined()
      expect(r.name).toBeDefined()
      expect(r.count).toBeGreaterThan(0)
    })
  })

  test('empty query preserves counts from availableEcoCodes', () => {
    const result = searchAvailableOpenings('', sampleAvailable)
    const e12 = result.find(r => r.eco === 'E12')
    expect(e12).toBeDefined()
    expect(e12!.count).toBe(5)
  })

  test('ECO prefix match returns matching codes', () => {
    const available = [
      { eco: 'A00', count: 1 },
      { eco: 'A01', count: 1 },
      { eco: 'B10', count: 1 },
    ]
    const result = searchAvailableOpenings('A0', available)
    expect(result.length).toBe(2)
    expect(result.map(r => r.eco).sort()).toEqual(['A00', 'A01'])
  })

  test('ECO prefix match is case-insensitive', () => {
    const available = [{ eco: 'A00', count: 1 }]
    const result = searchAvailableOpenings('a00', available)
    expect(result.length).toBe(1)
    expect(result[0].eco).toBe('A00')
  })

  test('name substring match (case-insensitive) returns matching codes', () => {
    const available = [
      { eco: 'A01', count: 1 },   // Nimzovich-Larsen Attack
      { eco: 'A02', count: 1 },   // Bird's Opening
      { eco: 'A10', count: 1 },   // English
    ]
    // 'bird' should match Bird's Opening (A02)
    const result = searchAvailableOpenings('bird', available)
    expect(result.length).toBe(1)
    expect(result[0].eco).toBe('A02')
  })

  test('unrecognized query returns empty array', () => {
    const result = searchAvailableOpenings('zzzzz', sampleAvailable)
    expect(result).toEqual([])
  })

  test('result only contains openings from availableEcoCodes, not all openings', () => {
    const limited = [{ eco: 'A00', count: 7 }]
    const result = searchAvailableOpenings('', limited)
    expect(result.length).toBe(1)
    expect(result[0].eco).toBe('A00')
  })

  test('unknown ECO code in availableEcoCodes uses "Unknown Opening" fallback', () => {
    const withUnknown = [{ eco: 'ZZZ', count: 1 }]
    const result = searchAvailableOpenings('', withUnknown)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('Unknown Opening')
  })

  test('whitespace-only query is treated as empty — returns all available', () => {
    const result = searchAvailableOpenings('   ', sampleAvailable)
    expect(result.length).toBe(4)
  })
})

describe('getOpeningByEco', () => {
  test('known ECO A00 returns correct record', () => {
    const result = getOpeningByEco('A00')
    expect(result).toBeDefined()
    expect(result!.eco).toBe('A00')
    expect(result!.name).toBeTruthy()
  })

  test('known ECO A01 returns Nimzovich-Larsen Attack', () => {
    const result = getOpeningByEco('A01')
    expect(result).toBeDefined()
    expect(result!.name).toBe('Nimzovich-Larsen Attack')
  })

  test('unknown ECO ZZZ returns undefined', () => {
    const result = getOpeningByEco('ZZZ')
    expect(result).toBeUndefined()
  })

  test('empty string returns undefined', () => {
    const result = getOpeningByEco('')
    expect(result).toBeUndefined()
  })
})
