/**
 * Convert PGN date format (YYYY.MM.DD) to YYYYMMDD integer format
 * Handles partial dates like "1985.??.??" and unknown dates "?.?.?"
 *
 * @param pgnDate - PGN date string (e.g., "1985.03.15")
 * @returns YYYYMMDD integer (e.g., 19850315), or null if date is unknown
 *
 * Examples:
 * - "1985.03.15" → 19850315
 * - "1985.03.??" → 19850300 (unknown day = 00)
 * - "1985.??.??" → 19850100 (default to January, unknown day = 00)
 * - "?.?.?" → null
 */
export function pgnDateToYYYYMMDD(pgnDate: string | null | undefined): number | null {
  if (!pgnDate || pgnDate === '?.?.?') return null

  try {
    const parts = pgnDate.split('.')
    const year = parseInt(parts[0])
    if (isNaN(year)) return null

    // Default to January if month is unknown (not numeric)
    const month = !/\d/.test(parts[1]) ? 1 : parseInt(parts[1])

    if (isNaN(month) || month < 1 || month > 12) return null

    // Day: 00 if unknown, otherwise parsed value
    const day = (parts.length < 3 || !/\d/.test(parts[2])) ? 0 : parseInt(parts[2])

    return year * 10000 + month * 100 + (isNaN(day) ? 0 : day)
  } catch (error) {
    console.warn('Error parsing date:', pgnDate, error)
    return null
  }
}

/**
 * Convert YYYYMMDD integer to human-readable display format (month + year only)
 *
 * @param yyyymmdd - YYYYMMDD integer (e.g., 19850315)
 * @param locale - the locale i.e. 'en-US' (default), 'fr-FR', 'de-DE', etc.
 * @returns Formatted date string (e.g., "Mar 1985") or "Unknown"
 *
 * Examples:
 * - 19850315 → "Mar 1985"
 * - 19850300 → "Mar 1985"
 * - null → "Unknown"
 */
export function yyyymmddToDisplay(yyyymmdd: number | null | undefined, locale: string = 'en-US'): string {
  if (!yyyymmdd) return 'Unknown'

  const str = yyyymmdd.toString();
  const year = parseInt(str.substring(0, 4));
  const month = parseInt(str.substring(4, 6));

  // Parser already ensured months are 1-12.
  if (month < 1 || month > 12) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1));
}

/**
 * Convert YYYYMMDD integer to PGN date format
 *
 * @param yyyymmdd - YYYYMMDD integer (e.g., 19850315)
 * @returns PGN date string (e.g., "1985.03.15")
 *
 * Examples:
 * - 19850315 → "1985.03.15"
 * - 19850300 → "1985.03.??" (day=00 means unknown)
 * - 19850100 → "1985.01.??"
 * - null → "????.??.??"
 */
export function yyyymmddToPgnDate(yyyymmdd: number | null | undefined): string {
  if (!yyyymmdd) return '????.??.??'

  const str = yyyymmdd.toString().padStart(8, '0')
  const year = str.substring(0, 4)
  const month = str.substring(4, 6)
  const day = str.substring(6, 8)

  return `${year}.${month}.${day === '00' ? '??' : day}`
}
