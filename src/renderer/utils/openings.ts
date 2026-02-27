// TODO: Add unit tests for this module.
// Pure functions — no mocking needed (openings.json is a static asset):
//   searchAvailableOpenings → empty query returns all available; ECO prefix match;
//                             name substring match (case-insensitive); no match returns []
//   getOpeningByEco         → known ECO returns correct record; unknown returns undefined

/**
 * Chess openings search utility
 */
import openingsData from '../data/openings.json' with { type: 'json' }

export interface Opening {
  eco: string
  name: string
  moves: string
  count?: number
}

const openings: Opening[] = openingsData

/**
 * Build a lookup map from ECO code to Opening
 */
const ecoToOpeningsMap: Map<string, Opening> = new Map(
  openings.map((o) => [o.eco, o])
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
    return availableEcoCodes.map(({ eco, count }) => {
      const opening = ecoToOpeningsMap.get(eco)
      return {
         eco,
         name: opening?.name || 'Unknown Opening',
         moves: opening?.moves || '',
         count}
      })
  }

  return availableEcoCodes
    .filter(({ eco }) => {
      const opening = ecoToOpeningsMap.get(eco)

      // ECO code prefix match
      if (opening?.eco.toLowerCase().startsWith(normalizedQuery)) {
        return true
      }

      // Name substring match
      const name = opening?.name
      if (name && name.toLowerCase().includes(normalizedQuery)) {
        return true
      }

      return false
    })
    .map(({ eco, count }) => {
      const opening = ecoToOpeningsMap.get(eco)
      return {
        eco: eco,
        name: opening?.name || 'Unknown Opening',
        moves: opening?.moves || '',
        count: count,
      }
    })
}

/**
 * Get opening by exact ECO code
 */
export function getOpeningByEco(eco: string): Opening | undefined {
  return ecoToOpeningsMap.get(eco)
}
