import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  listCollections,
  renameCollection,
  deleteCollection,
} from './ipc/collectionHandlers.js'
import { searchGames, getGameMoves, getGameCount, getAvailableDates } from './ipc/gameHandlers.js'
import { importAndIndexPgn } from './ipc/importHandlers.js'
import { getCollectionsPath } from './config/paths.js'
import { getSettings, updateSettings, selectCollectionsDirectory } from './ipc/settingsHandlers.js'
import { logger } from './config/logger.js'

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  })

  // Determine start URL based on environment
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  // Open dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

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
async function initializeApp() {
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
  ipcMain.handle('import-pgn', async (event, { filePath, collectionId, name }) => {
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
  ipcMain.handle('list-collections', async () => listCollections())

  // Rename collection
  ipcMain.handle('rename-collection', async (_event, { collectionId, newName }) =>
    renameCollection(collectionId, newName)
  )

  // Delete collection
  ipcMain.handle('delete-collection', async (_event, { collectionId }) =>
    deleteCollection(collectionId)
  )

  // Search games
  ipcMain.handle('search-games', async (_event, { collectionId, filters }) =>
    searchGames(collectionId, filters)
  )

  // Get game with moves
  ipcMain.handle('get-game-moves', async (_event, { collectionId, gameId }) =>
    getGameMoves(collectionId, parseInt(gameId, 10))
  )

  // Get game count
  ipcMain.handle('get-game-count', async (_event, { collectionId }) =>
    getGameCount(collectionId)
  )

  // Get available dates
  ipcMain.handle('get-available-dates', async (_event, { collectionId }) =>
    getAvailableDates(collectionId)
  )

  // Settings handlers
  ipcMain.handle('get-settings', async () => getSettings())
  ipcMain.handle('update-settings', async (_event, { updates }) => updateSettings(updates))
  ipcMain.handle('select-collections-directory', async () => selectCollectionsDirectory())

  logger.info('✓ IPC handlers set up')
}

/**
 * App lifecycle events
 */
app.on('ready', async () => {
  logger.info('App ready')
  createWindow()
  await initializeApp()
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
