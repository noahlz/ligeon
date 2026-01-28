/**
 * Settings storage and retrieval
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import type { AppSettings } from './settings.js'
import { getDefaultSettings, getDefaultCollectionsPath } from './settings.js'

const SETTINGS_DIR = path.join(os.homedir(), '.ligeon')
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json')

/**
 * Load application settings from disk
 * Creates default settings if file doesn't exist
 *
 * @returns Application settings
 */
export function loadSettings(): AppSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      // Check if collections already exist at default location (migration path)
      const defaultPath = getDefaultCollectionsPath()
      const settings = getDefaultSettings()

      if (fs.existsSync(defaultPath)) {
        // Existing collections found - use that path
        console.log('✓ Detected existing collections at:', defaultPath)
        settings.collectionsPath = defaultPath
        settings.collectionsPathCustomized = false
      }

      // Save initial settings
      saveSettings(settings)
      return settings
    }

    const content = fs.readFileSync(SETTINGS_FILE, 'utf-8')
    const settings = JSON.parse(content) as AppSettings

    // Validate required fields
    if (!settings.collectionsPath) {
      console.warn('Invalid settings file - missing collectionsPath. Using defaults.')
      return getDefaultSettings()
    }

    return settings
  } catch (error) {
    console.error('Failed to load settings:', error)
    return getDefaultSettings()
  }
}

/**
 * Save application settings to disk
 *
 * @param settings - Settings to save
 */
export function saveSettings(settings: AppSettings): void {
  try {
    // Ensure settings directory exists
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true })
    }

    const content = JSON.stringify(settings, null, 2)
    fs.writeFileSync(SETTINGS_FILE, content, 'utf-8')
    console.log('✓ Settings saved')
  } catch (error) {
    console.error('Failed to save settings:', error)
    throw error
  }
}

/**
 * Get the current collections path
 * This is the main entry point for getting the collections path
 *
 * @returns Path to collections directory
 */
export function getCollectionsPath(): string {
  const settings = loadSettings()
  return settings.collectionsPath
}

/**
 * Update the collections path
 *
 * @param newPath - New collections path
 * @returns Updated settings
 */
export function setCollectionsPath(newPath: string): AppSettings {
  const settings = loadSettings()
  settings.collectionsPath = newPath
  settings.collectionsPathCustomized = true
  saveSettings(settings)
  return settings
}
