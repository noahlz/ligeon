import type { OptionFilters } from '../../shared/types/game.js'

/**
 * Build OptionFilters object for narrowing date/opening dropdowns.
 * Converts empty arrays to undefined and handles null dateFrom/dateTo.
 */
export function buildOptionFilters(params: {
  player?: string
  results?: number[]
  dateFrom?: number | null
  dateTo?: number | null
}): OptionFilters {
  return {
    player: params.player || undefined,
    results: params.results && params.results.length > 0 ? params.results : undefined,
    dateFrom: params.dateFrom ?? undefined,
    dateTo: params.dateTo ?? undefined,
  }
}

/**
 * Returns true if `date` is an acceptable dateFrom value given a current dateTo.
 * Null on either side means no constraint — any value is valid.
 */
export function isValidDateFrom(date: number | null, dateTo: number | null): boolean {
  return date === null || dateTo === null || date <= dateTo
}

/**
 * Returns true if `date` is an acceptable dateTo value given a current dateFrom.
 * Null on either side means no constraint — any value is valid.
 */
export function isValidDateTo(date: number | null, dateFrom: number | null): boolean {
  return date === null || dateFrom === null || dateFrom <= date
}

/**
 * Returns true if `selected` is a non-null value that is no longer present
 * in `available` — i.e., the selection is stale after a filter change.
 */
export function isDateStale(selected: number | null, available: number[]): boolean {
  return selected != null && !available.includes(selected)
}
