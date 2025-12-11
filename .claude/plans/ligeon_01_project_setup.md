# ligeon - Part 1: Project Setup & Configuration

Complete guide for setting up the ligeon project with all necessary configuration files and dependencies.

---

## Prerequisites

- Node.js 16+ and npm 8+
- macOS 11+ or Windows 10+
- Text editor or IDE (VS Code recommended)

---

## 1.1 Initialize Project Directory

```bash
mkdir ligeon
cd ligeon
npm init -y
```

---

## 1.2 Create package.json

Replace the generated package.json with this complete configuration:

```json
{
  "name": "ligeon",
  "version": "1.0.0",
  "type": "module",
  "description": "Browse and replay chess games from PGN databases",
  "author": "",
  "license": "MIT",
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build && electron-builder",
    "build:mac": "vite build && electron-builder --mac",
    "build:win": "vite build && electron-builder --win",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "better-sqlite3": "^12.5.0",
    "chess.js": "^0.13.0",
    "chessground": "^9.9.0",
    "electron-squirrel-startup": "^1.1.1",
    "lucide-react": "^0.263.1",
    "pgn-parser": "^2.2.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@babel/core": "^7.28.5",
    "@babel/preset-react": "^7.27.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "babel-jest": "^29.7.0",
    "concurrently": "^9.1.2",
    "electron": "^39.2.6",
    "electron-builder": "^26.0.12",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^6.0.7",
    "wait-on": "^8.0.1"
  }
}
```

**Checklist:**
- [ ] package.json created with all dependencies
- [ ] Run `npm install` successfully
- [ ] Verify node_modules/ created

---

## 1.3 Create Project Directory Structure

Create all directories:

```bash
mkdir -p electron/ipc
mkdir -p src/components
mkdir -p src/utils
mkdir -p src/hooks
mkdir -p src/styles
mkdir -p resources/sample-games
mkdir -p scripts
mkdir -p public
mkdir -p __tests__/unit/components
mkdir -p __tests__/integration
mkdir -p __tests__/performance
```

**Checklist:**
- [ ] All directories created

---

## 1.4 Create Vite Configuration

**File: `vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Checklist:**
- [ ] vite.config.js created
- [ ] React plugin configured

---

## 1.5 Create Tailwind CSS Configuration

**File: `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
```

**Checklist:**
- [ ] tailwind.config.js created

---

## 1.6 Create PostCSS Configuration

**File: `postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Checklist:**
- [ ] postcss.config.js created

---

## 1.7 Create Jest Configuration

