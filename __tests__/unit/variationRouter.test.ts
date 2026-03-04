import { describe, it, expect } from 'vitest'
import { resolveVariationMove, resolveMainlineMove } from '../../src/renderer/utils/variationRouter.js'
import type { VariationData } from '../../src/shared/types/game.js'

function makeVariation(id: number, branchPly: number, moves: string): VariationData {
  return { id, gameId: 1, branchPly, moves }
}

describe('resolveVariationMove', () => {
  it('returns advance with nextPly when nextSan matches san', () => {
    const result = resolveVariationMove({ san: 'Nf3', nextSan: 'Nf3', currentVariationPly: 2 })
    expect(result).toEqual({ type: 'advance', nextPly: 3 })
  })

  it('returns truncate_and_append with correct san when nextSan does not match', () => {
    const result = resolveVariationMove({ san: 'd4', nextSan: 'e4', currentVariationPly: 2 })
    expect(result).toEqual({ type: 'truncate_and_append', san: 'd4' })
  })

  it('returns truncate_and_append when nextSan is undefined (no next move in variation)', () => {
    const result = resolveVariationMove({ san: 'Nc6', nextSan: undefined, currentVariationPly: 3 })
    expect(result).toEqual({ type: 'truncate_and_append', san: 'Nc6' })
  })

})

describe('resolveMainlineMove', () => {
  it('returns advance_mainline when san matches mainlineSan; nextPly = currentPly + 1', () => {
    const result = resolveMainlineMove({
      san: 'Nf3',
      currentPly: 4,
      mainlineSan: 'Nf3',
      variations: [],
    })
    expect(result).toEqual({ type: 'advance_mainline', nextPly: 5 })
  })

  it('returns advance_mainline when currentPly=0, san=e4, mainlineSan=e4', () => {
    const result = resolveMainlineMove({
      san: 'e4',
      currentPly: 0,
      mainlineSan: 'e4',
      variations: [],
    })
    expect(result).toEqual({ type: 'advance_mainline', nextPly: 1 })
  })

  it('returns enter_variation when san matches first move of a variation at branchPly', () => {
    // currentPly=2 → branchPly=3; variation branches at ply 3 with first move 'Nf3'
    const variations = [makeVariation(10, 3, 'Nf3 d5 Bg5')]
    const result = resolveMainlineMove({
      san: 'Nf3',
      currentPly: 2,
      mainlineSan: 'Bc4',
      variations,
    })
    expect(result).toEqual({ type: 'enter_variation', id: 10, branchPly: 3 })
  })

  it('returns create_variation when no mainline match and no variation match', () => {
    const result = resolveMainlineMove({
      san: 'g3',
      currentPly: 0,
      mainlineSan: 'e4',
      variations: [],
    })
    expect(result).toEqual({ type: 'create_variation', branchPly: 1, san: 'g3' })
  })

  it('returns create_variation when there are variations at OTHER branch plies but not this one', () => {
    // currentPly=0 → branchPly=1; variations only exist at ply 5
    const variations = [makeVariation(1, 5, 'd4 d5')]
    const result = resolveMainlineMove({
      san: 'c4',
      currentPly: 0,
      mainlineSan: 'e4',
      variations,
    })
    expect(result).toEqual({ type: 'create_variation', branchPly: 1, san: 'c4' })
  })

  it('returns enter_variation even when multiple variations exist at the same branchPly (picks the matching one)', () => {
    // currentPly=2 → branchPly=3; two variations at ply 3, pick the one whose first move is 'e4'
    const variations = [
      makeVariation(7, 3, 'Nf3 d5 Bg5'),
      makeVariation(8, 3, 'e4 e5'),
    ]
    const result = resolveMainlineMove({
      san: 'e4',
      currentPly: 2,
      mainlineSan: 'Bc4',
      variations,
    })
    expect(result).toEqual({ type: 'enter_variation', id: 8, branchPly: 3 })
  })
})
