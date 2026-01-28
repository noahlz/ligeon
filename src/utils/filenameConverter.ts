/**
 * Derive a suggested collection name from a file path
 *
 * @param filePath - Full path to PGN file
 * @returns Suggested collection name (title-cased, normalized)
 *
 * @example
 * deriveSuggestedName('/path/to/kasparov-karpov.pgn')
 * // => 'Kasparov Karpov'
 */
export function deriveSuggestedName(filePath: string): string {
  const baseName = filePath.trim().split('/').pop() ?? ''
  const nameWithoutExt = baseName.trim().replace(/\.(pgn|PGN)$/, '')
  // Convert to title case and replace special characters with spaces
  return nameWithoutExt
    .replace(/[-._\s]+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}
