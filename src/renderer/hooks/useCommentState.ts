/**
 * useCommentState - manages per-move comment creation, editing, and persistence.
 *
 * Owns all mainline comment state for the current game: the list of saved comments,
 * which ply (if any) is in edit mode, the current input value, and any pending deletion.
 */

import { useState, useCallback } from 'react'
import { showErrorToast } from '../utils/errorToast.js'
import type { CommentData } from '../../shared/types/game.js'

export interface UseCommentStateReturn {
  /** All mainline comments for the current game */
  comments: CommentData[]
  /** All variation comments for the current game, keyed by variationId */
  variationComments: Map<number, CommentData>
  /** Ply currently in edit mode (null = no comment being edited) */
  editingPly: number | null
  /** Current value of the comment input */
  editValue: string
  /** Ply awaiting delete confirmation (null = no pending deletion) */
  pendingDeletion: number | null

  /** Fetch comments for a game and reset all editing state */
  loadComments: (collectionId: string, gameId: number) => Promise<void>
  /** Open the comment editor for a ply, pre-populating with existing text if any */
  startEditing: (ply: number) => void
  /** Update the current input value */
  setEditValue: (value: string) => void
  /**
   * Save the current comment.
   * If text is empty after trimming, triggers requestDeletion instead.
   */
  saveComment: (collectionId: string, gameId: number) => Promise<void>
  /** Cancel editing without saving */
  cancelEditing: () => void
  /** Request confirmation to delete a comment at the given ply */
  requestDeletion: (ply: number) => void
  /** Confirm deletion of the pending comment */
  confirmDeletion: (collectionId: string, gameId: number) => Promise<void>
  /** Cancel pending deletion */
  cancelDeletion: () => void
  /** Look up the saved comment for a ply, or undefined if none */
  getCommentAtPly: (ply: number) => CommentData | undefined
  /** Upsert a variation comment into the local map */
  updateVariationComment: (comment: CommentData) => void
  /** Remove a variation comment from the local map */
  removeVariationComment: (variationId: number) => void
}

export function useCommentState(): UseCommentStateReturn {
  const [comments, setComments] = useState<CommentData[]>([])
  const [variationComments, setVariationComments] = useState<Map<number, CommentData>>(new Map())
  const [editingPly, setEditingPly] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingDeletion, setPendingDeletion] = useState<number | null>(null)

  const getCommentAtPly = useCallback((ply: number): CommentData | undefined => {
    return comments.find(c => c.ply === ply)
  }, [comments])

  const loadComments = useCallback(async (collectionId: string, gameId: number) => {
    const all = await window.electron.getComments(collectionId, gameId)
    setComments(all.filter(c => c.variationId === null))
    setVariationComments(new Map(
      all.filter(c => c.variationId !== null).map(c => [c.variationId as number, c])
    ))
    setEditingPly(null)
    setEditValue('')
    setPendingDeletion(null)
  }, [])

  const updateVariationComment = useCallback((comment: CommentData) => {
    if (comment.variationId === null) return // should not happen, but guard just in case
    setVariationComments(prev => {
      const next = new Map(prev)
      next.set(comment.variationId as number, comment)
      return next
    })
  }, [])

  const removeVariationComment = useCallback((variationId: number) => {
    setVariationComments(prev => {
      const next = new Map(prev)
      next.delete(variationId)
      return next
    })
  }, [])

  const startEditing = useCallback((ply: number) => {
    setEditingPly(ply)
    // Pre-populate with existing comment text so user can edit rather than retype
    const existing = comments.find(c => c.ply === ply)
    setEditValue(existing?.text ?? '')
  }, [comments])

  const saveComment = useCallback(async (collectionId: string, gameId: number) => {
    if (editingPly === null) return

    const trimmed = editValue.trim()

    if (trimmed.length === 0) {
      // Empty text — check if there's an existing comment to delete
      const existing = comments.find(c => c.ply === editingPly)
      if (existing) {
        setPendingDeletion(editingPly)
        // Keep editingPly set so we know where to return if cancelled
      } else {
        // Nothing to save, just cancel
        setEditingPly(null)
        setEditValue('')
      }
      return
    }

    try {
      const saved = await window.electron.upsertComment(collectionId, gameId, editingPly, trimmed)
      if (saved) {
        setComments(prev => {
          const idx = prev.findIndex(c => c.ply === editingPly)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = saved
            return updated
          }
          return [...prev, saved].sort((a, b) => a.ply - b.ply)
        })
      }
      setEditingPly(null)
      setEditValue('')
    } catch (error) {
      showErrorToast('Failed to save comment', error)
    }
  }, [editingPly, editValue, comments])

  const cancelEditing = useCallback(() => {
    setEditingPly(null)
    setEditValue('')
  }, [])

  const requestDeletion = useCallback((ply: number) => {
    setPendingDeletion(ply)
  }, [])

  const confirmDeletion = useCallback(async (collectionId: string, gameId: number) => {
    if (pendingDeletion === null) return

    try {
      await window.electron.deleteComment(collectionId, gameId, pendingDeletion)
      setComments(prev => prev.filter(c => c.ply !== pendingDeletion))
      setPendingDeletion(null)
      setEditingPly(null)
      setEditValue('')
    } catch (error) {
      showErrorToast('Failed to delete comment', error)
    }
  }, [pendingDeletion])

  const cancelDeletion = useCallback(() => {
    setPendingDeletion(null)
    // If deletion was triggered by clearing text, also cancel editing
    setEditingPly(null)
    setEditValue('')
  }, [])

  return {
    comments,
    variationComments,
    editingPly,
    editValue,
    pendingDeletion,
    loadComments,
    startEditing,
    setEditValue,
    saveComment,
    cancelEditing,
    requestDeletion,
    confirmDeletion,
    cancelDeletion,
    getCommentAtPly,
    updateVariationComment,
    removeVariationComment,
  }
}
