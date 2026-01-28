import { app } from 'electron'
import path from 'path'

/**
 * Get the base path for all collections
 * Returns ~/.ligeon/collections
 */
export function getCollectionsPath(): string {
  return path.join(app.getPath('home'), '.ligeon', 'collections')
}
