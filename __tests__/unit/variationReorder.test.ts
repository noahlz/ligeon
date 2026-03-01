import { describe, it, expect } from 'vitest'
import { reorderVariationIds } from '../../src/renderer/utils/variationReorder.js'
import type { VariationData } from '../../src/shared/types/game.js'

function makeVariation(id: number, branchPly: number): VariationData {
  return { id, gameId: 1, branchPly, moves: 'e4 e5' }
}

describe('reorderVariationIds', () => {
  const branchPly = 3
  const v1 = makeVariation(1, branchPly)
  const v2 = makeVariation(2, branchPly)
  const v3 = makeVariation(3, branchPly)
  const variations = [v1, v2, v3]

  it('returns null when sourceId equals targetId', () => {
    expect(reorderVariationIds(1, 1, variations, branchPly)).toBeNull()
  })

  it('returns null when sourceId is not found at the branch ply', () => {
    expect(reorderVariationIds(99, 2, variations, branchPly)).toBeNull()
  })

  it('returns null when targetId is not found at the branch ply', () => {
    expect(reorderVariationIds(1, 99, variations, branchPly)).toBeNull()
  })

  it('moves source to target position (first → last)', () => {
    expect(reorderVariationIds(1, 3, variations, branchPly)).toEqual([2, 3, 1])
  })

  it('moves source to target position (last → first)', () => {
    expect(reorderVariationIds(3, 1, variations, branchPly)).toEqual([3, 1, 2])
  })

  it('swaps adjacent items', () => {
    expect(reorderVariationIds(1, 2, variations, branchPly)).toEqual([2, 1, 3])
  })

  it('ignores variations at a different branchPly', () => {
    const otherPly = makeVariation(10, 5)
    const mixed = [...variations, otherPly]
    // reorder within branchPly=3 only — id 10 at ply 5 is irrelevant
    expect(reorderVariationIds(1, 3, mixed, branchPly)).toEqual([2, 3, 1])
  })
})
