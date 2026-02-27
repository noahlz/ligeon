// TODO: Add unit tests for this module.
// Pure functions — no mocking needed:
//   getNagSymbol(nag)      → correct symbol or undefined for unknown code
//   getNagDescription(nag) → correct description or undefined
//   getNagCategory(nag)    → correct category or undefined
//   sortNagsByCategory     → move < position < observation ordering
// Also verify the startup assertion: NAG_DEFINITIONS covers all VALID_NAG_CODES.

/**
 * NAG (Numeric Annotation Glyph) definitions for chess move annotations.
 * Based on: https://en.wikipedia.org/wiki/Algebraic_notation_(chess)#Annotation_symbols
 *
 * Valid NAG codes are defined in src/shared/nag.ts (single source of truth).
 * NAG_DEFINITIONS below must cover every code in that list — the dev-time
 * assertion at the bottom of this file catches any divergence.
 */
import { VALID_NAG_CODES } from '../../shared/nag.js'

/**
 * Annotation category — determines mutual-exclusivity behavior in the picker.
 * - 'move': move quality (exclusive per ply — only one allowed)
 * - 'position': position evaluation (exclusive per ply — only one allowed)
 * - 'observation': move observations (stackable — multiple allowed per ply)
 */
export type NagCategory = 'move' | 'position' | 'observation'

interface NagDefinition {
  nag: number
  symbol: string
  description: string
  category: NagCategory
}

/** Supported NAG definitions, ordered for picker display */
export const NAG_DEFINITIONS: NagDefinition[] = [
  { nag: 3,  symbol: '!!',     description: 'Brilliant move',  category: 'move' },
  { nag: 1,  symbol: '!',      description: 'Good move',       category: 'move' },
  { nag: 5,  symbol: '!?',     description: 'Interesting move',category: 'move' },
  { nag: 6,  symbol: '?!',     description: 'Dubious move',    category: 'move' },
  { nag: 2,  symbol: '?',      description: 'Mistake',         category: 'move' },
  { nag: 4,  symbol: '??',     description: 'Blunder',         category: 'move' },
  { nag: 7,  symbol: '\u25a1', description: 'Only move',       category: 'move' },
  { nag: 32, symbol: '\u2295', description: 'Time trouble',    category: 'observation' },
  { nag: 13, symbol: '\u221e', description: 'Unclear position',      category: 'position' },
  { nag: 10, symbol: '=',   description: 'Equal position',           category: 'position' },
  { nag: 14, symbol: '⩲', description: 'Slight advantage: White', category: 'position' },
  { nag: 15, symbol: '⩱', description: 'Slight advantage: Black', category: 'position' },
  { nag: 16, symbol: '\u00b1', description: 'Clear advantage: White',  category: 'position' },
  { nag: 17, symbol: '\u2213', description: 'Clear advantage: Black',  category: 'position' },
  { nag: 18, symbol: '+-',  description: 'Decisive advantage: White',  category: 'position' },
  { nag: 19, symbol: '-+',  description: 'Decisive advantage: Black',  category: 'position' },
]

/** Fast lookup map: nag → symbol */
const NAG_SYMBOL_MAP = new Map<number, string>(
  NAG_DEFINITIONS.map(d => [d.nag, d.symbol])
)

/** Fast lookup map: nag → description */
const NAG_DESCRIPTION_MAP = new Map<number, string>(
  NAG_DEFINITIONS.map(d => [d.nag, d.description])
)

/** Fast lookup map: nag → category */
const NAG_CATEGORY_MAP = new Map<number, NagCategory>(
  NAG_DEFINITIONS.map(d => [d.nag, d.category])
)

/**
 * Get the description for a NAG code.
 *
 * @param nag - NAG code
 * @returns Description string (e.g. "Good move", "Only move") or undefined if not found
 */
export function getNagDescription(nag: number): string | undefined {
  return NAG_DESCRIPTION_MAP.get(nag)
}

/**
 * Get the display symbol for a NAG code.
 *
 * @param nag - NAG code
 * @returns Symbol string (e.g. "!", "?", "!!") or undefined if not found
 */
export function getNagSymbol(nag: number): string | undefined {
  return NAG_SYMBOL_MAP.get(nag)
}

/**
 * Get the category for a NAG code.
 *
 * @param nag - NAG code
 * @returns Category ('move', 'position', 'observation') or undefined if not found
 */
export function getNagCategory(nag: number): NagCategory | undefined {
  return NAG_CATEGORY_MAP.get(nag)
}

/**
 * Sort order for badge display: move quality first, position second, observation third.
 */
const CATEGORY_ORDER: Record<NagCategory, number> = { move: 0, position: 1, observation: 2 }

/**
 * Sort an array of NAG codes by display category order (move → position → observation).
 */
export function sortNagsByCategory(nags: number[]): number[] {
  return [...nags].sort((a, b) => {
    const catA = CATEGORY_ORDER[NAG_CATEGORY_MAP.get(a) ?? 'observation']
    const catB = CATEGORY_ORDER[NAG_CATEGORY_MAP.get(b) ?? 'observation']
    return catA - catB
  })
}

// Startup assertion: every valid NAG code must have a definition here.
// If this fires, a code was added to src/shared/nag.ts without a matching
// entry in NAG_DEFINITIONS above.
{
  const defined = new Set(NAG_DEFINITIONS.map(d => d.nag))
  for (const code of VALID_NAG_CODES) {
    if (!defined.has(code)) {
      console.warn(`[nag.ts] NAG code ${code} in VALID_NAG_CODES has no entry in NAG_DEFINITIONS`)
    }
  }
}
