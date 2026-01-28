export interface ValidationResult {
  valid: boolean
  error?: 'empty' | 'duplicate'
}

export interface Collection {
  id: string
  name: string
}

/**
 * Validate a collection name against existing collections
 *
 * @param name - Collection name to validate
 * @param collections - Existing collections
 * @param excludeId - Collection ID to exclude from duplicate check (for renames)
 * @returns Validation result with error type if invalid
 *
 * @example
 * validateCollectionName('My Games', collections, 'id-123')
 * // => { valid: true }
 *
 * validateCollectionName('', collections)
 * // => { valid: false, error: 'empty' }
 */
export function validateCollectionName(
  name: string,
  collections: Collection[],
  excludeId?: string
): ValidationResult {
  const trimmed = name.trim()

  // Validation: empty name
  if (!trimmed) {
    return { valid: false, error: 'empty' }
  }

  // Validation: duplicate name (case-insensitive)
  const duplicate = collections.find(
    (c) => c.id !== excludeId && c.name.toLowerCase() === trimmed.toLowerCase()
  )

  if (duplicate) {
    return { valid: false, error: 'duplicate' }
  }

  return { valid: true }
}
