# ligeon - Part 2: Electron Main Process

Complete guide for setting up the Electron main process with window management, IPC handlers, and first-run collection auto-import.

---

## Overview

The main process handles:
- Creating and managing the Electron window
- Initializing collections directory on first run
- Setting up IPC (Inter-Process Communication) handlers
- File dialogs for PGN import

---

## 2.1 Update electron/main.js - Full Implementation

Replace your placeholder `electron/main.js` with this complete implementation:

```javascript
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
- [ ] Replace electron/main.js with complete code above
- [ ] Verify `import` statements work (ES modules)
- [ ] Ensure collectionsPath includes 'ligeon' subdirectory

---

## 2.2 Create electron/preload.js - Security Bridge

Replace your placeholder `electron/preload.js` with this complete implementation:

```javascript
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
- [ ] Replace electron/preload.js with complete code above
- [ ] All IPC methods exposed via contextBridge
- [ ] Event listeners return unsubscribe functions
- [ ] Security: nodeIntegration disabled, contextIsolation enabled

---

## 2.3 Create electron/ipc Directory Structure

The ipc directory will contain modular handlers (created in Part 4):

```bash
mkdir -p electron/ipc
```

**Files to create in Part 4:**
- `electron/ipc/gameDatabase.js` - SQLite wrapper
- `electron/ipc/importHandlers.js` - PGN import logic
- `electron/ipc/collectionHandlers.js` - Collection CRUD
- `electron/ipc/gameHandlers.js` - Game search/retrieval

**Checklist:**
- [ ] Create electron/ipc directory

---

## 2.4 Add Collections Path to package.json (Optional)

You can add this to help with development:

In `package.json`, add to `scripts`:

```json
"clean": "rm -rf ~/.ligeon",
```

This allows `npm run clean` to reset collections during development.

**Checklist:**
- [ ] (Optional) Add clean script to package.json

---

## 2.5 Test Main Process Startup

Now test that everything works:

```bash
npm run dev
```

**Expected behavior:**
1. Vite dev server starts (Terminal 1)
2. Electron window opens with React app
3. Console logs show:
   - "App ready"
   - "Initializing ligeon..."
   - "Creating collections directory..." (first time only)
   - "Ready for PGN imports"
   - "Setting up IPC handlers..."

**Checklist:**
- [ ] `npm run dev` starts without crashing
- [ ] Electron window opens
- [ ] Console shows app initialization logs
- [ ] No major errors in console
- [ ] DevTools opens (if isDev=true)

---

## 2.6 Verify Collections Directory Created

After running the app once, verify the collections directory:

**macOS:**
```bash
ls -la ~/.ligeon/collections/
```

**Windows:**
```cmd
dir %APPDATA%\..\Local\ligeon\collections\
```

**Expected:**
- Collections directory exists and is empty (ready for user imports)

**Checklist:**
- [ ] Collections directory created in correct location
- [ ] Directory is empty (no auto-import)

---

## 2.7 Test IPC Communication

To verify IPC is working, add this to `src/App.jsx` temporarily:

```javascript
import React, { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    // Test IPC
    window.electron.listCollections()
      .then(cols => console.log('Collections:', cols))
      .catch(err => console.error('Error:', err))
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold">ligeon</h1>
      <p className="text-gray-400 mt-2">Check console for IPC test results</p>
    </div>
  )
}
```

Expected console output: `Collections: []` (empty array - ready for user imports)

Remove this code after testing.

**Checklist:**
- [ ] IPC communication verified
- [ ] Collections listed in console
- [ ] Test code removed

---

## 2.8 Create electron/main.js Comments Reference

Key functions in main.js:

| Function | Purpose |
|----------|---------|
| `createWindow()` | Create and configure Electron window |
| `initializeApp()` | Create collections directory |
| `setupIpcHandlers()` | Register all IPC event handlers |

**Checklist:**
- [ ] All key functions understand and documented

---

## 2.9 Troubleshooting

**Issue: "Cannot find module 'electron'"**
- Run `npm install` again
- Delete node_modules and package-lock.json
- Run `npm install` fresh

**Issue: Window doesn't open**
- Check that `preload.js` path is correct
- Verify preload.js exists
- Check for errors in DevTools console (F12)

**Issue: IPC methods not available**
- Verify `contextBridge.exposeInMainWorld` called in preload.js
- Check that `contextIsolation: true` in BrowserWindow config
- Verify preload path in main.js

**Issue: Collections directory in wrong location**
- Verify `app.getPath('userData')` returns correct location
- macOS: Should be `~/Library/Application Support/ligeon/`
- Windows: Should be `%APPDATA%\..\Local\ligeon\`

---

## Summary

You've now set up:
- ✅ Main process window creation
- ✅ Collections directory initialization
- ✅ IPC handler framework (with stubs)
- ✅ Security with context isolation and preload script

---

## Next Steps

Proceed to **Part 3: Database & I/O** to implement:
- SQLite database schema and operations
- Date and result conversion utilities
- Collection and game database handlers

---

**Main process complete! Ready for Part 3: Database & I/O.**