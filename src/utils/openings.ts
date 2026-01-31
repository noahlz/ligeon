/**
 * Chess openings search utility
 */
import openingsData from '../data/openings.json' with { type: 'json' }

export interface Opening {
  eco: string
  name: string
}

const openings: Opening[] = openingsData

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

/**
 * Get all openings (for reference/debugging)
 */
export function getAllOpenings(): Opening[] {
  return openings
}

/**
 * Get opening by exact ECO code
 */
export function getOpeningByEco(eco: string): Opening | undefined {
  return openings.find((o) => o.eco === eco)
}
