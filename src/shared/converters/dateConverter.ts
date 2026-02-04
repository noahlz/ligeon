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

    // Default to January if month is unknown (not numeric)
    const month = !/\d/.test(parts[1]) ? 1 : parseInt(parts[1])

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
 * @param locale - the locale i.e. 'en-US' (default), 'fr-FR', 'de-DE', etc.
 * @returns Formatted date string (e.g., "Mar 1985") or "Unknown"
 *
 * Examples:
 * - 198503 → "Mar 1985"
 * - null → "Unknown"
 */
export function yyyymmToDisplay(yyyymm: number | null | undefined, locale: string = 'en-US'): string {
  if (!yyyymm) return 'Unknown'

  const str = yyyymm.toString();
  const year = parseInt(str.substring(0, 4));
  const month = parseInt(str.substring(4, 6));

  // Parser alerady ensured months are 1-12.
  if (month < 1 || month > 12) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1));
}
