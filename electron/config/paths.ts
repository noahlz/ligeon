import { getCollectionsPath as getCollectionsPathFromSettings } from './settingsStore.js'

/**
 * Get the base path for all collections
 * Delegates to settings store for configured path
 */
export function getCollectionsPath(): string {
  return getCollectionsPathFromSettings()
}
