const WELCOME_KEY    = 'ligeon-tour-welcome-seen'
const COLLECTION_KEY = 'ligeon-tour-collection-seen'
const GAME_KEY       = 'ligeon-tour-game-seen'

export function shouldShowWelcome(): boolean {
  return localStorage.getItem(WELCOME_KEY) === null
}

export function markWelcomeSeen(): void {
  localStorage.setItem(WELCOME_KEY, 'true')
}

export function shouldShowCollectionTour(): boolean {
  return localStorage.getItem(COLLECTION_KEY) === null
}

export function markCollectionTourSeen(): void {
  localStorage.setItem(COLLECTION_KEY, 'true')
}

export function shouldShowGameTour(): boolean {
  return localStorage.getItem(GAME_KEY) === null
}

export function markGameTourSeen(): void {
  localStorage.setItem(GAME_KEY, 'true')
}
