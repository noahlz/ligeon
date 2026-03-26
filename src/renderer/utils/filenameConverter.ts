import path from 'path-browserify';
import { titleCase } from 'text-title-case';

/**
 * Derive a suggested collection name from a file path
 *
 * @param filePath - Full path to PGN file
 * @returns Suggested collection name (title-cased, normalized)
 *
 * @example
 * deriveSuggestedName('/path/to/tal-life-and-games.pgn')
 * // => 'Tal Life and Games'
 */
export function deriveSuggestedName(filePath: string): string {
  if (filePath) {
    // Normalize Windows backslashes to POSIX separators before parsing,
    // since path-browserify is POSIX-only and won't split on backslashes.
    const normalizedPath = filePath.replace(/\\/g, '/');
    const baseName = path.parse(normalizedPath).name;
    return titleCase(baseName);
  } else {
    return '';
  };
}
