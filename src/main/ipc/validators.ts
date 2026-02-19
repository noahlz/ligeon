import fs from 'fs'
import type { GameFilters, OptionFilters } from './types.js'
import { logger } from '../config/logger.js'

/**
 * Validation error details
 */
export interface ValidationError {
  code: string
  message: string
  field?: string
}

/**
 * Result of a validation operation
 * Returns either a valid value or an array of all validation errors
 */
export type ValidationResult<T = void> =
  | { valid: true; value: T }
  | { valid: false; errors: ValidationError[] }

/**
 * Validate collection ID and return detailed error information
 *
 * @param id - Collection ID to validate
 * @returns ValidationResult with either valid ID or array of all errors
 */
export function validateCollectionIdResult(id: string): ValidationResult<string> {
  const errors: ValidationError[] = []

  // Check ALL conditions, don't return early
  if (!id || id.length === 0) {
    errors.push({
      code: 'EMPTY',
      message: 'Collection ID is required',
      field: 'collectionId',
    })
  }

  if (id.length > 100) {
    errors.push({
      code: 'TOO_LONG',
      message: 'Collection ID must be 100 characters or less',
      field: 'collectionId',
    })
  }

  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    errors.push({
      code: 'PATH_TRAVERSAL',
      message: 'Collection ID contains invalid path characters',
      field: 'collectionId',
    })
  }

  if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
    errors.push({
      code: 'INVALID_CHARACTERS',
      message: 'Collection ID must contain only alphanumeric characters, hyphens, and underscores',
      field: 'collectionId',
    })
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, value: id }
}

/**
 * Validate collection ID to prevent path traversal and ensure safe format
 *
 * @param id - Collection ID to validate
 * @returns True if valid, false otherwise
 */
export function validateCollectionId(id: string): boolean {
  const result = validateCollectionIdResult(id)
  if (!result.valid) {
    logger.warn('Validation failed:', result.errors[0].message.toLowerCase())
  }
  return result.valid
}

/**
 * Validate file path and return detailed error information
 *
 * @param filePath - File path to validate
 * @param maxSizeMB - Maximum file size in MB (default 100)
 * @returns ValidationResult with either valid path or array of all errors
 */
