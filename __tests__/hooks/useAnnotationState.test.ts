import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useAnnotationState } from '@/hooks/useAnnotationState'
import { mockElectron, installElectronMock } from '../helpers/electronMock'
import type { AnnotationData } from '../../src/shared/types/game'

beforeEach(() => {
  installElectronMock()
  vi.clearAllMocks()
})

// NAG categories used across tests:
//   nag=1  ('!')  → 'move'
//   nag=2  ('?')  → 'move'
//   nag=10 ('=')  → 'position'
//   nag=32        → 'observation'

function makeAnnotation(overrides: Partial<AnnotationData> & Pick<AnnotationData, 'ply' | 'nag'>): AnnotationData {
  return { id: 1, gameId: 42, ...overrides }
}

describe('useAnnotationState', () => {
  describe('loadAnnotations', () => {
    it('calls getAnnotations with correct args and sets annotations state', async () => {
      const fetched: AnnotationData[] = [
        makeAnnotation({ ply: 2, nag: 1 }),
        makeAnnotation({ id: 2, ply: 4, nag: 10 }),
      ]
      mockElectron.getAnnotations.mockResolvedValue(fetched)

      const { result } = renderHook(() => useAnnotationState())

      await act(async () => {
        await result.current.loadAnnotations('col-1', 42)
      })

      expect(mockElectron.getAnnotations).toHaveBeenCalledWith('col-1', 42)
      expect(result.current.annotations).toEqual(fetched)
    })

    it('populates annotationsByPly Map grouped by ply', async () => {
      const a1 = makeAnnotation({ ply: 2, nag: 1 })
      const a2 = makeAnnotation({ id: 2, ply: 2, nag: 32 })
      const a3 = makeAnnotation({ id: 3, ply: 4, nag: 10 })
      mockElectron.getAnnotations.mockResolvedValue([a1, a2, a3])

      const { result } = renderHook(() => useAnnotationState())
      await act(async () => {
        await result.current.loadAnnotations('col-1', 42)
      })

      expect(result.current.annotationsByPly.get(2)).toEqual([a1, a2])
      expect(result.current.annotationsByPly.get(4)).toEqual([a3])
      expect(result.current.annotationsByPly.get(99)).toBeUndefined()
    })
  })

  describe('setAnnotation — IPC failure', () => {
    it('does not update state when upsertAnnotation rejects', async () => {
      mockElectron.getAnnotations.mockResolvedValue([])
      mockElectron.upsertAnnotation.mockRejectedValue(new Error('DB error'))

      const { result } = renderHook(() => useAnnotationState())
      await act(async () => {
        await result.current.setAnnotation('col-1', 42, 3, 1)
      })

      expect(result.current.annotations).toHaveLength(0)
    })
  })

  describe('setAnnotation — no conflict', () => {
    it('calls only upsertAnnotation (not deleteAnnotation) and adds the returned annotation to state', async () => {
      mockElectron.getAnnotations.mockResolvedValue([])
      const saved = makeAnnotation({ ply: 3, nag: 32 })
      mockElectron.upsertAnnotation.mockResolvedValue(saved)

      const { result } = renderHook(() => useAnnotationState())

      await act(async () => {
        await result.current.setAnnotation('col-1', 42, 3, 32)
      })

      expect(mockElectron.deleteAnnotation).not.toHaveBeenCalled()
      expect(mockElectron.upsertAnnotation).toHaveBeenCalledWith('col-1', 42, 3, 32)
      expect(result.current.annotations).toEqual([saved])
    })
  })

  describe('setAnnotation — same-category replacement', () => {
    it('deletes the existing move annotation before upserting the new one; state has new nag only', async () => {
      const existing = makeAnnotation({ ply: 2, nag: 1 }) // nag=1 → 'move'
      mockElectron.getAnnotations.mockResolvedValue([existing])

      const { result } = renderHook(() => useAnnotationState())

      // Seed state with the existing annotation
      await act(async () => {
        await result.current.loadAnnotations('col-1', 42)
      })

      const saved = makeAnnotation({ id: 2, ply: 2, nag: 2 }) // nag=2 → also 'move'
      mockElectron.upsertAnnotation.mockResolvedValue(saved)

      await act(async () => {
        await result.current.setAnnotation('col-1', 42, 2, 2)
      })

      // Must delete nag=1 first (same 'move' category), then upsert nag=2
      expect(mockElectron.deleteAnnotation).toHaveBeenCalledWith('col-1', 42, 2, 1)
      expect(mockElectron.upsertAnnotation).toHaveBeenCalledWith('col-1', 42, 2, 2)

      const plies = result.current.annotations.map(a => a.nag)
      expect(plies).toContain(2)
      expect(plies).not.toContain(1)
    })
  })

  describe('setAnnotation — observation (non-exclusive)', () => {
    it('does NOT delete any existing annotation and just upserts the observation nag', async () => {
      const existing = makeAnnotation({ ply: 5, nag: 1 }) // 'move' at same ply
      mockElectron.getAnnotations.mockResolvedValue([existing])

      const { result } = renderHook(() => useAnnotationState())

      await act(async () => {
        await result.current.loadAnnotations('col-1', 42)
      })

      const saved = makeAnnotation({ id: 2, ply: 5, nag: 32 }) // nag=32 → 'observation'
      mockElectron.upsertAnnotation.mockResolvedValue(saved)

      await act(async () => {
        await result.current.setAnnotation('col-1', 42, 5, 32)
      })

      expect(mockElectron.deleteAnnotation).not.toHaveBeenCalled()
      expect(mockElectron.upsertAnnotation).toHaveBeenCalledWith('col-1', 42, 5, 32)
      // Both the original 'move' annotation and the new 'observation' should be present
      const nags = result.current.annotations.map(a => a.nag)
      expect(nags).toContain(1)
      expect(nags).toContain(32)
    })
  })

  describe('setAnnotation — idempotent', () => {
    it('does not duplicate an annotation already in state when upsertAnnotation returns the same record', async () => {
      const existing = makeAnnotation({ ply: 2, nag: 1 })
      mockElectron.getAnnotations.mockResolvedValue([existing])

      const { result } = renderHook(() => useAnnotationState())

      await act(async () => {
        await result.current.loadAnnotations('col-1', 42)
      })

      // upsertAnnotation returns the same record that's already in state
      mockElectron.upsertAnnotation.mockResolvedValue(existing)

      await act(async () => {
        await result.current.setAnnotation('col-1', 42, 2, 1)
      })

      expect(result.current.annotations).toHaveLength(1)
      expect(result.current.annotations[0]).toEqual(existing)
    })
  })

  describe('removeAnnotation', () => {
    it('calls deleteAnnotation and removes the annotation from state', async () => {
      const ann = makeAnnotation({ ply: 3, nag: 10 })
      mockElectron.getAnnotations.mockResolvedValue([ann])
      mockElectron.deleteAnnotation.mockResolvedValue(undefined)

      const { result } = renderHook(() => useAnnotationState())

      await act(async () => {
        await result.current.loadAnnotations('col-1', 42)
      })

      await act(async () => {
        await result.current.removeAnnotation('col-1', 42, 3, 10)
      })

      expect(mockElectron.deleteAnnotation).toHaveBeenCalledWith('col-1', 42, 3, 10)
      expect(result.current.annotations).toHaveLength(0)
    })
  })
})
