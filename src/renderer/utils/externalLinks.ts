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

/**
 * Build a Lichess URL for analyzing a specific position
 *
 * @param fen - FEN string of the position to analyze
 * @returns Lichess analysis URL with encoded FEN
 *
 * @example
 * buildLichessAnalysisURL('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
 * // => 'https://lichess.org/analysis/rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR%20b%20KQkq%20-%200%201'
 */
export function buildLichessAnalysisURL(fen: string): string {
  const encoded = fen.replace(/ /g, '_')
  return `https://lichess.org/analysis/${encoded}`
}
