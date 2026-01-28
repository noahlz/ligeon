import { app } from 'electron'
import path from 'path'

/**
 * Get the base path for all collections
 */
export function getCollectionsPath(): string {
  // TODO: Make this configurable
  return path.join(app.getPath('home'), '.ligeon', 'collections')
}
