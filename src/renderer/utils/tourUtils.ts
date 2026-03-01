export const TOUR_SEEN_KEY = 'ligeon-tour-seen'

/**
 * Returns true if the guided tour should be shown.
 * In dev mode, always returns true for easy testing.
 * In production, returns true only if the tour has not been seen yet.
 */
export function shouldShowTour(isDev: boolean): boolean {
  if (isDev) return true
  return localStorage.getItem(TOUR_SEEN_KEY) === null
}

/** Mark the tour as seen so it does not auto-trigger again. */
export function markTourSeen(): void {
  localStorage.setItem(TOUR_SEEN_KEY, 'true')
}
