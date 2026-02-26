import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  listCollections,
  renameCollection,
  deleteCollection,
} from './ipc/collectionHandlers.js'
import { searchGames, getGameMoves, getGameCount, getAvailableDates, getAvailableEcoCodes } from './ipc/gameHandlers.js'
import { getVariations, createVariation, updateVariation, deleteVariation, reorderVariations } from './ipc/variationHandlers.js'
import { getComments, upsertComment, deleteComment, upsertVariationComment, deleteVariationComment } from './ipc/commentHandlers.js'
import { getAnnotations, upsertAnnotation, deleteAnnotation } from './ipc/annotationHandlers.js'
import { importAndIndexPgn } from './ipc/importHandlers.js'
import { getCollectionsPath } from './config/paths.js'
import { getSettings, updateSettings, selectCollectionsDirectory } from './ipc/settingsHandlers.js'
import { logger } from './config/logger.js'
import type { GameFilters, OptionFilters } from './ipc/types.js'
import type { AppSettings } from './config/settings.js'

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let importCancelled = false

// Determine if running in development
const isDev = process.env.NODE_ENV === 'development' ||
              process.env.ELECTRON_IS_DEV === 'true'

// Collections path: ~/.ligeon/collections
const collectionsPath = getCollectionsPath()

/**
 * Create the main browser window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/main/preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Determine start URL based on environment
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  void mainWindow.loadURL(startUrl)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Prevent window from navigating to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.origin !== 'http://localhost:5173' &&
        !url.startsWith('file://')) {
      event.preventDefault()
    }
  })
}

/**
 * Initialize application on startup
 * - Create collections directory if missing
 */
function initializeApp() {
  logger.info('Initializing ligeon...')
  logger.info('Collections path:', collectionsPath)

  // Ensure collections directory exists
  if (!fs.existsSync(collectionsPath)) {
    logger.info('Creating collections directory...')
    fs.mkdirSync(collectionsPath, { recursive: true })
  }

  logger.info('Ready for PGN imports')
}

/**
 * Set up IPC handlers for communication between renderer and main process
 */
