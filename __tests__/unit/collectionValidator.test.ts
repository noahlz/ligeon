import { describe, it, expect } from 'vitest'
import { validateCollectionName } from '../../src/utils/collectionValidator.js'

describe('collectionValidator', () => {
  describe('validateCollectionName', () => {
    const collections = [
      { id: 'id-1', name: 'My Games' },
      { id: 'id-2', name: 'World Championships' },
      { id: 'id-3', name: 'Fischer Games' },
    ]

    it('validates a unique name', () => {
      const result = validateCollectionName('New Collection', collections)
      expect(result).toEqual({ valid: true })
    })

    it('rejects empty string', () => {
      const result = validateCollectionName('', collections)
      expect(result).toEqual({ valid: false, error: 'empty' })
    })

    it('rejects whitespace-only string', () => {
      const result = validateCollectionName('   ', collections)
      expect(result).toEqual({ valid: false, error: 'empty' })
    })

    it('rejects duplicate name (exact match)', () => {
      const result = validateCollectionName('My Games', collections)
      expect(result).toEqual({ valid: false, error: 'duplicate' })
    })

    it('rejects duplicate name (case-insensitive)', () => {
      const result = validateCollectionName('my games', collections)
      expect(result).toEqual({ valid: false, error: 'duplicate' })
    })

    it('rejects duplicate name (mixed case)', () => {
      const result = validateCollectionName('MY GAMES', collections)
      expect(result).toEqual({ valid: false, error: 'duplicate' })
    })

    it('allows renaming to same name when excludeId provided', () => {
      const result = validateCollectionName('My Games', collections, 'id-1')
      expect(result).toEqual({ valid: true })
    })

    it('rejects duplicate when excludeId is different', () => {
      const result = validateCollectionName('My Games', collections, 'id-2')
      expect(result).toEqual({ valid: false, error: 'duplicate' })
    })

    it('trims whitespace before validation', () => {
      const result = validateCollectionName('  New Collection  ', collections)
      expect(result).toEqual({ valid: true })
    })

    it('handles empty collections array', () => {
      const result = validateCollectionName('Any Name', [])
      expect(result).toEqual({ valid: true })
    })
  })
})
