import { describe, test, expect } from 'vitest'
import { convertResult, resultNumericToDisplay } from '../../src/utils/resultConverter'

describe('Result Converter', () => {
  test('converts white win', () => {
    const result = convertResult('1-0')
    expect(result.numeric).toBe(1.0)
    expect(result.display).toBe('White Wins')
    expect(result.skip).toBe(false)
  })

  test('converts black win', () => {
    const result = convertResult('0-1')
    expect(result.numeric).toBe(0.0)
    expect(result.display).toBe('Black Wins')
    expect(result.skip).toBe(false)
  })

  test('converts draw', () => {
    const result = convertResult('1/2-1/2')
    expect(result.numeric).toBe(0.5)
    expect(result.display).toBe('Draw')
    expect(result.skip).toBe(false)
  })

  test('skips unfinished games', () => {
    const result = convertResult('*')
    expect(result.skip).toBe(true)
    expect(result.display).toBe('Unfinished')
  })

  test('handles unknown results', () => {
    const result = convertResult('invalid')
    expect(result.skip).toBe(true)
    expect(result.display).toBe('Unknown')
  })

  test('converts numeric to display - white wins', () => {
    expect(resultNumericToDisplay(1.0)).toBe('White Wins')
  })

  test('converts numeric to display - draw', () => {
    expect(resultNumericToDisplay(0.5)).toBe('Draw')
  })

  test('converts numeric to display - black wins', () => {
    expect(resultNumericToDisplay(0.0)).toBe('Black Wins')
  })

  test('converts numeric to display - null', () => {
    expect(resultNumericToDisplay(null)).toBe('Unknown')
  })
})
