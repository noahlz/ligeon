/**
 * IPC handlers for application settings
 */

import { dialog } from 'electron'
import fs from 'fs'
import type { AppSettings } from '../config/settings.js'
import { loadSettings, saveSettings, setCollectionsPath } from '../config/settingsStore.js'
import { logError } from '../config/logger.js'

/**
 * Get current application settings
 *
 * @returns Current settings
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    return loadSettings()
  } catch (error) {
    logError('settingsHandlers', 'getSettings', {}, error)
    throw error
  }
}

/**
 * Update application settings
 *
 * @param updates - Partial settings to update
 * @returns Updated settings
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const currentSettings = loadSettings()

    // Merge updates
    const newSettings: AppSettings = {
      ...currentSettings,
      ...updates,
    }

    // Validate collections path if it was updated
    if (updates.collectionsPath && updates.collectionsPath !== currentSettings.collectionsPath) {
      // Check if path exists and is a directory
      if (!fs.existsSync(updates.collectionsPath)) {
        throw new Error(`Collections path does not exist: ${updates.collectionsPath}`)
      }
      const stats = fs.statSync(updates.collectionsPath)
      if (!stats.isDirectory()) {
        throw new Error(`Collections path is not a directory: ${updates.collectionsPath}`)
      }
    }

    saveSettings(newSettings)
    return newSettings
  } catch (error) {
    logError('settingsHandlers', 'updateSettings', { updates }, error)
    throw error
  }
}

/**
 * Open a directory picker for selecting collections directory
 *
 * @returns Selected directory path or null if cancelled
 */
export async function selectCollectionsDirectory(): Promise<string | null> {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Collections Directory',
      properties: ['openDirectory', 'createDirectory'],
      message: 'Choose a directory for storing chess game collections',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const selectedPath = result.filePaths[0]

    // Update settings with new path
    const updatedSettings = setCollectionsPath(selectedPath)
    console.log('✓ Collections path updated to:', selectedPath)

    return updatedSettings.collectionsPath
  } catch (error) {
    logError('settingsHandlers', 'selectCollectionsDirectory', {}, error)
    throw error
  }
}
