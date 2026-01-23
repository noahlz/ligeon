/**
 * Convert PGN date format (YYYY.MM.DD) to Unix timestamp
 * Handles partial dates like "1985.??.??" and unknown dates "?.?.?"
 *
 * @param pgnDate - PGN date string (e.g., "1985.01.15")
 * @returns Unix timestamp in seconds, or null if date is unknown
 */
export function pgnDateToTimestamp(pgnDate: string | null | undefined): number | null {
  if (!pgnDate || pgnDate === '?.?.?') return null

  try {
    const parts = pgnDate.split('.')
    const year = parseInt(parts[0])
    if (isNaN(year)) return null

    const month = parts[1] === '??' ? 0 : parseInt(parts[1]) - 1
    const day = parts[2] === '??' ? 1 : parseInt(parts[2])

    const date = new Date(year, month, day)
    return Math.floor(date.getTime() / 1000)
  } catch (error) {
    console.warn('Error parsing date:', pgnDate, error)
    return null
  }
}

/**
 * Convert Unix timestamp to human-readable display format
 *
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string or "Unknown"
 */
export function timestampToDisplay(timestamp: number | null | undefined): string {
  if (!timestamp) return 'Unknown'

  try {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    console.warn('Error formatting timestamp:', timestamp, error)
    return 'Unknown'
  }
}
