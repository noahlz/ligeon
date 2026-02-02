/**
 * Convert PGN date format (YYYY.MM.DD) to YYYYMM integer format
 * Handles partial dates like "1985.??.??" and unknown dates "?.?.?"
 *
 * @param pgnDate - PGN date string (e.g., "1985.03.15")
 * @returns YYYYMM integer (e.g., 198503), or null if date is unknown
 *
 * Examples:
 * - "1985.03.15" → 198503
 * - "1985.??.??" → 198501 (default to January)
 * - "?.?.?" → null
 */
export function pgnDateToYYYYMM(pgnDate: string | null | undefined): number | null {
  if (!pgnDate || pgnDate === '?.?.?') return null

  try {
    const parts = pgnDate.split('.')
    const year = parseInt(parts[0])
    if (isNaN(year)) return null

    // Default to January if month is unknown
    const month = parts[1] === '??' ? 1 : parseInt(parts[1])
    if (isNaN(month) || month < 1 || month > 12) return null

    return year * 100 + month
  } catch (error) {
    console.warn('Error parsing date:', pgnDate, error)
    return null
  }
}

/**
 * Convert YYYYMM integer to human-readable display format
 *
 * @param yyyymm - YYYYMM integer (e.g., 198503)
 * @returns Formatted date string (e.g., "Mar 1985") or "Unknown"
 *
 * Examples:
 * - 198503 → "Mar 1985"
 * - null → "Unknown"
 */
export function yyyymmToDisplay(yyyymm: number | null | undefined): string {
  if (!yyyymm) return 'Unknown'

  try {
    const year = Math.floor(yyyymm / 100)
    const month = yyyymm % 100

    if (month < 1 || month > 12) return 'Unknown'

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[month - 1]} ${year}`
  } catch (error) {
    console.warn('Error formatting YYYYMM:', yyyymm, error)
    return 'Unknown'
  }
}
