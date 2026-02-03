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
      expect(validateSearchFilters({ result: 0.0 }).result).toBe(0.0)
      expect(validateSearchFilters({ result: 0.5 }).result).toBe(0.5)
      expect(validateSearchFilters({ result: 1.0 }).result).toBe(1.0)
    })

    test('rejects invalid result values', () => {
      expect(validateSearchFilters({ result: 0.3 }).result).toBeUndefined()
      expect(validateSearchFilters({ result: 2.0 }).result).toBeUndefined()
      expect(validateSearchFilters({ result: -1.0 }).result).toBeUndefined()
    })

    test('clamps date YYYYMM to valid range', () => {
      const tooEarly = 180001 // Before 1900
      const tooLate = 220001 // After 2100

      const result = validateSearchFilters({
        dateFrom: tooEarly,
        dateTo: tooLate,
      })

      expect(result.dateFrom).toBe(190001) // Clamped to MIN_YYYYMM
      expect(result.dateTo).toBe(210012) // Clamped to MAX_YYYYMM
    })

    test('preserves valid date YYYYMM', () => {
      const validDate = 202001 // January 2020
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
        result: null,
        dateFrom: null,
        dateTo: null,
        whiteEloMin: null,
        whiteEloMax: null,
        blackEloMin: null,
        blackEloMax: null,
      })

      expect(result.result).toBeUndefined()
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
        result: 1.0,
        dateFrom: 202301,
        dateTo: 202312,
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
      expect(sanitized.result).toBe(1.0)
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
        result: 1.0,
      }
      const result = validateSearchFiltersResult(filters)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value.white).toBe('Magnus Carlsen')
        expect(result.value.black).toBe('Hikaru Nakamura')
        expect(result.value.result).toBe(1.0)
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
        result: 0.75, // Invalid result
      }
      const result = validateSearchFiltersResult(filters)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value.result).toBeUndefined()
      }
    })
  })
})
