/**
 * NAG (Numeric Annotation Glyph) definitions for chess move annotations.
 * Based on: https://en.wikipedia.org/wiki/Algebraic_notation_(chess)#Annotation_symbols
 */

export interface NagDefinition {
  nag: number
  symbol: string
  description: string
}

/** Supported NAG definitions, ordered for picker display */
export const NAG_DEFINITIONS: NagDefinition[] = [
  { nag: 3,  symbol: '!!',  description: 'Brilliant move' },
  { nag: 1,  symbol: '!',   description: 'Good move' },
  { nag: 5,  symbol: '!?',  description: 'Interesting move' },
  { nag: 6,  symbol: '?!',  description: 'Dubious move' },
  { nag: 2,  symbol: '?',   description: 'Mistake' },
  { nag: 4,  symbol: '??',  description: 'Blunder' },
  { nag: 7,  symbol: '\u25a1', description: 'Forced move' },
  { nag: 13, symbol: '\u221e', description: 'Unclear position' },
  { nag: 10, symbol: '=',   description: 'Equal position' },
  { nag: 14, symbol: '\u2a72', description: 'Slight advantage: White' },
  { nag: 15, symbol: '\u2a71', description: 'Slight advantage: Black' },
  { nag: 16, symbol: '\u00b1', description: 'Clear advantage: White' },
  { nag: 17, symbol: '\u2213', description: 'Clear advantage: Black' },
  { nag: 18, symbol: '+-',  description: 'Decisive advantage: White' },
  { nag: 19, symbol: '-+',  description: 'Decisive advantage: Black' },
]

/** Fast lookup map: nag → symbol */
const NAG_SYMBOL_MAP = new Map<number, string>(
  NAG_DEFINITIONS.map(d => [d.nag, d.symbol])
)

/**
 * Get the display symbol for a NAG code.
 *
 * @param nag - NAG code
 * @returns Symbol string (e.g. "!", "?", "!!") or undefined if not found
 */
export function getNagSymbol(nag: number): string | undefined {
  return NAG_SYMBOL_MAP.get(nag)
}
