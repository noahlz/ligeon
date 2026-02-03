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
    const baseName = path.parse(filePath).name;
    return titleCase(baseName);
  } else {
    return '';
  };
}
