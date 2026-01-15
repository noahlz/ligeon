# ligeon Part 2: Electron Main Process

**Goal:** Create main.ts with window management, collections dir init, and IPC handlers

**Key files to create:**
- electron/main.ts (window + IPC setup)
- electron/preload.ts (security bridge)

---

## Actions to Complete

### 1. Create electron/main.ts

Replace your placeholder `electron/main.ts` with this complete implementation:

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

// Determine if running in development
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === 'true'

// Collections path: ~/.ligeon/collections
const collectionsPath = path.join(app.getPath('userData'), 'ligeon', 'collections')

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
      enableRemoteModule: false,
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
  ipcMain.handle('select-file', async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'PGN Files', extensions: ['pgn'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    console.log('File dialog result:', result.filePaths[0] || 'cancelled')
    return result.filePaths[0] || null
  })

  // Import PGN file (actual import handled in separate handler)
  ipcMain.handle('import-pgn', async (event, { filePath, collectionId, name }) => {
    console.log('Import requested:', { filePath, collectionId, name })

    try {
      // Import handler will be implemented in Part 4
      // For now, just acknowledge the request
      mainWindow.webContents.send('import-progress', {
        parsed: 0,
        indexed: 0,
        skipped: 0,
      })

      return { success: true }
    } catch (error) {
      console.error('Import error:', error)
      return { success: false, error: error.message }
    }
  })

  // Cancel import
  ipcMain.on('cancel-import', (event) => {
    console.log('Import cancelled by user')
    // Cancel logic will be implemented in Part 4
  })

  // List all collections
  ipcMain.handle('list-collections', async (event) => {
    console.log('Listing collections...')
    // Will be implemented in Part 3
    return []
  })

  // Rename collection
  ipcMain.handle('rename-collection', async (event, { collectionId, newName }) => {
    console.log('Renaming collection:', collectionId, '→', newName)
    // Will be implemented in Part 3
    return { success: true, metadata: { id: collectionId, name: newName } }
  })

  // Delete collection
  ipcMain.handle('delete-collection', async (event, { collectionId }) => {
    console.log('Deleting collection:', collectionId)
    // Will be implemented in Part 3
    return { success: true }
  })

  // Search games (handler will be implemented in Part 4)
  ipcMain.handle('search-games', async (event, { collectionId, filters }) => {
    console.log('Search requested for:', collectionId, filters)
    return []
  })

  // Get game with moves (handler will be implemented in Part 4)
  ipcMain.handle('get-game-moves', async (event, { collectionId, gameId }) => {
    console.log('Get game requested:', collectionId, gameId)
    return null
  })

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
```

**Checklist:**
- [ ] Replace electron/main.ts with complete code above
- [ ] Verify `import` statements work (ES modules)
- [ ] Ensure collectionsPath includes 'ligeon' subdirectory

---

### 2. Create electron/preload.ts

```typescript
import { contextBridge, ipcRenderer } from 'electron'

/**
 * Expose safe IPC methods to React renderer
 * Using context isolation for security
 */
contextBridge.exposeInMainWorld('electron', {
  // === File Operations ===
  selectFile: () => ipcRenderer.invoke('select-file'),

  importPgn: (filePath, collectionId, name) =>
    ipcRenderer.invoke('import-pgn', { filePath, collectionId, name }),

  cancelImport: () => ipcRenderer.send('cancel-import'),

  // === Collections ===
  listCollections: () => ipcRenderer.invoke('list-collections'),

  renameCollection: (collectionId, newName) =>
    ipcRenderer.invoke('rename-collection', { collectionId, newName }),

  deleteCollection: (collectionId) =>
    ipcRenderer.invoke('delete-collection', { collectionId }),

  // === Games ===
  searchGames: (collectionId, filters) =>
    ipcRenderer.invoke('search-games', { collectionId, filters }),

  getGameMoves: (collectionId, gameId) =>
    ipcRenderer.invoke('get-game-moves', { collectionId, gameId }),

  // === Event Listeners ===
  /**
   * Listen for import progress events
   * Returns unsubscribe function
   */
  onImportProgress: (callback) => {
    const unsubscribe = () => {
      ipcRenderer.removeAllListeners('import-progress')
      ipcRenderer.removeAllListeners('import-progress-log')
      ipcRenderer.removeAllListeners('import-complete')
    }

    ipcRenderer.on('import-progress', (event, data) => {
      callback({ ...data, type: 'progress' })
    })

    ipcRenderer.on('import-progress-log', (event, log) => {
      callback({ logs: [log], type: 'log' })
    })

    ipcRenderer.on('import-complete', (event, data) => {
      callback({ ...data, type: 'complete' })
    })

    return unsubscribe
  },

})
```

**Checklist:**
- [ ] Replace electron/preload.ts with complete code above
- [ ] All IPC methods exposed via contextBridge
- [ ] Event listeners return unsubscribe functions
- [ ] Security: nodeIntegration disabled, contextIsolation enabled

---

### 3. Test Main Process

```bash
pnpm dev
```

Expected: App starts, console shows "App ready", "Initializing ligeon...", "Ready for PGN imports"

**Verify collections directory exists:**
```bash
ls -la ~/.ligeon/collections/      # macOS
dir %APPDATA%\..\Local\ligeon\     # Windows
```

### 4. Test IPC (Temporary Test in src/App.tsx)

Add to App.tsx useEffect:
```typescript
window.electron.listCollections().then(cols => console.log('Collections:', cols))
```

Expected console output: `Collections: []`

Then remove the test code.

**Summary:** Main process window created, collections dir initialized, IPC handlers registered

**Next:** Proceed to ligeon_03_database_io.md