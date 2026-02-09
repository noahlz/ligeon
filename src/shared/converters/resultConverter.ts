/**
 * Result of converting a PGN result string
 */
export interface ConvertedResult {
  /** Numeric value: 1.0 = white win, 0.5 = draw, 0.0 = black win, null = unknown */
  numeric: number | null
  /** Human-readable display string */
  display: string
  /** Whether this game should be skipped during import */
  skip: boolean
}

/**
 * Convert PGN result string to numeric and display formats
 *
 * @param pgnResult - PGN result string (e.g., "1-0", "1/2-1/2", "*")
 * @returns Converted result object
 */
export function convertResult(pgnResult: string): ConvertedResult {
  const trimmed = pgnResult.trim()

  switch (trimmed) {
    case '1-0':
      return { numeric: 1.0, display: 'White Wins', skip: false }
    case '0-1':
      return { numeric: 0.0, display: 'Black Wins', skip: false }
    case '1/2-1/2':
      return { numeric: 0.5, display: 'Draw', skip: false }
    case '*':
      return { numeric: null, display: 'Unfinished', skip: true }
    default:
      return { numeric: null, display: 'Unknown', skip: true }
  }
}

/**
 * Convert numeric result value to human-readable display string
 *
 * @param resultNumeric - Numeric result (1.0, 0.5, 0.0, or null)
 * @returns Display string
 */
export function resultNumericToDisplay(resultNumeric: number | null): string {
  switch (resultNumeric) {
    case 1.0:
      return 'White Wins'
    case 0.5:
      return 'Draw'
    case 0.0:
      return 'Black Wins'
    default:
      return 'Unknown'
  }
}

/**
 * Convert numeric result value to abbreviated display string
 *
 * @param resultNumeric - Numeric result (1.0, 0.5, 0.0, or null)
 * @returns Abbreviated string ('W', 'D', 'B', or 'Any')
 */
export function resultNumericToAbbreviation(resultNumeric: number | null): string {
  switch (resultNumeric) {
    case 1.0:
      return 'W'
    case 0.5:
      return 'D'
    case 0.0:
      return 'B'
    default:
      return 'Any'
  }
}

/**
 * Result filter options for UI
 */
/**
 * Convert numeric result value to PGN result string
 *
 * @param resultNumeric - Numeric result (1.0, 0.5, 0.0, or null)
 * @returns PGN result string ("1-0", "0-1", "1/2-1/2", or "*")
 */
export function resultNumericToPgn(resultNumeric: number | null): string {
  switch (resultNumeric) {
    case 1.0:
      return '1-0'
    case 0.5:
      return '1/2-1/2'
    case 0.0:
      return '0-1'
    default:
      return '*'
  }
}

/**
 * Result filter options for UI
 */
export const RESULT_FILTER_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1.0, label: 'White' },
  { value: 0.0, label: 'Black' },
  { value: 0.5, label: 'Draw' }
]
