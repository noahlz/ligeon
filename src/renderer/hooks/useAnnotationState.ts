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
import { showErrorToast } from '../utils/errorToast.js'
import type { AnnotationData } from '../../shared/types/game.js'
import { getNagCategory } from '../utils/nag.js'
import { groupAnnotationsByPly } from '../utils/annotationUtils.js'

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

      // For exclusive categories ('move', 'position'), find any existing same-category
      // annotation at this ply. Delete it via IPC first, then upsert the new one.
      // Both IPC calls complete before touching state so the UI updates in one render
      // (no intermediate flash where the old symbol disappears before the new one appears).
      let replacedNag: number | undefined
      if (category === 'move' || category === 'position') {
        const currentAtPly = annotationsRef.current.filter(a => a.ply === ply)
        const sameCategory = currentAtPly.find(a => getNagCategory(a.nag) === category)
        if (sameCategory) {
          await window.electron.deleteAnnotation(collectionId, gameId, ply, sameCategory.nag)
          replacedNag = sameCategory.nag
        }
      }

      const saved = await window.electron.upsertAnnotation(collectionId, gameId, ply, nag)
      if (saved) {
        // Single state update: remove the replaced annotation (if any) and add the new one.
        setAnnotations(prev => {
          const without = replacedNag !== undefined
            ? prev.filter(a => !(a.ply === ply && a.nag === replacedNag))
            : prev
          // Idempotent: skip if (ply, nag) already present
          if (without.some(a => a.ply === ply && a.nag === nag)) return without
          return [...without, saved].sort((a, b) => a.ply - b.ply || a.nag - b.nag)
        })
      }
    } catch (error) {
      showErrorToast('Failed to save annotation', error)
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
      showErrorToast('Failed to remove annotation', error)
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
