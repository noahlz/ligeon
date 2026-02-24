import { describe, it, expect } from 'vitest'
import { IpcError } from '../../src/shared/types/ipcError.js'

describe('IpcError', () => {
  describe('constructor', () => {
    it('creates an error with IPC_ERROR: prefix in message', () => {
      const err = new IpcError('Something went wrong', 'testModule', 'testOp', {})
      expect(err.message.startsWith('IPC_ERROR:')).toBe(true)
    })

    it('encodes userMessage into message payload', () => {
      const err = new IpcError('User-facing message', 'mod', 'op', {})
      const payload = JSON.parse(err.message.slice('IPC_ERROR:'.length))
      expect(payload.userMessage).toBe('User-facing message')
    })

    it('encodes module and operation into message payload', () => {
      const err = new IpcError('msg', 'myModule', 'myOperation', { key: 'val' })
      const payload = JSON.parse(err.message.slice('IPC_ERROR:'.length))
      expect(payload.module).toBe('myModule')
      expect(payload.operation).toBe('myOperation')
      expect(payload.context).toEqual({ key: 'val' })
    })

    it('sets name to IpcError', () => {
      const err = new IpcError('msg', 'mod', 'op', {})
      expect(err.name).toBe('IpcError')
    })

    it('does not throw when context contains non-serializable values', () => {
      // Circular reference
      const circular: Record<string, unknown> = {}
      circular.self = circular

      expect(() => new IpcError('msg', 'mod', 'op', circular)).not.toThrow()
    })

    it('falls back gracefully when context is non-serializable', () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular

      const err = new IpcError('user msg', 'mod', 'op', circular)
      // Should still be parseable and preserve userMessage
      const userMsg = IpcError.getUserMessage(err)
      expect(userMsg).toBe('user msg')
    })
  })

  describe('getUserMessage', () => {
    it('returns null for non-Error input', () => {
      expect(IpcError.getUserMessage(null)).toBeNull()
      expect(IpcError.getUserMessage(undefined)).toBeNull()
      expect(IpcError.getUserMessage('string')).toBeNull()
      expect(IpcError.getUserMessage(42)).toBeNull()
    })

    it('returns null for plain Error without IPC_ERROR prefix', () => {
      expect(IpcError.getUserMessage(new Error('something else'))).toBeNull()
    })

    it('returns null for Error with IPC_ERROR prefix but invalid JSON', () => {
      const bad = new Error('IPC_ERROR:not-valid-json{{{')
      expect(IpcError.getUserMessage(bad)).toBeNull()
    })

    it('returns userMessage from an IpcError', () => {
      const err = new IpcError('Failed to save', 'handlers', 'save', { id: 1 })
      expect(IpcError.getUserMessage(err)).toBe('Failed to save')
    })

    it('works with an IpcError that has crossed the IPC boundary (reconstructed as plain Error)', () => {
      // Simulate what Electron does: structured clone only preserves message/name/stack
      const original = new IpcError('Cross-boundary message', 'mod', 'op', {})
      const reconstructed = new Error(original.message)
      expect(IpcError.getUserMessage(reconstructed)).toBe('Cross-boundary message')
    })
  })
})
