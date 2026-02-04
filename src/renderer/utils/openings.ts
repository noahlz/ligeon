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
 * Get opening by exact ECO code
 */
export function getOpeningByEco(eco: string): Opening | undefined {
  return openings.find((o) => o.eco === eco)
}
