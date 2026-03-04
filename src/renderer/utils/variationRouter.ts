import type { VariationData } from '../../shared/types/game.js'
import { findMatchingVariation } from './variationFormatter.js'

/**
 * Decision for a move made while inside a variation (at ply > 0).
 * The san has already been validated by calling tryMove on the variation manager.
 */
export type VariationMoveAction =
  | { type: 'advance'; nextPly: number }           // move matches next san → just advance
  | { type: 'truncate_and_append'; san: string }   // different move → truncate and append

/**
 * Decision for a move made on the mainline (not inside a variation).
 * The san has already been validated by calling tryMove on the chess manager.
 */
export type MainlineMoveAction =
  | { type: 'advance_mainline'; nextPly: number }
  | { type: 'enter_variation'; id: number; branchPly: number }
  | { type: 'create_variation'; branchPly: number; san: string }

/**
 * Pure routing for a move made while inside a variation at currentVariationPly > 0.
 * Returns the action to apply; does not mutate any state.
 */
export function resolveVariationMove(params: {
  san: string
  nextSan: string | undefined
  currentVariationPly: number
}): VariationMoveAction {
  const { san, nextSan, currentVariationPly } = params
  if (nextSan === san) {
    return { type: 'advance', nextPly: currentVariationPly + 1 }
  }
  return { type: 'truncate_and_append', san }
}

/**
 * Pure routing for a move made on the mainline.
 * Returns the action to apply; does not mutate any state.
 */
export function resolveMainlineMove(params: {
  san: string
  currentPly: number
  mainlineSan: string | undefined
  variations: VariationData[]
}): MainlineMoveAction {
  const { san, currentPly, mainlineSan, variations } = params
  const branchPly = currentPly + 1

  if (mainlineSan === san) {
    return { type: 'advance_mainline', nextPly: branchPly }
  }

  const match = findMatchingVariation(variations, branchPly, san)
  if (match) {
    return { type: 'enter_variation', id: match.id!, branchPly }
  }

  return { type: 'create_variation', branchPly, san }
}
