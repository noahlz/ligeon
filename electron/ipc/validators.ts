import fs from 'fs'
import type { GameFilters } from './types.js'

/**
 * Validate collection ID to prevent path traversal and ensure safe format
 *
 * @param id - Collection ID to validate
 * @returns True if valid, false otherwise
 */
export function validateCollectionId(id: string): boolean {

  // TODO: return error object (or null - no error) rather than boolean.
  // TODO: Actually, use a validation library here (i.e. Zod or Yup).

  // Must be non-empty
  if (!id || id.length === 0) {
    console.warn('Validation failed: empty collection ID')
    return false
  }

  // Max length check
  if (id.length > 100) {
    console.warn('Validation failed: collection ID too long:', id.length)
    return false
  }

  // No path traversal sequences
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    console.warn('Validation failed: invalid characters in collection ID:', id)
    return false
  }

  // Alphanumeric, hyphens, and underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    console.warn('Validation failed: collection ID contains invalid characters:', id)
    return false
  }

  return true
}

/**
 * Validate file path to ensure it exists and is a readable file
 *
 * @param filePath - File path to validate
 * @param maxSizeMB - Maximum file size in MB (default 100)
 * @returns True if valid, false otherwise
 */
export function validateFilePath(filePath: string, maxSizeMB = 100): boolean {
  // Must be non-empty
  if (!filePath || filePath.length === 0) {
    console.warn('Validation failed: empty file path')
    return false
  }

  // Must exist
  if (!fs.existsSync(filePath)) {
    console.warn('Validation failed: file does not exist:', filePath)
    return false
  }

  // Must be a file (not directory)
  const stats = fs.statSync(filePath)
  if (!stats.isFile()) {
    console.warn('Validation failed: path is not a file:', filePath)
    return false
  }

  // Size check
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (stats.size > maxSizeBytes) {
    console.warn('Validation failed: file too large:', stats.size, 'bytes (max:', maxSizeBytes, ')')
    return false
  }

  return true
}

/**
 * Validate and sanitize search filters
 *
 * @param filters - Search filters to validate
 * @returns Sanitized filters
 */
export function validateSearchFilters(filters: GameFilters): GameFilters {
  const sanitized: GameFilters = {}

  // Sanitize string fields - trim and limit length
  const MAX_STRING_LENGTH = 100

  if (filters.white !== undefined) {
    sanitized.white = filters.white.trim().slice(0, MAX_STRING_LENGTH)
  }
  if (filters.black !== undefined) {
    sanitized.black = filters.black.trim().slice(0, MAX_STRING_LENGTH)
  }
  if (filters.event !== undefined) {
    sanitized.event = filters.event.trim().slice(0, MAX_STRING_LENGTH)
  }
  if (filters.ecoCode !== undefined) {
    sanitized.ecoCode = filters.ecoCode.trim().slice(0, 10) // ECO codes are short
  }

  // Copy numeric fields with range validation
  if (filters.result !== undefined && filters.result !== null) {
    // Result must be 0.0, 0.5, or 1.0
    if ([0.0, 0.5, 1.0].includes(filters.result)) {
      sanitized.result = filters.result
    }
  }

  // Date timestamps - must be reasonable (after 1900, before 2100)
  const MIN_TIMESTAMP = new Date('1900-01-01').getTime()
  const MAX_TIMESTAMP = new Date('2100-01-01').getTime()

  if (filters.dateFrom !== undefined && filters.dateFrom !== null) {
    sanitized.dateFrom = Math.max(MIN_TIMESTAMP, Math.min(MAX_TIMESTAMP, filters.dateFrom))
  }
  if (filters.dateTo !== undefined && filters.dateTo !== null) {
    sanitized.dateTo = Math.max(MIN_TIMESTAMP, Math.min(MAX_TIMESTAMP, filters.dateTo))
  }

  // ELO ranges - must be 0-4000
  const MIN_ELO = 0
  const MAX_ELO = 4000

  if (filters.whiteEloMin !== undefined && filters.whiteEloMin !== null) {
    sanitized.whiteEloMin = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.whiteEloMin))
  }
  if (filters.whiteEloMax !== undefined && filters.whiteEloMax !== null) {
    sanitized.whiteEloMax = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.whiteEloMax))
  }
  if (filters.blackEloMin !== undefined && filters.blackEloMin !== null) {
    sanitized.blackEloMin = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.blackEloMin))
  }
  if (filters.blackEloMax !== undefined && filters.blackEloMax !== null) {
    sanitized.blackEloMax = Math.max(MIN_ELO, Math.min(MAX_ELO, filters.blackEloMax))
  }

  // Limit - must be 1-10000
  if (filters.limit !== undefined) {
    sanitized.limit = Math.max(1, Math.min(10000, filters.limit))
  }

  return sanitized
}

/**
 * Validate collection name for rename operations
 *
 * @param name - Collection name to validate
 * @returns True if valid, false otherwise
 */
export function validateCollectionName(name: string): boolean {
  // Must be non-empty
  if (!name || name.trim().length === 0) {
    console.warn('Validation failed: empty collection name')
    return false
  }

  // Max length check
  if (name.length > 200) {
    console.warn('Validation failed: collection name too long:', name.length)
    return false
  }

  return true
}
