import { describe, it, expect } from 'vitest'
import { isValidDateFrom, isValidDateTo, isDateStale, buildOptionFilters } from '../../src/renderer/utils/filterValidation.js'

describe('isValidDateFrom', () => {
  it('accepts null date (clears the filter)', () => {
    expect(isValidDateFrom(null, 20230201)).toBe(true)
  })

  it('accepts any date when dateTo is null (no upper bound)', () => {
    expect(isValidDateFrom(20230901, null)).toBe(true)
  })

  it('accepts a date earlier than dateTo', () => {
    expect(isValidDateFrom(20230101, 20230201)).toBe(true)
  })

  it('accepts a date equal to dateTo', () => {
    expect(isValidDateFrom(20230201, 20230201)).toBe(true)
  })

  it('rejects a date later than dateTo', () => {
    expect(isValidDateFrom(20230301, 20230201)).toBe(false)
  })
})

describe('isValidDateTo', () => {
  it('accepts null date (clears the filter)', () => {
    expect(isValidDateTo(null, 20230101)).toBe(true)
  })

  it('accepts any date when dateFrom is null (no lower bound)', () => {
    expect(isValidDateTo(20230101, null)).toBe(true)
  })

  it('accepts a date later than dateFrom', () => {
    expect(isValidDateTo(20230301, 20230101)).toBe(true)
  })

  it('accepts a date equal to dateFrom', () => {
    expect(isValidDateTo(20230101, 20230101)).toBe(true)
  })

  it('rejects a date earlier than dateFrom', () => {
    expect(isValidDateTo(20230101, 20230301)).toBe(false)
  })
})

describe('isDateStale', () => {
  it('returns false when selected is null', () => {
    expect(isDateStale(null, [20230101, 20230201])).toBe(false)
  })

  it('returns false when selected date is in the available list', () => {
    expect(isDateStale(20230101, [20230101, 20230201])).toBe(false)
  })

  it('returns true when selected date is not in the available list', () => {
    expect(isDateStale(20230301, [20230101, 20230201])).toBe(true)
  })

  it('returns true when the available list is empty', () => {
    expect(isDateStale(20230101, [])).toBe(true)
  })

  it('returns false when selected is null and list is empty', () => {
    expect(isDateStale(null, [])).toBe(false)
  })
})

describe('buildOptionFilters', () => {
  it('passes through all populated fields', () => {
    const result = buildOptionFilters({
      player: 'Carlsen',
      results: [1, 0],
      dateFrom: 20230101,
      dateTo: 20231231,
    })
    expect(result).toEqual({ player: 'Carlsen', results: [1, 0], dateFrom: 20230101, dateTo: 20231231 })
  })

  it('converts empty results array to undefined', () => {
    expect(buildOptionFilters({ results: [] }).results).toBeUndefined()
  })

  it('converts empty player string to undefined', () => {
    expect(buildOptionFilters({ player: '' }).player).toBeUndefined()
  })

  it('converts null dateFrom to undefined', () => {
    expect(buildOptionFilters({ dateFrom: null }).dateFrom).toBeUndefined()
  })

  it('converts null dateTo to undefined', () => {
    expect(buildOptionFilters({ dateTo: null }).dateTo).toBeUndefined()
  })

  it('returns all-undefined object when called with no params', () => {
    expect(buildOptionFilters({})).toEqual({
      player: undefined,
      results: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    })
  })
})
