import type { VariationData } from '../../shared/types/game.js'

/**
 * Reorders the variations at `branchPly` by moving the variation with
 * `sourceId` to the position currently occupied by `targetId`.
 *
 * Returns the new ordered IDs for the affected ply group, or null if
 * the operation is invalid (same id, or either id not found at the ply).
 */
export function reorderVariationIds(
  sourceId: number,
  targetId: number,
  variations: VariationData[],
  branchPly: number,
): number[] | null {
  if (sourceId === targetId) return null
  const plyVariations = variations.filter(v => v.branchPly === branchPly)
  const sourceIdx = plyVariations.findIndex(v => v.id === sourceId)
  const targetIdx = plyVariations.findIndex(v => v.id === targetId)
  if (sourceIdx === -1 || targetIdx === -1) return null
  const reordered = [...plyVariations]
  reordered.splice(sourceIdx, 1)
  reordered.splice(targetIdx, 0, plyVariations[sourceIdx])
  const ids = reordered.map(v => v.id)
  if (ids.some(id => id === undefined)) return null
  return ids as number[]
}
