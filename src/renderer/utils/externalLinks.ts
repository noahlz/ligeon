/**
 * Build a Lichess URL for analyzing a PGN
 *
 * @param pgn - PGN text to analyze on Lichess
 * @returns Lichess paste URL with encoded PGN
 *
 * @example
 * buildLichessURL('1. e4 e5')
 * // => 'https://lichess.org/paste?pgn=1.%20e4%20e5'
 */
export function buildLichessURL(pgn: string): string {
  const encoded = encodeURIComponent(pgn)
  return `https://lichess.org/paste?pgn=${encoded}`
}