**File: `jest.config.js`**

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { 
      presets: ['@babel/preset-react'] 
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'electron/**/*.js',
    '!**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}
```

**Checklist:**
- [ ] jest.config.js created

---

## 1.8 Create Jest Setup File

**File: `jest.setup.js`**

```javascript
require('@testing-library/jest-dom')
```

**Checklist:**
- [ ] jest.setup.js created

---

## 1.9 Create Electron Builder Configuration

**File: `electron-builder.json`**

```json
{
  "appId": "io.github.ligeon",
  "productName": "ligeon",
  "directories": {
    "buildResources": "resources",
    "output": "dist-electron"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "resources/**/*",
    "package.json"
  ],
  "mac": {
    "target": ["dmg"],
    "category": "public.app-category.games",
    "artifactName": "${productName}-${version}.${ext}"
  },
  "win": {
    "target": ["nsis", "portable"],
    "certificateFile": null,
    "artifactName": "${productName}-${version}.${ext}"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

**Checklist:**
- [ ] electron-builder.json created
- [ ] appId set to io.github.ligeon
- [ ] productName set to ligeon

---

## 1.10 Create HTML Entry Point

**File: `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ligeon</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.jsx"></script>
</body>
</html>
```

**Checklist:**
- [ ] public/index.html created
- [ ] Root div for React
- [ ] Script points to src/index.jsx

---

## 1.11 Create CSS Stylesheet

**File: `src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.move-list {
  font-family: 'Courier New', monospace;
  line-height: 1.8;
}

.move-item {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.move-item:hover {
  background-color: #475569;
}

.move-item.current {
  background-color: #d97706;
  font-weight: bold;
}

/* Chessground overrides */
.cg-board {
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
```

**Checklist:**
- [ ] src/styles/index.css created
- [ ] Tailwind directives included
- [ ] Custom styles for move list

---

## 1.12 Create .gitignore

**File: `.gitignore`**

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build output
dist/
dist-electron/
*.dmg
*.exe
*.msi

# Development
.DS_Store
Thumbs.db
*.log
npm-debug.log*
yarn-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Data
.ligeon/
games.db
*.db
```

**Checklist:**
- [ ] .gitignore created
- [ ] Includes node_modules, build output, IDE files, app data

---

## 1.13 Create Placeholder Components (Stubs)

Create minimal placeholder files so imports don't fail during setup:

**File: `src/index.jsx`**

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Checklist:**
- [ ] src/index.jsx created

---

**File: `src/App.jsx`**

```javascript
import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">ligeon</h1>
      <p className="text-gray-400">Chess PGN Game Browser</p>
      <p className="text-sm mt-4">Setting up...</p>
    </div>
  )
}
```

**Checklist:**
- [ ] src/App.jsx created

---

**File: `electron/main.js`**

```javascript
import { app, BrowserWindow } from 'electron'
import path from 'path'

let mainWindow

// Determine if running in development
const isDev = process.env.NODE_ENV === 'development' ||
              process.env.ELECTRON_IS_DEV === 'true'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
```

**Checklist:**
- [ ] electron/main.js created with basic window setup

---

**File: `electron/preload.js`**

```javascript
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Will be populated later
})
```

**Checklist:**
- [ ] electron/preload.js created

---

## 1.14 Verify Setup

Run these commands to verify the setup:

```bash
# Install dependencies
npm install

# Verify structure
ls -la

# Check if Vite works
npm run build

# Try dev server (Ctrl+C to stop)
npm run dev
```

**Checklist:**
- [ ] `npm install` completes without errors
- [ ] All directories visible with `ls -la`
- [ ] `npm run build` creates dist/ directory
- [ ] `npm run dev` starts without crashing
- [ ] Browser shows basic app (or Electron window opens)
- [ ] No major console errors

---

## Summary of Created Files

| File | Purpose |
|------|---------|
| package.json | Dependencies and scripts |
| vite.config.js | Vite build configuration |
| tailwind.config.js | Tailwind CSS theme |
| postcss.config.js | PostCSS plugins |
| jest.config.js | Jest testing setup |
| jest.setup.js | Jest initialization |
| electron-builder.json | Electron build config (io.github.ligeon) |
| public/index.html | React entry point |
| src/styles/index.css | Global styles + Tailwind |
| src/index.jsx | React root |
| src/App.jsx | Main App component |
| electron/main.js | Electron main process |
| electron/preload.js | IPC bridge (security) |
| .gitignore | Git ignore rules |

---

## Next Steps

Once setup is complete and verified, proceed to **Part 2: Electron Main Process** to implement:
- Window management
- IPC handlers
- Collections directory
- Auto-import first-run experience

---

## Troubleshooting

**Issue: `npm install` fails**
- Delete node_modules/ and package-lock.json
- Run `npm cache clean --force`
- Run `npm install` again

**Issue: Vite build fails**
- Check Node.js version: `node --version` (should be 16+)
- Delete dist/ and .vite/ directories
- Run `npm run build` again

**Issue: Electron won't start**
- Check main.js has correct paths
- Verify electron/preload.js exists
- Check browser console for errors (F12)

**Issue: Styles not loading**
- Verify tailwind.config.js content paths
- Check public/index.html script src
- Clear browser cache (hard refresh)

---

**Setup complete! Ready for Part 2: Electron Main Process.**