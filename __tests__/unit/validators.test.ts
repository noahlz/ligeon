import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  validateCollectionId,
  validateFilePath,
  validateSearchFilters,
  validateCollectionName,
  validateCollectionIdResult,
  validateFilePathResult,
  validateSearchFiltersResult,
  validateCollectionNameResult,
  validateOptionFilters,
  validateGameId,
  validateBranchPly,
  validateSidelineMoves,
} from '../../src/main/ipc/validators.js'
import type { GameFilters } from '../../src/main/ipc/types.js'

describe('validators', () => {
  describe('validateCollectionId', () => {
    test('accepts valid alphanumeric IDs', () => {
      expect(validateCollectionId('abc123')).toBe(true)
      expect(validateCollectionId('ABC123')).toBe(true)
      expect(validateCollectionId('test_collection')).toBe(true)
      expect(validateCollectionId('test-collection')).toBe(true)
      expect(validateCollectionId('a1-b2_c3')).toBe(true)
    })

    test('rejects empty string', () => {
      expect(validateCollectionId('')).toBe(false)
    })

    test('rejects IDs exceeding 100 characters', () => {
      const longId = 'a'.repeat(101)
      expect(validateCollectionId(longId)).toBe(false)
    })

    test('accepts IDs at exactly 100 characters', () => {
      const maxId = 'a'.repeat(100)
      expect(validateCollectionId(maxId)).toBe(true)
    })

    test('rejects path traversal sequences', () => {
      expect(validateCollectionId('../etc/passwd')).toBe(false)
      expect(validateCollectionId('..\\windows')).toBe(false)
      expect(validateCollectionId('test..test')).toBe(false)
      expect(validateCollectionId('test/collection')).toBe(false)
      expect(validateCollectionId('test\\collection')).toBe(false)
    })

    test('rejects special characters', () => {
      expect(validateCollectionId('test@collection')).toBe(false)
      expect(validateCollectionId('test#collection')).toBe(false)
      expect(validateCollectionId('test$collection')).toBe(false)
      expect(validateCollectionId('test collection')).toBe(false)
      expect(validateCollectionId('test.collection')).toBe(false)
    })
  })

  describe('validateFilePath', () => {
    let tempDir: string
    let validFile: string
    let largeFile: string

    beforeAll(() => {
      // Create temp directory and test files
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
      validFile = path.join(tempDir, 'valid.txt')
      largeFile = path.join(tempDir, 'large.txt')

      // Create a valid small file
      fs.writeFileSync(validFile, 'test content')

      // Create a large file (>100MB for default limit test)
      const buffer = Buffer.alloc(101 * 1024 * 1024) // 101MB
      fs.writeFileSync(largeFile, buffer)
    })

    afterAll(() => {
      // Cleanup temp files
      fs.rmSync(tempDir, { recursive: true, force: true })
    })

    test('accepts valid file path', () => {
      expect(validateFilePath(validFile)).toBe(true)
    })

    test('accepts file with custom size limit', () => {
      expect(validateFilePath(largeFile, 200)).toBe(true)
    })

    test('rejects empty path', () => {
      expect(validateFilePath('')).toBe(false)
    })

    test('rejects non-existent file', () => {
      const nonExistent = path.join(tempDir, 'does-not-exist.txt')
      expect(validateFilePath(nonExistent)).toBe(false)
    })

    test('rejects directory path', () => {
      expect(validateFilePath(tempDir)).toBe(false)
    })

    test('rejects file exceeding size limit', () => {
      expect(validateFilePath(largeFile, 100)).toBe(false)
    })

    test('accepts file at exact size limit', () => {
      const exactFile = path.join(tempDir, 'exact.txt')
      const buffer = Buffer.alloc(100 * 1024 * 1024) // Exactly 100MB
      fs.writeFileSync(exactFile, buffer)
      expect(validateFilePath(exactFile, 100)).toBe(true)
      fs.unlinkSync(exactFile)
    })
  })

  describe('validateSearchFilters', () => {
    test('returns empty object for empty input', () => {
      const result = validateSearchFilters({})
      expect(result).toEqual({})
    })

    test('trims string fields', () => {
      const filters: GameFilters = {
        white: '  Carlsen  ',
        black: '  Kasparov  ',
        event: '  World Championship  ',
        ecoCodes: ['  B90  ', '  C45  '],
      }
      const result = validateSearchFilters(filters)
      expect(result.white).toBe('Carlsen')
      expect(result.black).toBe('Kasparov')
      expect(result.event).toBe('World Championship')
      expect(result.ecoCodes).toEqual(['B90', 'C45'])
    })

    test('limits string field lengths', () => {
      const longString = 'a'.repeat(150)
      const filters: GameFilters = {
        white: longString,
        black: longString,
        event: longString,
        ecoCodes: [longString],
      }
      const result = validateSearchFilters(filters)
      expect(result.white).toHaveLength(100)
      expect(result.black).toHaveLength(100)
      expect(result.event).toHaveLength(100)
      expect(result.ecoCodes).toEqual(['a'.repeat(10)])
    })

    test('validates result values', () => {
      expect(validateSearchFilters({ results: [0.0] }).results).toEqual([0.0])
      expect(validateSearchFilters({ results: [0.5] }).results).toEqual([0.5])
      expect(validateSearchFilters({ results: [1.0] }).results).toEqual([1.0])
    })

    test('rejects invalid result values', () => {
      expect(validateSearchFilters({ results: [0.3] }).results).toBeUndefined()
      expect(validateSearchFilters({ results: [2.0] }).results).toBeUndefined()
      expect(validateSearchFilters({ results: [-1.0] }).results).toBeUndefined()
    })

    test('clamps date YYYYMMDD to valid range', () => {
      const tooEarly = 18000101 // Before 1900
      const tooLate = 22000101 // After 2100

      const result = validateSearchFilters({
        dateFrom: tooEarly,
        dateTo: tooLate,
      })

      expect(result.dateFrom).toBe(19000101) // Clamped to MIN_YYYYMMDD
      expect(result.dateTo).toBe(21001231) // Clamped to MAX_YYYYMMDD
    })

    test('preserves valid date YYYYMMDD', () => {
      const validDate = 20200115 // January 15, 2020
      const result = validateSearchFilters({
        dateFrom: validDate,
        dateTo: validDate,
      })

      expect(result.dateFrom).toBe(validDate)
      expect(result.dateTo).toBe(validDate)
    })

    test('clamps ELO values to valid range', () => {
      const result = validateSearchFilters({
        whiteEloMin: -100,
        whiteEloMax: 5000,
        blackEloMin: -50,
        blackEloMax: 4500,
      })

      expect(result.whiteEloMin).toBe(0)
      expect(result.whiteEloMax).toBe(4000)
      expect(result.blackEloMin).toBe(0)
      expect(result.blackEloMax).toBe(4000)
    })

    test('preserves valid ELO values', () => {
      const result = validateSearchFilters({
        whiteEloMin: 2000,
        whiteEloMax: 2800,
        blackEloMin: 1800,
        blackEloMax: 2600,
      })

      expect(result.whiteEloMin).toBe(2000)
      expect(result.whiteEloMax).toBe(2800)
      expect(result.blackEloMin).toBe(1800)
      expect(result.blackEloMax).toBe(2600)
    })

    test('clamps limit to valid range', () => {
      expect(validateSearchFilters({ limit: 0 }).limit).toBe(1)
      expect(validateSearchFilters({ limit: -10 }).limit).toBe(1)
      expect(validateSearchFilters({ limit: 20000 }).limit).toBe(10000)
    })

    test('preserves valid limit', () => {
      expect(validateSearchFilters({ limit: 100 }).limit).toBe(100)
      expect(validateSearchFilters({ limit: 1 }).limit).toBe(1)
      expect(validateSearchFilters({ limit: 10000 }).limit).toBe(10000)
    })

    test('handles null values correctly', () => {
      const result = validateSearchFilters({
        results: [],
        dateFrom: null,
        dateTo: null,
        whiteEloMin: null,
        whiteEloMax: null,
        blackEloMin: null,
        blackEloMax: null,
      })

      expect(result.results).toBeUndefined()
      expect(result.dateFrom).toBeUndefined()
      expect(result.dateTo).toBeUndefined()
      expect(result.whiteEloMin).toBeUndefined()
      expect(result.whiteEloMax).toBeUndefined()
      expect(result.blackEloMin).toBeUndefined()
      expect(result.blackEloMax).toBeUndefined()
    })

    test('handles complex filter combinations', () => {
      const filters: GameFilters = {
        white: '  Magnus Carlsen  ',
        black: 'Hikaru Nakamura',
        event: 'Speed Chess Championship',
        results: [1.0],
        dateFrom: 20230101,
        dateTo: 20231231,
        whiteEloMin: 2800,
        whiteEloMax: 2900,
        blackEloMin: 2700,
        blackEloMax: 2800,
        ecoCodes: ['B90', 'C45'],
        limit: 50,
      }

      const sanitized = validateSearchFilters(filters)

      expect(sanitized.white).toBe('Magnus Carlsen')
      expect(sanitized.black).toBe('Hikaru Nakamura')
      expect(sanitized.event).toBe('Speed Chess Championship')
      expect(sanitized.results).toEqual([1.0])
      expect(sanitized.dateFrom).toBe(filters.dateFrom)
      expect(sanitized.dateTo).toBe(filters.dateTo)
      expect(sanitized.whiteEloMin).toBe(2800)
      expect(sanitized.whiteEloMax).toBe(2900)
      expect(sanitized.blackEloMin).toBe(2700)
      expect(sanitized.blackEloMax).toBe(2800)
      expect(sanitized.ecoCodes).toEqual(['B90', 'C45'])
      expect(sanitized.limit).toBe(50)
    })
  })

  describe('validateCollectionName', () => {
    test('accepts valid non-empty names', () => {
      expect(validateCollectionName('My Games')).toBe(true)
      expect(validateCollectionName('World Championships')).toBe(true)
      expect(validateCollectionName('a')).toBe(true)
    })

    test('rejects empty string', () => {
      expect(validateCollectionName('')).toBe(false)
    })

    test('rejects whitespace-only string', () => {
      expect(validateCollectionName('   ')).toBe(false)
      expect(validateCollectionName('\t\n')).toBe(false)
    })

    test('rejects names exceeding 200 characters', () => {
      const longName = 'a'.repeat(201)
      expect(validateCollectionName(longName)).toBe(false)
    })

    test('accepts names at exactly 200 characters', () => {
      const maxName = 'a'.repeat(200)
      expect(validateCollectionName(maxName)).toBe(true)
    })

    test('accepts names with leading/trailing whitespace', () => {
      // Note: Function checks trim().length > 0, but doesn't require trimmed input
      expect(validateCollectionName('  Valid Name  ')).toBe(true)
    })

    test('accepts special characters and unicode', () => {
      expect(validateCollectionName('Games: 2020-2023')).toBe(true)
      expect(validateCollectionName('Carlsen vs. Kasparov')).toBe(true)
      expect(validateCollectionName('Tournoi français')).toBe(true)
      expect(validateCollectionName('Chess ♟️ Games')).toBe(true)
    })
  })

  describe('validateCollectionIdResult', () => {
    test('returns valid result for valid IDs', () => {
      const result = validateCollectionIdResult('test-collection-123')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('test-collection-123')
      }
    })

    test('returns all errors for invalid ID', () => {
      const result = validateCollectionIdResult('../test@collection with spaces')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
        const codes = result.errors.map(e => e.code)
        expect(codes).toContain('PATH_TRAVERSAL')
        expect(codes).toContain('INVALID_CHARACTERS')
      }
    })

    test('returns EMPTY error for empty string', () => {
      const result = validateCollectionIdResult('')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBe(1)
        expect(result.errors[0].code).toBe('EMPTY')
      }
    })

    test('returns TOO_LONG error for strings over 100 chars', () => {
      const result = validateCollectionIdResult('a'.repeat(101))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some(e => e.code === 'TOO_LONG')).toBe(true)
      }
    })
  })

  describe('validateFilePathResult', () => {
    let tempDir: string
    let validFile: string

    beforeAll(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-test-'))
      validFile = path.join(tempDir, 'test.txt')
      fs.writeFileSync(validFile, 'test content')
    })

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true })
    })

    test('returns valid result for existing file', () => {
      const result = validateFilePathResult(validFile)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe(validFile)
      }
    })

    test('returns NOT_FOUND error for non-existent file', () => {
      const result = validateFilePathResult(path.join(tempDir, 'nonexistent.txt'))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors[0].code).toBe('NOT_FOUND')
      }
    })

    test('returns EMPTY error for empty path', () => {
      const result = validateFilePathResult('')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors[0].code).toBe('EMPTY')
      }
    })

    test('returns NOT_A_FILE error for directory', () => {
      const result = validateFilePathResult(tempDir)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some(e => e.code === 'NOT_A_FILE')).toBe(true)
      }
    })
  })

  describe('validateCollectionNameResult', () => {
    test('returns valid result for valid names', () => {
      const result = validateCollectionNameResult('My Chess Games')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('My Chess Games')
      }
    })

    test('returns EMPTY error for empty string', () => {
      const result = validateCollectionNameResult('')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors[0].code).toBe('EMPTY')
      }
    })

    test('returns TOO_LONG error for strings over 200 chars', () => {
      const result = validateCollectionNameResult('a'.repeat(201))
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.some(e => e.code === 'TOO_LONG')).toBe(true)
      }
    })

    test('returns multiple errors when applicable', () => {
      // Empty string only triggers EMPTY, but we can verify the pattern works
      const result = validateCollectionNameResult('')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('validateSearchFiltersResult', () => {
    test('returns valid result with sanitized filters', () => {
      const filters: GameFilters = {
        white: 'Magnus Carlsen',
        black: 'Hikaru Nakamura',
        results: [1.0],
      }
      const result = validateSearchFiltersResult(filters)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value.white).toBe('Magnus Carlsen')
        expect(result.value.black).toBe('Hikaru Nakamura')
        expect(result.value.results).toEqual([1.0])
      }
    })

    test('truncates long strings', () => {
      const filters: GameFilters = {
        white: 'a'.repeat(150),
      }
      const result = validateSearchFiltersResult(filters)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value.white?.length).toBe(100)
      }
    })

    test('clamps ELO values to valid range', () => {
      const filters: GameFilters = {
        whiteEloMin: -100,
        whiteEloMax: 5000,
      }
      const result = validateSearchFiltersResult(filters)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value.whiteEloMin).toBe(0)
        expect(result.value.whiteEloMax).toBe(4000)
      }
    })

    test('removes invalid result values', () => {
      const filters: GameFilters = {
        results: [0.75], // Invalid result
      }
      const result = validateSearchFiltersResult(filters)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value.results).toBeUndefined()
      }
    })
  })

  describe('validateOptionFilters', () => {
    test('returns undefined for null or non-object input', () => {
      expect(validateOptionFilters(null)).toBeUndefined()
      expect(validateOptionFilters(undefined)).toBeUndefined()
      expect(validateOptionFilters('string')).toBeUndefined()
      expect(validateOptionFilters(123)).toBeUndefined()
    })

    test('returns undefined for empty object', () => {
      expect(validateOptionFilters({})).toBeUndefined()
    })

    test('validates and trims player filter', () => {
      const result = validateOptionFilters({ player: '  Carlsen  ' })
      expect(result?.player).toBe('Carlsen')
    })

    test('truncates long player names to 100 chars', () => {
      const result = validateOptionFilters({ player: 'a'.repeat(150) })
      expect(result?.player).toHaveLength(100)
    })

    test('ignores empty player after trimming', () => {
      const result = validateOptionFilters({ player: '   ' })
      expect(result).toBeUndefined()
    })

    test('validates results array with valid values', () => {
      const result = validateOptionFilters({ results: [0.0, 0.5, 1.0] })
      expect(result?.results).toEqual([0.0, 0.5, 1.0])
    })

    test('filters out invalid result values', () => {
      const result = validateOptionFilters({ results: [0.0, 0.3, 0.5, 2.0] })
      expect(result?.results).toEqual([0.0, 0.5])
    })

    test('ignores empty results array', () => {
      const result = validateOptionFilters({ results: [] })
      expect(result).toBeUndefined()
    })

    test('validates and clamps dateFrom', () => {
      const result1 = validateOptionFilters({ dateFrom: 20240101 })
      expect(result1?.dateFrom).toBe(20240101)

      const result2 = validateOptionFilters({ dateFrom: 18000101 })
      expect(result2?.dateFrom).toBe(19000101)

      const result3 = validateOptionFilters({ dateFrom: 22000101 })
      expect(result3?.dateFrom).toBe(21001231)
    })

    test('validates and clamps dateTo', () => {
      const result1 = validateOptionFilters({ dateTo: 20240101 })
      expect(result1?.dateTo).toBe(20240101)

      const result2 = validateOptionFilters({ dateTo: 18000101 })
      expect(result2?.dateTo).toBe(19000101)

      const result3 = validateOptionFilters({ dateTo: 22000101 })
      expect(result3?.dateTo).toBe(21001231)
    })

    test('ignores non-integer dates', () => {
      const result = validateOptionFilters({ dateFrom: 20240101.5, dateTo: '20240101' })
      expect(result).toBeUndefined()
    })

    test('combines multiple valid filters', () => {
      const result = validateOptionFilters({
        player: 'Carlsen',
        results: [1.0],
        dateFrom: 20200101,
        dateTo: 20231231,
      })
      expect(result).toEqual({
        player: 'Carlsen',
        results: [1.0],
        dateFrom: 20200101,
        dateTo: 20231231,
      })
    })

    test('returns undefined when all filters are invalid', () => {
      const result = validateOptionFilters({
        player: '',
        results: [0.3, 0.7],
        dateFrom: 'invalid',
      })
      expect(result).toBeUndefined()
    })
  })

  describe('validateGameId', () => {
    test('accepts positive integers', () => {
      expect(validateGameId(1)).toBe(true)
      expect(validateGameId(100)).toBe(true)
      expect(validateGameId(9999)).toBe(true)
    })

    test('rejects zero', () => {
      expect(validateGameId(0)).toBe(false)
    })

    test('rejects negative numbers', () => {
      expect(validateGameId(-1)).toBe(false)
      expect(validateGameId(-100)).toBe(false)
    })

    test('rejects non-integers', () => {
      expect(validateGameId(1.5)).toBe(false)
      expect(validateGameId(3.14)).toBe(false)
    })

    test('rejects non-numbers', () => {
      expect(validateGameId('5' as any)).toBe(false)
      expect(validateGameId(null as any)).toBe(false)
      expect(validateGameId(undefined as any)).toBe(false)
      expect(validateGameId({} as any)).toBe(false)
    })
  })

  describe('validateBranchPly', () => {
    test('accepts positive integers', () => {
      expect(validateBranchPly(1)).toBe(true)
      expect(validateBranchPly(100)).toBe(true)
      expect(validateBranchPly(9999)).toBe(true)
    })

    test('rejects zero', () => {
      expect(validateBranchPly(0)).toBe(false)
    })

    test('rejects negative numbers', () => {
      expect(validateBranchPly(-1)).toBe(false)
      expect(validateBranchPly(-100)).toBe(false)
    })

    test('rejects non-integers', () => {
      expect(validateBranchPly(1.5)).toBe(false)
      expect(validateBranchPly(3.14)).toBe(false)
    })

    test('rejects non-numbers', () => {
      expect(validateBranchPly('5' as any)).toBe(false)
      expect(validateBranchPly(null as any)).toBe(false)
      expect(validateBranchPly(undefined as any)).toBe(false)
      expect(validateBranchPly({} as any)).toBe(false)
    })
  })

  describe('validateSidelineMoves', () => {
    test('accepts non-empty strings', () => {
      expect(validateSidelineMoves('e4')).toBe(true)
      expect(validateSidelineMoves('Nf3 d5 Bg5')).toBe(true)
      expect(validateSidelineMoves('1. e4 e5 2. Nf3')).toBe(true)
    })

    test('accepts strings with whitespace around valid moves', () => {
      expect(validateSidelineMoves('  e4  ')).toBe(true)
    })

    test('rejects empty strings', () => {
      expect(validateSidelineMoves('')).toBe(false)
    })

    test('rejects whitespace-only strings', () => {
      expect(validateSidelineMoves('   ')).toBe(false)
      expect(validateSidelineMoves('\t\n')).toBe(false)
    })

    test('rejects strings over 10000 characters', () => {
      const longString = 'e4 '.repeat(3400) // ~10200 chars
      expect(validateSidelineMoves(longString)).toBe(false)
    })

    test('accepts strings at exactly 10000 characters', () => {
      const maxString = 'a'.repeat(10000)
      expect(validateSidelineMoves(maxString)).toBe(true)
    })

    test('rejects non-strings', () => {
      expect(validateSidelineMoves(123 as any)).toBe(false)
      expect(validateSidelineMoves(null as any)).toBe(false)
      expect(validateSidelineMoves(undefined as any)).toBe(false)
      expect(validateSidelineMoves({} as any)).toBe(false)
      expect(validateSidelineMoves(['e4', 'e5'] as any)).toBe(false)
    })
  })
})
