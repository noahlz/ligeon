import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  listCollections,
  renameCollection,
  deleteCollection,
} from './ipc/collectionHandlers.js'
import { searchGames, getGameMoves } from './ipc/gameHandlers.js'
import { importAndIndexPgn } from './ipc/importHandlers.js'

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let importCancelled = false

// Determine if running in development
const isDev = process.env.NODE_ENV === 'development' ||
              process.env.ELECTRON_IS_DEV === 'true'

// Collections path: ~/.ligeon/collections
const collectionsPath = path.join(app.getPath('home'), '.ligeon', 'collections')

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
  console.log('Initializing ligeon...')
  console.log('Collections path:', collectionsPath)

  // Ensure collections directory exists
  if (!fs.existsSync(collectionsPath)) {
    console.log('Creating collections directory...')
    fs.mkdirSync(collectionsPath, { recursive: true })
  }

  console.log('Ready for PGN imports')
}

/**
 * Set up IPC handlers for communication between renderer and main process
 */
function setupIpcHandlers() {
  console.log('Setting up IPC handlers...')

  // File dialog for selecting PGN file
  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'PGN Files', extensions: ['pgn'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    console.log('File dialog result:', result.filePaths[0] || 'cancelled')
    return result.filePaths[0] || null
  })

  // Open external URL in system browser
  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url)
  })

  // Import PGN file
  ipcMain.handle('import-pgn', async (_event, { filePath, collectionId, name }) => {
    console.log('Import requested:', { filePath, collectionId, name })
    importCancelled = false

    return await importAndIndexPgn(
      filePath,
      collectionId,
      name,
      collectionsPath,
      mainWindow,
      () => importCancelled
    )
  })

  // Cancel import
  ipcMain.on('cancel-import', () => {
    console.log('Import cancelled by user')
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
    getGameMoves(collectionId, gameId)
  )

  console.log('✓ IPC handlers set up')
}

/**
 * App lifecycle events
 */
app.on('ready', async () => {
  console.log('App ready')
  createWindow()
  await initializeApp()
  setupIpcHandlers()
})

app.on('window-all-closed', () => {
  console.log('All windows closed')
  // On macOS, apps stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  console.log('App activated')
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow()
  }
})

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
