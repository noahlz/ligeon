/**
 * Display formatting utilities for player names, ECO codes, game results, and other UI strings.
 */

import { getOpeningByEco } from './openings.js'

/**
 * Capitalize the first character of a string.
 *
 * @example
 * capitalizeFirst('brown') // => "Brown"
 * capitalizeFirst('')      // => ""
 */
export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

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

/**
 * Get display text for a game result token.
 *
 * @example
 * getResultDisplay('1-0')     // => "1-0 (White Wins)"
 * getResultDisplay('1/2-1/2') // => "1/2-1/2 (Draw)"
 */
export function getResultDisplay(result: string): string {
  switch (result) {
    case '1-0':
      return '1-0 (White Wins)'
    case '0-1':
      return '0-1 (Black Wins)'
    case '1/2-1/2':
      return '1/2-1/2 (Draw)'
    case '*':
      return '* (Unfinished)'
    default:
      return result
  }
}
