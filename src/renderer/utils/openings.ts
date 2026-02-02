/**
 * Chess openings search utility
 */
import openingsData from '../data/openings.json' with { type: 'json' }

export interface Opening {
  eco: string
  name: string
  count?: number
}

const openings: Opening[] = openingsData

/**
 * Build a lookup map from ECO code to opening name
 */
const ecoToNameMap: Map<string, string> = new Map(
  openings.map((o) => [o.eco, o.name])
)

/**
 * Search available ECO codes by query (ECO prefix or name substring)
 * Returns openings that match the query AND are in availableEcoCodes
 *
 * @param query - Search query (matches ECO prefix or name substring)
 * @param availableEcoCodes - ECO codes with counts that exist in the collection
 * @returns Array of matching openings
 */
export function searchAvailableOpenings(
  query: string,
  availableEcoCodes: Array<{ eco: string; count: number }>
): Opening[] {
  const normalizedQuery = query.trim().toLowerCase()

  // If no query, return all available openings with their names and counts
  if (normalizedQuery.length === 0) {
    return availableEcoCodes.map(({ eco, count }) => ({
      eco,
      name: ecoToNameMap.get(eco) || 'Unknown Opening',
      count,
    }))
  }

  return availableEcoCodes
    .filter(({ eco }) => {
      // ECO code prefix match
      if (eco.toLowerCase().startsWith(normalizedQuery)) {
        return true
      }
      // Name substring match
      const name = ecoToNameMap.get(eco)
      if (name && name.toLowerCase().includes(normalizedQuery)) {
        return true
      }
      return false
    })
    .map(({ eco, count }) => ({
      eco,
      name: ecoToNameMap.get(eco) || 'Unknown Opening',
      count,
    }))
}

/**
 * Search openings by ECO code (prefix match) or name (substring match)
 *
 * @param query - Search query
 * @param limit - Maximum results to return (default: 20)
 * @returns Array of matching openings
 */
export function searchOpenings(query: string, limit = 20): Opening[] {
  if (!query || query.trim().length === 0) {
    return []
  }

  const normalizedQuery = query.trim().toLowerCase()
  const results: Opening[] = []

  for (const opening of openings) {
    // ECO code prefix match (e.g., "B" matches all B codes, "B2" matches B20-B29)
    const ecoMatch = opening.eco.toLowerCase().startsWith(normalizedQuery)

    // Name substring match
    const nameMatch = opening.name.toLowerCase().includes(normalizedQuery)

    if (ecoMatch || nameMatch) {
      results.push(opening)

      if (results.length >= limit) {
        break
      }
    }
  }

  return results
}

export function getAllOpenings(): Opening[] {
  return openings
}

/**
 * Get opening by exact ECO code
 */
export function getOpeningByEco(eco: string): Opening | undefined {
  return openings.find((o) => o.eco === eco)
}
