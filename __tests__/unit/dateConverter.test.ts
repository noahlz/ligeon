import { describe, test, expect } from 'vitest'
import { pgnDateToYYYYMM, yyyymmToDisplay } from '../../src/shared/converters/dateConverter'

describe('Date Converter - pgnDateToYYYYMM', () => {
  test('converts complete date to YYYYMM', () => {
    expect(pgnDateToYYYYMM('1985.03.15')).toBe(198503)
  })

  test('handles partial date with unknown month - defaults to January', () => {
    expect(pgnDateToYYYYMM('1985.??.??')).toBe(198501)
  })

  test('handles unknown year', () => {
    expect(pgnDateToYYYYMM('?.?.?')).toBeNull()
  })

  test('handles null input', () => {
    expect(pgnDateToYYYYMM(null)).toBeNull()
  })

  test('handles undefined input', () => {
    expect(pgnDateToYYYYMM(undefined)).toBeNull()
  })

  test('converts various months correctly', () => {
    expect(pgnDateToYYYYMM('1956.01.01')).toBe(195601)
    expect(pgnDateToYYYYMM('1956.03.15')).toBe(195603)
    expect(pgnDateToYYYYMM('1957.12.31')).toBe(195712)
  })

  test('handles invalid month gracefully', () => {
    expect(pgnDateToYYYYMM('1985.13.15')).toBeNull()
    expect(pgnDateToYYYYMM('1985.00.15')).toBeNull()
  })
})

describe('Date Converter - yyyymmToDisplay', () => {
  test('converts YYYYMM to display format', () => {
    expect(yyyymmToDisplay(198503)).toBe('Mar 1985')
    expect(yyyymmToDisplay(195601)).toBe('Jan 1956')
    expect(yyyymmToDisplay(195712)).toBe('Dec 1957')
  })

  test('handles null input', () => {
    expect(yyyymmToDisplay(null)).toBe('Unknown')
  })

  test('handles undefined input', () => {
    expect(yyyymmToDisplay(undefined)).toBe('Unknown')
  })

  test('handles invalid month', () => {
    expect(yyyymmToDisplay(198513)).toBe('Unknown')
    expect(yyyymmToDisplay(198500)).toBe('Unknown')
  })

  test('handles all months correctly', () => {
    const expected = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 1; i <= 12; i++) {
      const yyyymm = 2000 * 100 + i
      const result = yyyymmToDisplay(yyyymm)
      expect(result).toBe(`${expected[i - 1]} 2000`)
    }
  })
})
