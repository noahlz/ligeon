/**
 * useAnnotationState - manages per-move NAG annotation persistence.
 *
 * Owns all mainline annotation state for the current game: the list of saved annotations
 * and a fast ply→annotations lookup map (array per ply, since multiple NAGs are allowed).
 *
 * Category exclusivity (only one 'move' annotation and one 'position' annotation per ply)
 * is enforced here: setAnnotation removes any existing same-category annotation before
 * inserting the new one. Invalid combinations (e.g. both !! and ??) are undefined behavior
 * that can only arise from corrupted data and are not handled.
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import type { AnnotationData } from '../../shared/types/game.js'
import { getNagCategory } from '../utils/nag.js'

/**
 * Group a flat annotation array into a ply → annotations[] map.
 * Shared between this hook and MoveList.
 */
export function groupAnnotationsByPly(annotations: AnnotationData[]): Map<number, AnnotationData[]> {
  const map = new Map<number, AnnotationData[]>()
  for (const a of annotations) {
    const existing = map.get(a.ply)
    if (existing) {
      existing.push(a)
    } else {
      map.set(a.ply, [a])
    }
  }
  return map
}

export interface UseAnnotationStateReturn {
  /** All annotations for the current game */
  annotations: AnnotationData[]
  /** Fast ply → annotations lookup (array — multiple NAGs per ply allowed) */
  annotationsByPly: Map<number, AnnotationData[]>

  /** Fetch annotations for a game */
  loadAnnotations: (collectionId: string, gameId: number) => Promise<void>
  /** Add an annotation at a ply; replaces any existing same-category annotation */
  setAnnotation: (collectionId: string, gameId: number, ply: number, nag: number) => Promise<void>
  /** Remove a specific annotation at a ply by NAG code */
  removeAnnotation: (collectionId: string, gameId: number, ply: number, nag: number) => Promise<void>
}

export function useAnnotationState(): UseAnnotationStateReturn {
  const [annotations, setAnnotations] = useState<AnnotationData[]>([])
  const annotationsRef = useRef(annotations)
  annotationsRef.current = annotations

  const annotationsByPly = useMemo(
    () => groupAnnotationsByPly(annotations),
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
      const category = getNagCategory(nag)

      // For exclusive categories ('move', 'position'), remove any existing
      // same-category annotation at this ply before inserting the new one.
      // Read from ref to avoid stale closure over annotations state.
      if (category === 'move' || category === 'position') {
        const currentAtPly = annotationsRef.current.filter(a => a.ply === ply)
        const sameCategory = currentAtPly.find(a => getNagCategory(a.nag) === category)
        if (sameCategory) {
          await window.electron.deleteAnnotation(collectionId, gameId, ply, sameCategory.nag)
          setAnnotations(prev => prev.filter(a => !(a.ply === ply && a.nag === sameCategory.nag)))
        }
      }

      const saved = await window.electron.upsertAnnotation(collectionId, gameId, ply, nag)
      if (saved) {
        setAnnotations(prev => {
          // Idempotent: skip if (ply, nag) already present
          if (prev.some(a => a.ply === ply && a.nag === nag)) return prev
          return [...prev, saved].sort((a, b) => a.ply - b.ply || a.nag - b.nag)
        })
      }
    } catch (error) {
      console.error('Failed to save annotation:', error)
    }
  }, [])

  const removeAnnotation = useCallback(async (
    collectionId: string,
    gameId: number,
    ply: number,
    nag: number
  ) => {
    try {
      await window.electron.deleteAnnotation(collectionId, gameId, ply, nag)
      setAnnotations(prev => prev.filter(a => !(a.ply === ply && a.nag === nag)))
    } catch (error) {
      console.error('Failed to delete annotation:', error)
    }
  }, [])

  return {
    annotations,
    annotationsByPly,
    loadAnnotations,
    setAnnotation,
    removeAnnotation,
  }
}
