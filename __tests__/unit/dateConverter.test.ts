import { describe, test, expect } from 'vitest'
import { pgnDateToYYYYMMDD, yyyymmddToDisplay, yyyymmddToPgnDate } from '../../src/shared/converters/dateConverter'

describe('Date Converter - pgnDateToYYYYMMDD', () => {
  test('converts complete date to YYYYMMDD', () => {
    expect(pgnDateToYYYYMMDD('1985.03.15')).toBe(19850315)
  })

  test('handles partial date with unknown day', () => {
    expect(pgnDateToYYYYMMDD('1985.03.??')).toBe(19850300)
  })

  test('handles partial date with unknown month - defaults to January', () => {
    expect(pgnDateToYYYYMMDD('1985.??.??')).toBe(19850100)
  })

  test('handles unknown year', () => {
    expect(pgnDateToYYYYMMDD('?.?.?')).toBeNull()
  })

  test('handles unknown month that has one question mark', () => {
    expect(pgnDateToYYYYMMDD('2001.?.??')).toBe(20010100)
  })

  test('handles unknown month that has too many question marks', () => {
    expect(pgnDateToYYYYMMDD('2001.????.?')).toBe(20010100)
  })

  test('handles null input', () => {
    expect(pgnDateToYYYYMMDD(null)).toBeNull()
  })

  test('handles undefined input', () => {
    expect(pgnDateToYYYYMMDD(undefined)).toBeNull()
  })

  test('converts various dates correctly', () => {
    expect(pgnDateToYYYYMMDD('1956.01.01')).toBe(19560101)
    expect(pgnDateToYYYYMMDD('1956.03.15')).toBe(19560315)
    expect(pgnDateToYYYYMMDD('1957.12.31')).toBe(19571231)
  })

  test('handles invalid month gracefully', () => {
    expect(pgnDateToYYYYMMDD('1985.13.15')).toBeNull()
    expect(pgnDateToYYYYMMDD('1985.00.15')).toBeNull()
  })
})

describe('Date Converter - yyyymmddToDisplay', () => {
  test('converts YYYYMMDD to display format (month + year only)', () => {
    expect(yyyymmddToDisplay(19850315)).toBe('Mar 1985')
    expect(yyyymmddToDisplay(19850300)).toBe('Mar 1985')
    expect(yyyymmddToDisplay(19560101)).toBe('Jan 1956')
    expect(yyyymmddToDisplay(19571231)).toBe('Dec 1957')
  })

  test('handles null input', () => {
    expect(yyyymmddToDisplay(null)).toBe('Unknown')
  })

  test('handles undefined input', () => {
    expect(yyyymmddToDisplay(undefined)).toBe('Unknown')
  })

  test('handles invalid month 13', () => {
    expect(yyyymmddToDisplay(19851315)).toBe('Unknown')
  })

  test('handles invalid month zero', () => {
    expect(yyyymmddToDisplay(19850015)).toBe('Unknown')
  })

  test('handles all months correctly (for en-US locale)', () => {
    const expected = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 1; i <= 12; i++) {
      const yyyymmdd = 2000 * 10000 + i * 100 + 15
      const result = yyyymmddToDisplay(yyyymmdd, 'en-US')
      expect(result).toBe(`${expected[i - 1]} 2000`)
    }
  })
})

describe('Date Converter - yyyymmddToPgnDate', () => {
  test('converts full date', () => {
    expect(yyyymmddToPgnDate(19850315)).toBe('1985.03.15')
  })

  test('converts date with unknown day (00)', () => {
    expect(yyyymmddToPgnDate(19850300)).toBe('1985.03.??')
  })

  test('converts date with January and unknown day', () => {
    expect(yyyymmddToPgnDate(19850100)).toBe('1985.01.??')
  })

  test('handles null', () => {
    expect(yyyymmddToPgnDate(null)).toBe('????.??.??')
  })

  test('handles undefined', () => {
    expect(yyyymmddToPgnDate(undefined)).toBe('????.??.??')
  })
})