function setupIpcHandlers() {
  logger.info('Setting up IPC handlers...')

  // File dialog for selecting PGN file
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'PGN Files', extensions: ['pgn'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    logger.debug('File dialog result:', result.filePaths[0] || 'cancelled')
    return result.filePaths[0] || null
  })

  // Open external URL in system browser
  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  // Import PGN file
  ipcMain.handle('import-pgn', async (event, { filePath, collectionId, name }: { filePath: string; collectionId: string; name: string }) => {
    logger.info('Import requested:', { filePath, collectionId, name })
    importCancelled = false

    const result = await importAndIndexPgn(
      filePath,
      collectionId,
      name,
      collectionsPath,
      event.sender,
      () => importCancelled
    )

    // Send completion event to renderer
    event.sender.send('import-complete', {
      success: result.success,
      collectionId,
      gamesIndexed: result.stats.totalIndexed,
      error: result.error
    })

    return result
  })

  // Cancel import
  ipcMain.on('cancel-import', () => {
    logger.info('Import cancelled by user')
    importCancelled = true
  })

  // List all collections
  ipcMain.handle('list-collections', () => listCollections())

  // Rename collection
  ipcMain.handle('rename-collection', (_event, { collectionId, newName }: { collectionId: string; newName: string }) =>
    renameCollection(collectionId, newName)
  )

  // Delete collection
  ipcMain.handle('delete-collection', (_event, { collectionId }: { collectionId: string }) =>
    deleteCollection(collectionId)
  )

  // Search games
  ipcMain.handle('search-games', (_event, { collectionId, filters }: { collectionId: string; filters: GameFilters }) =>
    searchGames(collectionId, filters)
  )

  // Get game with moves
  ipcMain.handle('get-game-moves', (_event, { collectionId, gameId }: { collectionId: string; gameId: string }) =>
    getGameMoves(collectionId, parseInt(gameId, 10))
  )

  // Get game count
  ipcMain.handle('get-game-count', (_event, { collectionId }: { collectionId: string }) =>
    getGameCount(collectionId)
  )

  ipcMain.handle('get-available-dates', (_event, { collectionId, filters }: { collectionId: string; filters?: OptionFilters }) =>
    getAvailableDates(collectionId, filters)
  )

  ipcMain.handle('get-available-eco-codes', (_event, { collectionId, filters }: { collectionId: string; filters?: OptionFilters }) =>
    getAvailableEcoCodes(collectionId, filters)
  )

  // Variation handlers
  ipcMain.handle('get-variations', (_event, { collectionId, gameId }: { collectionId: string; gameId: string }) =>
    getVariations(collectionId, parseInt(gameId, 10))
  )

  ipcMain.handle('create-variation', (_event, { collectionId, gameId, branchPly, moves }: { collectionId: string; gameId: string; branchPly: number; moves: string }) =>
    createVariation(collectionId, parseInt(gameId, 10), branchPly, moves)
  )

  ipcMain.handle('update-variation', (_event, { collectionId, gameId, id, moves }: { collectionId: string; gameId: string; id: number; moves: string }) =>
    updateVariation(collectionId, parseInt(gameId, 10), id, moves)
  )

  ipcMain.handle('delete-variation', (_event, { collectionId, gameId, id }: { collectionId: string; gameId: string; id: number }) =>
    deleteVariation(collectionId, parseInt(gameId, 10), id)
  )

  ipcMain.handle('reorder-variations', (_event, { collectionId, gameId, branchPly, orderedIds }: { collectionId: string; gameId: string; branchPly: number; orderedIds: number[] }) =>
    reorderVariations(collectionId, parseInt(gameId, 10), branchPly, orderedIds)
  )

  // Comment handlers
  ipcMain.handle('get-comments', (_event, { collectionId, gameId }: { collectionId: string; gameId: string }) =>
    getComments(collectionId, parseInt(gameId, 10))
  )

  ipcMain.handle('upsert-comment', (_event, { collectionId, gameId, ply, text }: { collectionId: string; gameId: string; ply: number; text: string }) =>
    upsertComment(collectionId, parseInt(gameId, 10), ply, text)
  )

  ipcMain.handle('delete-comment', (_event, { collectionId, gameId, ply }: { collectionId: string; gameId: string; ply: number }) =>
    deleteComment(collectionId, parseInt(gameId, 10), ply)
  )

  ipcMain.handle('upsert-variation-comment', (_event, { collectionId, gameId, variationId, text }: { collectionId: string; gameId: string; variationId: number; text: string }) =>
    upsertVariationComment(collectionId, parseInt(gameId, 10), variationId, text)
  )

  ipcMain.handle('delete-variation-comment', (_event, { collectionId, gameId, variationId }: { collectionId: string; gameId: string; variationId: number }) =>
    deleteVariationComment(collectionId, parseInt(gameId, 10), variationId)
  )

  // Annotation handlers
  ipcMain.handle('get-annotations', (_event, { collectionId, gameId }: { collectionId: string; gameId: string }) =>
    getAnnotations(collectionId, parseInt(gameId, 10))
  )

  ipcMain.handle('upsert-annotation', (_event, { collectionId, gameId, ply, nag }: { collectionId: string; gameId: string; ply: number; nag: number }) =>
    upsertAnnotation(collectionId, parseInt(gameId, 10), ply, nag)
  )

  ipcMain.handle('delete-annotation', (_event, { collectionId, gameId, ply, nag }: { collectionId: string; gameId: string; ply: number; nag: number }) =>
    deleteAnnotation(collectionId, parseInt(gameId, 10), ply, nag)
  )

  // Settings handlers
  ipcMain.handle('get-settings', () => getSettings())
  ipcMain.handle('update-settings', (_event, { updates }: { updates: Partial<AppSettings> }) => updateSettings(updates))
  ipcMain.handle('select-collections-directory', () => selectCollectionsDirectory())

  logger.info('✓ IPC handlers set up')
}

/**
 * App lifecycle events
 */
app.on('ready', () => {
  if (process.platform === 'darwin' && isDev) {
    app.dock?.setIcon(path.join(__dirname, '..', '..', 'resources', 'icons', 'png', 'icon-dev.png'));
  }
  logger.info('App ready')
  createWindow()
  initializeApp()
  setupIpcHandlers()
})

app.on('window-all-closed', () => {
  logger.info('All windows closed')
  // On macOS, apps stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  logger.info('App activated')
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow()
  }
})

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
})
