/**
 * Annotation utility functions for ply-based grouping and display.
 * Pure functions with no React dependencies — testable in isolation.
 */

import type { AnnotationData } from '../../shared/types/game.js'

/**
 * Group a flat annotation array into a ply → annotations[] map.
 * Multiple NAGs are allowed per ply (e.g. move quality + position evaluation).
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
