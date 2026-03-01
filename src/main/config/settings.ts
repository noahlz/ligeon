/**
 * Application settings types and defaults
 */

import path from 'path'
import os from 'os'
import type { BoardTheme, PieceSet, AppTheme } from '../../shared/types/game.js'

export type { BoardTheme, PieceSet, AppTheme }

/**
 * Main process application settings interface
 */
export interface MainSettings {
  collections: CollectionSettings
  logging: LogSettings
  boardTheme: BoardTheme
  pieceSet: PieceSet
  appTheme: AppTheme
}

export interface CollectionSettings {
  path: string
  custom: boolean
}

export interface LogSettings {
  level: string
  maxSize: string
  retentionDays: number
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
export function getDefaultSettings(): MainSettings {
  return {
    collections: { path: getDefaultCollectionsPath(), custom: false },
    logging: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      maxSize: '10m',
      retentionDays: 90
    },
    boardTheme: 'brown',
    pieceSet: 'cburnett',
    appTheme: 'dark',
  }
}
