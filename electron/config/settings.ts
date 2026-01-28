/**
 * Application settings types and defaults
 */

import path from 'path'
import os from 'os'

/**
 * Application settings interface
 */
export interface AppSettings {
  /** Path to the collections directory */
  collectionsPath: string
  /** Whether the collections path has been customized by the user */
  collectionsPathCustomized: boolean
}

/**
 * Get the default collections path based on the platform
 *
 * @returns Default collections path for the current platform
 */
export function getDefaultCollectionsPath(): string {
  const platform = process.platform

  if (platform === 'win32') {
    // Windows: %APPDATA%\Ligeon\collections
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    return path.join(appData, 'Ligeon', 'collections')
  }

  // macOS/Linux: ~/.ligeon/collections
  return path.join(os.homedir(), '.ligeon', 'collections')
}

/**
 * Get default application settings
 *
 * @returns Default settings object
 */
export function getDefaultSettings(): AppSettings {
  return {
    collectionsPath: getDefaultCollectionsPath(),
    collectionsPathCustomized: false,
  }
}
