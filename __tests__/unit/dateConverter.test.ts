import { describe, test, expect } from 'vitest'
import { pgnDateToTimestamp, timestampToDisplay } from '../../src/utils/dateConverter'

describe('Date Converter', () => {
  test('converts complete date', () => {
    const result = pgnDateToTimestamp('1985.01.15')
    expect(result).toBeDefined()
    expect(typeof result).toBe('number')
  })

  test('handles partial dates', () => {
    const result = pgnDateToTimestamp('1985.??.??')
    expect(result).toBeDefined()
  })

  test('handles unknown year', () => {
    expect(pgnDateToTimestamp('?.?.?')).toBeNull()
  })

  test('handles null input', () => {
    expect(pgnDateToTimestamp(null)).toBeNull()
  })

  test('handles undefined input', () => {
    expect(pgnDateToTimestamp(undefined)).toBeNull()
  })

  test('converts timestamp to display', () => {
    const ts = pgnDateToTimestamp('1985.01.15')
    const display = timestampToDisplay(ts)
    expect(display).toContain('1985')
  })

  test('handles null timestamp', () => {
    expect(timestampToDisplay(null)).toBe('Unknown')
  })

  test('handles undefined timestamp', () => {
    expect(timestampToDisplay(undefined)).toBe('Unknown')
  })
})
