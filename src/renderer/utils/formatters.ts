/**
 * Display formatting utilities for player names, ECO codes, and other UI strings.
 */

import { getOpeningByEco } from './openings.js'

/**
 * Format a player name with their Elo rating.
 *
 * @example
 * formatPlayerWithElo('Magnus Carlsen', 2882) // => "Magnus Carlsen (2882)"
 * formatPlayerWithElo('Magnus Carlsen', null)  // => "Magnus Carlsen"
 */
export function formatPlayerWithElo(name: string, elo?: number | null): string {
  return elo ? `${name} (${elo})` : name
}

/**
 * Format an ECO code with its opening name if known.
 * Performs a single lookup (avoids double-call in render).
 *
 * @example
 * formatEcoWithOpening('B20')  // => "B20 Sicilian Defense"  (if known)
 * formatEcoWithOpening('X99')  // => "X99"                   (if unknown)
 * formatEcoWithOpening(null)   // => ""
 */
export function formatEcoWithOpening(ecoCode?: string | null): string {
  if (!ecoCode) return ''
  const opening = getOpeningByEco(ecoCode)
  return opening ? `${ecoCode} ${opening.name}` : ecoCode
}