export function validateFilePathResult(filePath: string, maxSizeMB = 100): ValidationResult<string> {
  const errors: ValidationError[] = []

  // Check ALL conditions, don't return early
  if (!filePath || filePath.length === 0) {
    errors.push({
      code: 'EMPTY',
      message: 'File path is required',
      field: 'filePath',
    })
    // Can't continue validation without a path
    return { valid: false, errors }
  }

  if (!fs.existsSync(filePath)) {
    errors.push({
      code: 'NOT_FOUND',
      message: `File does not exist: ${filePath}`,
      field: 'filePath',
    })
    // Can't continue validation if file doesn't exist
    return { valid: false, errors }
  }

  let stats
  try {
    stats = fs.statSync(filePath)
  } catch (error) {
    errors.push({
      code: 'READ_ERROR',
      message: `Cannot read file: ${error instanceof Error ? error.message : String(error)}`,
      field: 'filePath',
    })
    return { valid: false, errors }
  }

  if (!stats.isFile()) {
    errors.push({
      code: 'NOT_A_FILE',
      message: 'Path must be a file, not a directory',
      field: 'filePath',
    })
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (stats.size > maxSizeBytes) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File size (${stats.size} bytes) exceeds maximum (${maxSizeBytes} bytes)`,
      field: 'filePath',
    })
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, value: filePath }
}

/**
 * Validate file path to ensure it exists and is a readable file
 *
 * @param filePath - File path to validate
 * @param maxSizeMB - Maximum file size in MB (default 100)
 * @returns True if valid, false otherwise
 */
export function validateFilePath(filePath: string, maxSizeMB = 100): boolean {
  const result = validateFilePathResult(filePath, maxSizeMB)
  if (!result.valid) {
    logger.warn('Validation failed:', result.errors[0].message.toLowerCase())
  }
  return result.valid
}

/**
 * Validate and sanitize search filters with detailed error reporting
 *
 * @param filters - Search filters to validate
 * @returns ValidationResult with either sanitized filters or array of warnings
 */
export function validateSearchFiltersResult(filters: GameFilters): ValidationResult<GameFilters> {
  const sanitized: GameFilters = {}
  const warnings: ValidationError[] = []

  // Sanitize string fields - trim and limit length
  const MAX_STRING_LENGTH = 100

  if (filters.player !== undefined) {
    const trimmed = filters.player.trim()
    if (trimmed.length > MAX_STRING_LENGTH) {
      warnings.push({
        code: 'STRING_TRUNCATED',
        message: `Player name truncated to ${MAX_STRING_LENGTH} characters`,
        field: 'player',
      })
    }
    sanitized.player = trimmed.slice(0, MAX_STRING_LENGTH)
  }
  if (filters.white !== undefined) {
    const trimmed = filters.white.trim()
    if (trimmed.length > MAX_STRING_LENGTH) {
      warnings.push({
        code: 'STRING_TRUNCATED',
        message: `White player name truncated to ${MAX_STRING_LENGTH} characters`,
        field: 'white',
      })
    }
    sanitized.white = trimmed.slice(0, MAX_STRING_LENGTH)
  }
  if (filters.black !== undefined) {
    const trimmed = filters.black.trim()
    if (trimmed.length > MAX_STRING_LENGTH) {
      warnings.push({
        code: 'STRING_TRUNCATED',
        message: `Black player name truncated to ${MAX_STRING_LENGTH} characters`,
        field: 'black',
      })
    }
    sanitized.black = trimmed.slice(0, MAX_STRING_LENGTH)
  }
  if (filters.event !== undefined) {
    const trimmed = filters.event.trim()
    if (trimmed.length > MAX_STRING_LENGTH) {
      warnings.push({
        code: 'STRING_TRUNCATED',
        message: `Event name truncated to ${MAX_STRING_LENGTH} characters`,
        field: 'event',
      })
    }
    sanitized.event = trimmed.slice(0, MAX_STRING_LENGTH)
  }
  if (filters.ecoCodes !== undefined && Array.isArray(filters.ecoCodes)) {
    const validCodes: string[] = []
    for (const code of filters.ecoCodes) {
      const trimmed = code.trim()
      if (trimmed.length > 10) {
        warnings.push({
          code: 'STRING_TRUNCATED',
          message: `ECO code '${trimmed}' truncated to 10 characters`,
          field: 'ecoCodes',
        })
      }
      if (trimmed.length > 0) {
        validCodes.push(trimmed.slice(0, 10))
      }
    }
    sanitized.ecoCodes = validCodes.length > 0 ? validCodes : undefined
  }

  // Results array validation
  if (filters.results !== undefined && Array.isArray(filters.results) && filters.results.length > 0) {
    const VALID_RESULTS = [0.0, 0.5, 1.0]
    const validResults = filters.results.filter(r => VALID_RESULTS.includes(r))

    if (validResults.length > 0) {
      sanitized.results = validResults
    }

    if (validResults.length < filters.results.length) {
      warnings.push({
        code: 'INVALID_RESULT_VALUES',
        message: 'Some result values were invalid and filtered out. Valid: 0.0 (black), 0.5 (draw), 1.0 (white)',
        field: 'results',
      })
    }
  }

  // Copy numeric fields with range validation

  // Date YYYYMMDD - must be reasonable (19000101 to 21001231)
  const MIN_YYYYMMDD = 19000101
  const MAX_YYYYMMDD = 21001231

  if (filters.dateFrom !== undefined && filters.dateFrom !== null) {
    const clamped = Math.max(MIN_YYYYMMDD, Math.min(MAX_YYYYMMDD, filters.dateFrom))
    if (clamped !== filters.dateFrom) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'Date from value clamped to valid range (19000101-21001231)',
        field: 'dateFrom',
      })
    }
    sanitized.dateFrom = clamped
  }
  if (filters.dateTo !== undefined && filters.dateTo !== null) {
    const clamped = Math.max(MIN_YYYYMMDD, Math.min(MAX_YYYYMMDD, filters.dateTo))
    if (clamped !== filters.dateTo) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'Date to value clamped to valid range (19000101-21001231)',
        field: 'dateTo',
      })
    }
    sanitized.dateTo = clamped
  }

  // ELO ranges - must be 0-4000
  const MIN_ELO = 0
  const MAX_ELO = 4000

  if (filters.whiteEloMin !== undefined && filters.whiteEloMin !== null) {
    const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.whiteEloMin))
    if (clamped !== filters.whiteEloMin) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'White ELO min clamped to valid range (0-4000)',
        field: 'whiteEloMin',
      })
    }
    sanitized.whiteEloMin = clamped
  }
  if (filters.whiteEloMax !== undefined && filters.whiteEloMax !== null) {
    const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.whiteEloMax))
    if (clamped !== filters.whiteEloMax) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'White ELO max clamped to valid range (0-4000)',
        field: 'whiteEloMax',
      })
    }
    sanitized.whiteEloMax = clamped
  }
  if (filters.blackEloMin !== undefined && filters.blackEloMin !== null) {
    const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.blackEloMin))
    if (clamped !== filters.blackEloMin) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'Black ELO min clamped to valid range (0-4000)',
        field: 'blackEloMin',
      })
    }
    sanitized.blackEloMin = clamped
  }
  if (filters.blackEloMax !== undefined && filters.blackEloMax !== null) {
    const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.blackEloMax))
    if (clamped !== filters.blackEloMax) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'Black ELO max clamped to valid range (0-4000)',
        field: 'blackEloMax',
      })
    }
    sanitized.blackEloMax = clamped
  }

  // Limit - must be 1-10000
  if (filters.limit !== undefined) {
    const clamped = Math.max(1, Math.min(10000, filters.limit))
    if (clamped !== filters.limit) {
      warnings.push({
        code: 'VALUE_CLAMPED',
        message: 'Limit clamped to valid range (1-10000)',
        field: 'limit',
      })
    }
    sanitized.limit = clamped
  }

  // Always return valid with sanitized filters; warnings are informational
  return { valid: true, value: sanitized }
}

/**
 * Validate and sanitize search filters
 *
 * @param filters - Search filters to validate
 * @returns Sanitized filters
 */
export function validateSearchFilters(filters: GameFilters): GameFilters {
  const result = validateSearchFiltersResult(filters)
  return result.valid ? result.value : {}
}

/**
 * Validate collection name and return detailed error information
 *
 * @param name - Collection name to validate
 * @returns ValidationResult with either valid name or array of all errors
 */
export function validateCollectionNameResult(name: string): ValidationResult<string> {
  const errors: ValidationError[] = []

  // Check ALL conditions, don't return early
  if (!name || name.trim().length === 0) {
    errors.push({
      code: 'EMPTY',
      message: 'Collection name is required',
      field: 'collectionName',
    })
  }

  if (name.length > 200) {
    errors.push({
      code: 'TOO_LONG',
      message: 'Collection name must be 200 characters or less',
      field: 'collectionName',
    })
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, value: name }
}

/**
 * Validate collection name for rename operations
 *
 * @param name - Collection name to validate
 * @returns True if valid, false otherwise
 */
export function validateCollectionName(name: string): boolean {
  const result = validateCollectionNameResult(name)
  if (!result.valid) {
    logger.warn('Validation failed:', result.errors[0].message.toLowerCase())
  }
  return result.valid
}

/**
 * Validate and sanitize option filters used for narrowing date/opening dropdowns
 */
export function validateOptionFilters(filters: unknown): OptionFilters | undefined {
  if (!filters || typeof filters !== 'object') return undefined

  const f = filters as Record<string, unknown>
  const sanitized: OptionFilters = {}

  if (typeof f.player === 'string') {
    const trimmed = f.player.trim().slice(0, 100)
    if (trimmed.length > 0) sanitized.player = trimmed
  }

  if (Array.isArray(f.results) && f.results.length > 0) {
    const VALID_RESULTS = [0.0, 0.5, 1.0]
    const valid = f.results.filter((r: unknown) => typeof r === 'number' && VALID_RESULTS.includes(r))
    if (valid.length > 0) sanitized.results = valid
  }

  if (typeof f.dateFrom === 'number' && Number.isInteger(f.dateFrom)) {
    sanitized.dateFrom = Math.max(19000101, Math.min(21001231, f.dateFrom))
  }

  if (typeof f.dateTo === 'number' && Number.isInteger(f.dateTo)) {
    sanitized.dateTo = Math.max(19000101, Math.min(21001231, f.dateTo))
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

/**
 * Validate game ID
 *
 * @param id - Game ID to validate
 * @returns True if valid (positive integer), false otherwise
 */
export function validateGameId(id: unknown): id is number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    logger.warn('Validation failed: game ID must be a positive integer')
    return false
  }
  return true
}

/**
 * Validate branch ply (mainline ply where variation departs)
 *
 * @param ply - Branch ply to validate
 * @returns True if valid (positive integer), false otherwise
 */
export function validateBranchPly(ply: unknown): ply is number {
  if (typeof ply !== 'number' || !Number.isInteger(ply) || ply < 1) {
    logger.warn('Validation failed: branch ply must be a positive integer')
    return false
  }
  return true
}

/**
 * Validate variation moves string
 *
 * @param moves - Moves string to validate
 * @returns True if valid (non-empty string under 10000 chars), false otherwise
 */
export function validateVariationMoves(moves: unknown): moves is string {
  if (typeof moves !== 'string' || moves.trim().length === 0) {
    logger.warn('Validation failed: variation moves must be a non-empty string')
    return false
  }
  if (moves.length > 10000) {
    logger.warn('Validation failed: variation moves must be 10000 characters or less')
    return false
  }
  return true
}

/**
 * Validate comment ply (mainline ply a comment is attached to)
 *
 * @param ply - Ply to validate
 * @returns True if valid (positive integer >= 1), false otherwise
 */
export function validateCommentPly(ply: unknown): ply is number {
  if (typeof ply !== 'number' || !Number.isInteger(ply) || ply < 1) {
    logger.warn('Validation failed: comment ply must be a positive integer')
    return false
  }
  return true
}

/**
 * Validate comment text
 *
 * @param text - Comment text to validate
 * @returns True if valid (non-empty string, max 500 chars), false otherwise
 */
export function validateCommentText(text: unknown): text is string {
  if (typeof text !== 'string' || text.trim().length === 0) {
    logger.warn('Validation failed: comment text must be a non-empty string')
    return false
  }
  if (text.length > 500) {
    logger.warn('Validation failed: comment text must be 500 characters or less')
    return false
  }
  return true
}
