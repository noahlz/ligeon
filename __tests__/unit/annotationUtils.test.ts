import { describe, it, expect } from 'vitest'
import { groupAnnotationsByPly } from '../../src/renderer/utils/annotationUtils.js'
import type { AnnotationData } from '../../src/shared/types/game.js'

const makeAnnotation = (ply: number, nag: number): AnnotationData => ({
  id: ply * 100 + nag,
  gameId: 1,
  ply,
  nag,
})

describe('groupAnnotationsByPly', () => {
  it('returns an empty map for an empty array', () => {
    expect(groupAnnotationsByPly([])).toEqual(new Map())
  })

  it('groups a single annotation into a one-entry map', () => {
    const a = makeAnnotation(3, 1)
    const result = groupAnnotationsByPly([a])
    expect(result.size).toBe(1)
    expect(result.get(3)).toEqual([a])
  })

  it('groups multiple annotations at the same ply together', () => {
    const a1 = makeAnnotation(5, 1)
    const a2 = makeAnnotation(5, 6)
    const result = groupAnnotationsByPly([a1, a2])
    expect(result.size).toBe(1)
    expect(result.get(5)).toEqual([a1, a2])
  })

  it('separates annotations at different plies', () => {
    const a1 = makeAnnotation(2, 1)
    const a2 = makeAnnotation(4, 2)
    const result = groupAnnotationsByPly([a1, a2])
    expect(result.size).toBe(2)
    expect(result.get(2)).toEqual([a1])
    expect(result.get(4)).toEqual([a2])
  })

  it('does not modify the input array', () => {
    const annotations = [makeAnnotation(1, 1), makeAnnotation(1, 6)]
    const copy = [...annotations]
    groupAnnotationsByPly(annotations)
    expect(annotations).toEqual(copy)
  })
})
