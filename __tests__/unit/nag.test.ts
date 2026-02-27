import { describe, test, expect } from 'vitest'
import {
  getNagSymbol,
  getNagDescription,
  getNagCategory,
  sortNagsByCategory,
  NAG_DEFINITIONS,
} from '../../src/renderer/utils/nag.js'
import { VALID_NAG_CODES } from '../../src/shared/nag.js'

describe('getNagSymbol', () => {
  test('returns "!" for NAG 1 (Good move)', () => {
    expect(getNagSymbol(1)).toBe('!')
  })

  test('returns "?" for NAG 2 (Mistake)', () => {
    expect(getNagSymbol(2)).toBe('?')
  })

  test('returns "!!" for NAG 3 (Brilliant move)', () => {
    expect(getNagSymbol(3)).toBe('!!')
  })

  test('returns "??" for NAG 4 (Blunder)', () => {
    expect(getNagSymbol(4)).toBe('??')
  })

  test('returns "=" for NAG 10 (Equal position)', () => {
    expect(getNagSymbol(10)).toBe('=')
  })

  test('returns undefined for unknown NAG code', () => {
    expect(getNagSymbol(999)).toBeUndefined()
  })

  test('returns undefined for NAG 0 (not in VALID_NAG_CODES)', () => {
    expect(getNagSymbol(0)).toBeUndefined()
  })
})

describe('getNagDescription', () => {
  test('returns "Good move" for NAG 1', () => {
    expect(getNagDescription(1)).toBe('Good move')
  })

  test('returns "Blunder" for NAG 4', () => {
    expect(getNagDescription(4)).toBe('Blunder')
  })

  test('returns "Only move" for NAG 7', () => {
    expect(getNagDescription(7)).toBe('Only move')
  })

  test('returns "Time trouble" for NAG 32', () => {
    expect(getNagDescription(32)).toBe('Time trouble')
  })

  test('returns undefined for unknown code', () => {
    expect(getNagDescription(999)).toBeUndefined()
  })
})

describe('getNagCategory', () => {
  test('move quality NAGs (1-6) return "move"', () => {
    for (const nag of [1, 2, 3, 4, 5, 6]) {
      expect(getNagCategory(nag)).toBe('move')
    }
  })

  test('NAG 7 (Only move) returns "move"', () => {
    expect(getNagCategory(7)).toBe('move')
  })

  test('NAG 32 (Time trouble) returns "observation"', () => {
    expect(getNagCategory(32)).toBe('observation')
  })

  test('position evaluation NAGs (10, 13-19) return "position"', () => {
    for (const nag of [10, 13, 14, 15, 16, 17, 18, 19]) {
      expect(getNagCategory(nag)).toBe('position')
    }
  })

  test('returns undefined for unknown code', () => {
    expect(getNagCategory(999)).toBeUndefined()
  })
})

describe('sortNagsByCategory', () => {
  test('move NAGs come before position, position before observation', () => {
    const input = [32, 13, 1]  // observation, position, move
    const sorted = sortNagsByCategory(input)
    expect(sorted[0]).toBe(1)   // move
    expect(sorted[1]).toBe(13)  // position
    expect(sorted[2]).toBe(32)  // observation
  })

  test('does not mutate the original array', () => {
    const input = [7, 1, 10]
    const original = [...input]
    sortNagsByCategory(input)
    expect(input).toEqual(original)
  })

  test('single-element array returns unchanged', () => {
    expect(sortNagsByCategory([4])).toEqual([4])
  })

  test('empty array returns empty', () => {
    expect(sortNagsByCategory([])).toEqual([])
  })

  test('unknown NAGs default to observation order', () => {
    const sorted = sortNagsByCategory([999, 1])
    expect(sorted[0]).toBe(1)    // move comes first
    expect(sorted[1]).toBe(999)  // unknown defaults to observation
  })
})

describe('NAG_DEFINITIONS coverage', () => {
  test('every code in VALID_NAG_CODES has an entry in NAG_DEFINITIONS', () => {
    const defined = new Set(NAG_DEFINITIONS.map(d => d.nag))
    for (const code of VALID_NAG_CODES) {
      expect(defined.has(code), `NAG code ${code} missing from NAG_DEFINITIONS`).toBe(true)
    }
  })

  test('VALID_NAG_CODES contains all 16 supported codes', () => {
    expect(VALID_NAG_CODES.length).toBe(16)
  })
})
