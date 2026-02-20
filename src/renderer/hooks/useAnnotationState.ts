/**
 * useAnnotationState - manages per-move NAG annotation persistence.
 *
 * Owns all mainline annotation state for the current game: the list of saved annotations
 * and a fast ply→annotation lookup map.
 */

import { useState, useCallback, useMemo } from 'react'
import type { AnnotationData } from '../../shared/types/game.js'

export interface UseAnnotationStateReturn {
  /** All annotations for the current game */
  annotations: AnnotationData[]
  /** Fast ply → annotation lookup */
  annotationsByPly: Map<number, AnnotationData>

  /** Fetch annotations for a game */
  loadAnnotations: (collectionId: string, gameId: number) => Promise<void>
  /** Set (insert or update) an annotation at a ply */
  setAnnotation: (collectionId: string, gameId: number, ply: number, nag: number) => Promise<void>
  /** Remove the annotation at a ply */
  clearAnnotation: (collectionId: string, gameId: number, ply: number) => Promise<void>
}

export function useAnnotationState(): UseAnnotationStateReturn {
  const [annotations, setAnnotations] = useState<AnnotationData[]>([])

  const annotationsByPly = useMemo(
    () => new Map(annotations.map(a => [a.ply, a])),
    [annotations]
  )

  const loadAnnotations = useCallback(async (collectionId: string, gameId: number) => {
    const all = await window.electron.getAnnotations(collectionId, gameId)
    setAnnotations(all)
  }, [])

  const setAnnotation = useCallback(async (
    collectionId: string,
    gameId: number,
    ply: number,
    nag: number
  ) => {
    try {
      const saved = await window.electron.upsertAnnotation(collectionId, gameId, ply, nag)
      if (saved) {
        setAnnotations(prev => {
          const idx = prev.findIndex(a => a.ply === ply)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = saved
            return updated
          }
          return [...prev, saved].sort((a, b) => a.ply - b.ply)
        })
      }
    } catch (error) {
      console.error('Failed to save annotation:', error)
    }
  }, [])

  const clearAnnotation = useCallback(async (
    collectionId: string,
    gameId: number,
    ply: number
  ) => {
    try {
      await window.electron.deleteAnnotation(collectionId, gameId, ply)
      setAnnotations(prev => prev.filter(a => a.ply !== ply))
    } catch (error) {
      console.error('Failed to delete annotation:', error)
    }
  }, [])

  return {
    annotations,
    annotationsByPly,
    loadAnnotations,
    setAnnotation,
    clearAnnotation,
  }
}
