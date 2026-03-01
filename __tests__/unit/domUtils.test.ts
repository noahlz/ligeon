import { describe, it, expect } from 'vitest'
import { isEditableInput, getWheelDirection, shouldProcessWheelEvent } from '../../src/renderer/utils/domUtils.js'

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

    it('returns false for contenteditable div (not guarded by current implementation)', () => {
      const div = document.createElement('div')
      div.contentEditable = 'true'
      expect(isEditableInput(div)).toBe(false)
    })
  })

  describe('getWheelDirection', () => {
    it('returns "next" for positive deltaY (scroll down)', () => {
      expect(getWheelDirection(1)).toBe('next')
      expect(getWheelDirection(100)).toBe('next')
    })

    it('returns "prev" for negative deltaY (scroll up)', () => {
      expect(getWheelDirection(-1)).toBe('prev')
      expect(getWheelDirection(-100)).toBe('prev')
    })

    it('returns null for zero deltaY', () => {
      expect(getWheelDirection(0)).toBeNull()
    })
  })

  describe('shouldProcessWheelEvent', () => {
    it('returns false when elapsed time is less than debounce threshold', () => {
      expect(shouldProcessWheelEvent(100, 60, 50)).toBe(false)
    })

    it('returns true when elapsed time equals the debounce threshold', () => {
      expect(shouldProcessWheelEvent(100, 50, 50)).toBe(true)
    })

    it('returns true when elapsed time exceeds the debounce threshold', () => {
      expect(shouldProcessWheelEvent(200, 50, 50)).toBe(true)
    })

    it('returns false when no time has elapsed', () => {
      expect(shouldProcessWheelEvent(50, 50, 50)).toBe(false)
    })
  })
})
