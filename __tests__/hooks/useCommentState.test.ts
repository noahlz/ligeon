import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useCommentState } from '@/hooks/useCommentState'
import { mockElectron, installElectronMock } from '../helpers/electronMock'
import type { CommentData } from '../../src/shared/types/game'

beforeEach(() => {
  installElectronMock()
  vi.clearAllMocks()
})

function makeComment(overrides: Partial<CommentData> & Pick<CommentData, 'ply'>): CommentData {
  return { id: 1, gameId: 42, variationId: null, text: 'A comment', ...overrides }
}

describe('useCommentState', () => {
  describe('loadComments', () => {
    it('separates mainline and variation comments, resets editing state', async () => {
      const mainline = makeComment({ ply: 2, text: 'Nice move' })
      const variation = makeComment({ id: 2, ply: 4, variationId: 7, text: 'Alt line' })
      mockElectron.getComments.mockResolvedValue([mainline, variation])

      const { result } = renderHook(() => useCommentState())

      // Put the hook into an editing state so we can verify the reset
      act(() => {
        result.current.startEditing(10)
      })

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      expect(mockElectron.getComments).toHaveBeenCalledWith('col-1', 42)

      // variationId === null → mainline comments
      expect(result.current.comments).toEqual([mainline])

      // variationId !== null → variation comments map
      expect(result.current.variationComments.get(7)).toEqual(variation)

      // Editing state must be reset
      expect(result.current.editingPly).toBeNull()
      expect(result.current.editValue).toBe('')
      expect(result.current.pendingDeletion).toBeNull()
    })
  })

  describe('startEditing', () => {
    it('sets editingPly and leaves editValue empty when no existing comment at that ply', () => {
      const { result } = renderHook(() => useCommentState())

      act(() => {
        result.current.startEditing(5)
      })

      expect(result.current.editingPly).toBe(5)
      expect(result.current.editValue).toBe('')
    })

    it('pre-populates editValue with the existing comment text', async () => {
      const existing = makeComment({ ply: 3, text: 'Interesting choice' })
      mockElectron.getComments.mockResolvedValue([existing])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.startEditing(3)
      })

      expect(result.current.editingPly).toBe(3)
      expect(result.current.editValue).toBe('Interesting choice')
    })
  })

  describe('saveComment — empty text, existing comment', () => {
    it('sets pendingDeletion to the ply and does NOT clear editingPly', async () => {
      const existing = makeComment({ ply: 4, text: 'Old comment' })
      mockElectron.getComments.mockResolvedValue([existing])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.startEditing(4)
        result.current.setEditValue('  ')
      })

      await act(async () => {
        await result.current.saveComment('col-1', 42)
      })

      expect(result.current.pendingDeletion).toBe(4)
      expect(result.current.editingPly).toBe(4)
      expect(mockElectron.upsertComment).not.toHaveBeenCalled()
    })
  })

  describe('saveComment — empty text, no existing comment', () => {
    it('cancels editing without calling upsertComment', async () => {
      mockElectron.getComments.mockResolvedValue([])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.startEditing(6)
        // editValue defaults to '' — leave it empty
      })

      await act(async () => {
        await result.current.saveComment('col-1', 42)
      })

      expect(mockElectron.upsertComment).not.toHaveBeenCalled()
      expect(result.current.editingPly).toBeNull()
      expect(result.current.editValue).toBe('')
    })
  })

  describe('saveComment — non-empty text', () => {
    it('calls upsertComment with trimmed text, clears editingPly and editValue', async () => {
      mockElectron.getComments.mockResolvedValue([])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.startEditing(7)
        result.current.setEditValue('  good move  ')
      })

      const saved = makeComment({ ply: 7, text: 'good move' })
      mockElectron.upsertComment.mockResolvedValue(saved)

      await act(async () => {
        await result.current.saveComment('col-1', 42)
      })

      expect(mockElectron.upsertComment).toHaveBeenCalledWith('col-1', 42, 7, 'good move')
      expect(result.current.editingPly).toBeNull()
      expect(result.current.editValue).toBe('')
      expect(result.current.comments).toContainEqual(saved)
    })
  })

  describe('confirmDeletion', () => {
    it('calls deleteComment and removes the comment from state after requestDeletion', async () => {
      const existing = makeComment({ ply: 2, text: 'Remove me' })
      mockElectron.getComments.mockResolvedValue([existing])
      mockElectron.deleteComment.mockResolvedValue(undefined)

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.requestDeletion(2)
      })

      expect(result.current.pendingDeletion).toBe(2)

      await act(async () => {
        await result.current.confirmDeletion('col-1', 42)
      })

      expect(mockElectron.deleteComment).toHaveBeenCalledWith('col-1', 42, 2)
      expect(result.current.comments.find(c => c.ply === 2)).toBeUndefined()
      expect(result.current.pendingDeletion).toBeNull()
    })
  })

  describe('cancelEditing', () => {
    it('clears editingPly and editValue', () => {
      const { result } = renderHook(() => useCommentState())

      act(() => {
        result.current.startEditing(5)
        result.current.setEditValue('draft')
      })

      expect(result.current.editingPly).toBe(5)
      expect(result.current.editValue).toBe('draft')

      act(() => {
        result.current.cancelEditing()
      })

      expect(result.current.editingPly).toBeNull()
      expect(result.current.editValue).toBe('')
    })
  })

  describe('cancelDeletion', () => {
    it('clears pendingDeletion, editingPly, and editValue', async () => {
      const existing = makeComment({ ply: 3, text: 'To maybe delete' })
      mockElectron.getComments.mockResolvedValue([existing])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.requestDeletion(3)
      })

      expect(result.current.pendingDeletion).toBe(3)

      act(() => {
        result.current.cancelDeletion()
      })

      expect(result.current.pendingDeletion).toBeNull()
      expect(result.current.editingPly).toBeNull()
      expect(result.current.editValue).toBe('')
    })
  })

  describe('getCommentAtPly', () => {
    it('returns the comment at a known ply and undefined for an unknown ply', async () => {
      const c1 = makeComment({ ply: 1, text: 'First move comment' })
      const c2 = makeComment({ id: 2, ply: 3, text: 'Third move comment' })
      mockElectron.getComments.mockResolvedValue([c1, c2])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      expect(result.current.getCommentAtPly(1)).toEqual(c1)
      expect(result.current.getCommentAtPly(3)).toEqual(c2)
      expect(result.current.getCommentAtPly(99)).toBeUndefined()
    })
  })

  describe('updateVariationComment', () => {
    it('adds the comment to variationComments map when variationId is set', () => {
      const { result } = renderHook(() => useCommentState())
      const varComment = makeComment({ id: 10, ply: 2, variationId: 7, text: 'Variation note' })

      act(() => {
        result.current.updateVariationComment(varComment)
      })

      expect(result.current.variationComments.get(7)).toEqual(varComment)
    })

    it('does nothing when variationId is null (guard branch)', () => {
      const { result } = renderHook(() => useCommentState())
      const mainlineComment = makeComment({ ply: 2, variationId: null, text: 'Mainline note' })

      act(() => {
        result.current.updateVariationComment(mainlineComment)
      })

      expect(result.current.variationComments.size).toBe(0)
    })
  })

  describe('removeVariationComment', () => {
    it('removes the comment from the variationComments map', () => {
      const { result } = renderHook(() => useCommentState())
      const varComment = makeComment({ id: 10, ply: 2, variationId: 7, text: 'Variation note' })

      act(() => {
        result.current.updateVariationComment(varComment)
      })

      expect(result.current.variationComments.has(7)).toBe(true)

      act(() => {
        result.current.removeVariationComment(7)
      })

      expect(result.current.variationComments.has(7)).toBe(false)
    })
  })

  describe('saveComment — update in-place', () => {
    it('replaces the existing comment at the same ply rather than appending', async () => {
      const existing = makeComment({ ply: 6, text: 'Old text' })
      mockElectron.getComments.mockResolvedValue([existing])

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.startEditing(6)
        result.current.setEditValue('Updated text')
      })

      const updated = makeComment({ ply: 6, text: 'Updated text' })
      mockElectron.upsertComment.mockResolvedValue(updated)

      await act(async () => {
        await result.current.saveComment('col-1', 42)
      })

      expect(result.current.comments.filter(c => c.ply === 6)).toHaveLength(1)
      expect(result.current.comments.find(c => c.ply === 6)?.text).toBe('Updated text')
    })
  })

  describe('saveComment — catch block', () => {
    it('does not throw when upsertComment rejects', async () => {
      mockElectron.getComments.mockResolvedValue([])
      mockElectron.upsertComment.mockRejectedValue(new Error('DB error'))

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.startEditing(8)
        result.current.setEditValue('Some text')
      })

      await expect(
        act(async () => { await result.current.saveComment('col-1', 42) })
      ).resolves.toBeUndefined()
    })
  })

  describe('confirmDeletion — catch block', () => {
    it('does not throw when deleteComment rejects, and keeps the comment in state', async () => {
      const existing = makeComment({ ply: 4, text: 'Keep me' })
      mockElectron.getComments.mockResolvedValue([existing])
      mockElectron.deleteComment.mockRejectedValue(new Error('DB error'))

      const { result } = renderHook(() => useCommentState())

      await act(async () => {
        await result.current.loadComments('col-1', 42)
      })

      act(() => {
        result.current.requestDeletion(4)
      })

      await expect(
        act(async () => { await result.current.confirmDeletion('col-1', 42) })
      ).resolves.toBeUndefined()

      // Comment should still be present since deletion failed
      expect(result.current.comments.find(c => c.ply === 4)).toBeDefined()
    })
  })
})
