import { describe, it, expect } from 'vitest'
import { isEditableInput } from '../../src/renderer/utils/domUtils.js'

describe('domUtils', () => {
  describe('isEditableInput', () => {
    it('returns true for HTMLInputElement', () => {
      const input = document.createElement('input')
      expect(isEditableInput(input)).toBe(true)
    })

    it('returns true for HTMLTextAreaElement', () => {
      const textarea = document.createElement('textarea')
      expect(isEditableInput(textarea)).toBe(true)
    })

    it('returns false for HTMLDivElement', () => {
      const div = document.createElement('div')
      expect(isEditableInput(div)).toBe(false)
    })

    it('returns false for HTMLButtonElement', () => {
      const button = document.createElement('button')
      expect(isEditableInput(button)).toBe(false)
    })

    it('returns false for null', () => {
      expect(isEditableInput(null)).toBe(false)
    })

    it('returns false for HTMLSelectElement', () => {
      const select = document.createElement('select')
      expect(isEditableInput(select)).toBe(false)
    })
  })
})
