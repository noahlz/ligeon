/**
 * Settings storage and retrieval
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import type { MainSettings } from './settings.js'
import { getDefaultSettings, getDefaultCollectionsPath } from './settings.js'

const SETTINGS_DIR = path.join(os.homedir(), '.ligeon')
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json')

/**
 * Save settings to an arbitrary file path.
 * Creates parent directory if needed.
 */
export function saveSettingsToPath(settingsFile: string, settings: MainSettings): void {
  try {
    const dir = path.dirname(settingsFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const content = JSON.stringify(settings, null, 2)
    fs.writeFileSync(settingsFile, content, 'utf-8')
    console.log('✓ Settings saved')
  } catch (error) {
    console.error('Failed to save settings:', error)
    throw error
  }
}

/**
 * Load settings from an arbitrary file path.
 * Creates default settings if file doesn't exist.
 * Applies migration guards for fields added after initial release.
 */
export function loadSettingsFromPath(settingsFile: string): MainSettings {
  try {
    if (!fs.existsSync(settingsFile)) {
      // Check if collections already exist at default location (migration path)
      const defaultPath = getDefaultCollectionsPath()
      const settings = getDefaultSettings()

      if (fs.existsSync(defaultPath)) {
        // Existing collections found - use that path
        console.log('✓ Detected existing collections at:', defaultPath)
        settings.collections.path = defaultPath
        settings.collections.custom = false
      }

      // Save initial settings
      saveSettingsToPath(settingsFile, settings)
      return settings
    }

    const content = fs.readFileSync(settingsFile, 'utf-8')
    const settings = JSON.parse(content) as MainSettings

    // Validate required fields
    if (!settings.collections?.path) {
      console.warn('Invalid settings file - missing collectionsPath. Using defaults.')
      return getDefaultSettings()
    }

    // Migrate: fill in defaults for fields added after initial release
    if (!settings.boardTheme) settings.boardTheme = 'brown'
    if (!settings.pieceSet) settings.pieceSet = 'cburnett'

    return settings
  } catch (error) {
    console.error('Failed to load settings:', error)
    return getDefaultSettings()
  }
}

/**
 * Load application settings from disk
 * Creates default settings if file doesn't exist
 *
 * @returns Application settings
 */
export function loadSettings(): MainSettings {
  return loadSettingsFromPath(SETTINGS_FILE)
}

/**
 * Save application settings to disk
 *
 * @param settings - Settings to save
 */
export function saveSettings(settings: MainSettings): void {
  saveSettingsToPath(SETTINGS_FILE, settings)
}

/**
 * Get the current collections path
 * This is the main entry point for getting the collections path
 *
 * @returns Path to collections directory
 */
export function getCollectionsPath(): string {
  const settings = loadSettings()
  return settings.collections.path
}

/**
 * Update the collections path
 *
 * @param newPath - New collections path
 * @returns Updated settings
 */
export function setCollectionsPath(newPath: string): MainSettings {
  const settings = loadSettings()
  settings.collections.path = newPath
  settings.collections.custom = true
  saveSettings(settings)
  return settings
}
