import { describe, test, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { getDefaultSettings } from '../../src/main/config/settings.js'
import { loadSettingsFromPath, saveSettingsToPath } from '../../src/main/config/settingsStore.js'

describe('getDefaultSettings', () => {
  test('has cburnett as default piece set', () => {
    const settings = getDefaultSettings()
    expect(settings.pieceSet).toBe('cburnett')
  })

  test('has brown as default board theme', () => {
    const settings = getDefaultSettings()
    expect(settings.boardTheme).toBe('brown')
  })

  test('has dark as default app theme', () => {
    const settings = getDefaultSettings()
    expect(settings.appTheme).toBe('dark')
  })
})

describe('loadSettingsFromPath', () => {
  function makeTmpFile(): { tmpDir: string; settingsFile: string } {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ligeon-settings-test-'))
    return { tmpDir, settingsFile: path.join(tmpDir, 'settings.json') }
  }

  test('returns defaults when file does not exist', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const settings = loadSettingsFromPath(settingsFile)
      expect(settings.pieceSet).toBe('cburnett')
      expect(settings.boardTheme).toBe('brown')
      expect(fs.existsSync(settingsFile)).toBe(true)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('returns defaults when settings file is missing collections key', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const invalid = { boardTheme: 'brown', pieceSet: 'cburnett' }
      fs.writeFileSync(settingsFile, JSON.stringify(invalid, null, 2), 'utf-8')

      const settings = loadSettingsFromPath(settingsFile)
      expect(settings.collections.path).toBe(getDefaultSettings().collections.path)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('migrates legacy settings missing pieceSet', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const legacy = { ...getDefaultSettings() }
      // Simulate a settings.json written before pieceSet was added
      const { pieceSet: _removed, ...withoutPieceSet } = legacy
      fs.writeFileSync(settingsFile, JSON.stringify(withoutPieceSet, null, 2), 'utf-8')

      const settings = loadSettingsFromPath(settingsFile)
      expect(settings.pieceSet).toBe('cburnett')
      expect(settings.boardTheme).toBe(legacy.boardTheme)
      expect(settings.collections.path).toBe(legacy.collections.path)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('migrates legacy settings missing boardTheme', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const legacy = { ...getDefaultSettings() }
      const { boardTheme: _removed, ...withoutBoardTheme } = legacy
      fs.writeFileSync(settingsFile, JSON.stringify(withoutBoardTheme, null, 2), 'utf-8')

      const settings = loadSettingsFromPath(settingsFile)
      expect(settings.boardTheme).toBe('brown')
      expect(settings.pieceSet).toBe(legacy.pieceSet)
      expect(settings.collections.path).toBe(legacy.collections.path)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('round-trips full settings correctly', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const original = { ...getDefaultSettings(), pieceSet: 'merida' as const, boardTheme: 'green' as const }
      saveSettingsToPath(settingsFile, original)

      const loaded = loadSettingsFromPath(settingsFile)
      expect(loaded).toEqual(original)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('non-default pieceSet is preserved through migration', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const legacy = { ...getDefaultSettings(), pieceSet: 'merida' as const }
      const { boardTheme: _removed, ...withoutBoardTheme } = legacy
      fs.writeFileSync(settingsFile, JSON.stringify(withoutBoardTheme, null, 2), 'utf-8')

      const settings = loadSettingsFromPath(settingsFile)
      expect(settings.pieceSet).toBe('merida')
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('migrates legacy settings missing appTheme', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const legacy = { ...getDefaultSettings() }
      const { appTheme: _removed, ...withoutAppTheme } = legacy
      fs.writeFileSync(settingsFile, JSON.stringify(withoutAppTheme, null, 2), 'utf-8')

      const settings = loadSettingsFromPath(settingsFile)
      expect(settings.appTheme).toBe('dark')
      expect(settings.boardTheme).toBe(legacy.boardTheme)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('non-default appTheme is preserved through round-trip', () => {
    const { tmpDir, settingsFile } = makeTmpFile()
    try {
      const original = { ...getDefaultSettings(), appTheme: 'light' as const }
      saveSettingsToPath(settingsFile, original)
      const loaded = loadSettingsFromPath(settingsFile)
      expect(loaded.appTheme).toBe('light')
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
