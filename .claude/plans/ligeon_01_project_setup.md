---
# ligeon Part 1: Project Setup

**Goal:** Create project structure with TypeScript, pnpm, chessops, and correct dependencies

**Prerequisites:** Node.js 24+, pnpm 10+, macOS 11+ or Windows 10+

**READ for full context:** @TECHNOLOGY_OVERVIEW.md

---

## Implementation Tasks

Complete the following tasks in order. Create a todo list to track each task.

### Task 1: Initialize Project and Create package.json

Run:
```bash
pnpm init
```

Replace the generated package.json with this complete configuration:

```json
{
  "name": "ligeon",
  "version": "0.1.0",
  "type": "module",
  "description": "Browse and replay chess games from PGN databases",
  "author": "",
  "license": "GPL-3.0",
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build:vite": "tsc && vite build",
    "build": "pnpm run build:vite && electron-builder",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "engines": {
    "node": ">=24.0.0",
    "pnpm": ">=10.0.0"
  },
  "dependencies": {
    "@lichess-org/chessground": "^9.9.0",
    "better-sqlite3": "^12.6.0",
    "chessops": "^0.15.0",
    "lucide-react": "^0.562.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^24.10.0",
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^3.2.4",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.1.2",
    "electron": "^39.2.7",
    "electron-builder": "^26.0.12",
    "happy-dom": "^15.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.3",
    "vite": "^7.3.1",
    "vitest": "^3.2.4",
    "wait-on": "^8.0.1"
  }
}
```

Then verify:
- [ ] package.json created with dependencies
- [ ] `pnpm install` completes successfully
- [ ] pnpm-lock.yaml exists

---

### Task 2: Create TypeScript Configuration

**File: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "electron/**/*"],
  "exclude": ["node_modules", "dist", "dist-electron"]
}
```

Verify:
- [ ] tsconfig.json created with jsx: "react-jsx"
- [ ] strict mode enabled

---

### Task 3: Create Directory Structure

```bash
mkdir -p electron/ipc src/{components,utils,hooks,styles} \
         __tests__/{unit/components,integration,performance} public resources/sample-games
```

---

### Task 4: Create Vite Configuration

**File: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
```

Verify:
- [ ] vite.config.ts created with reportCompressedSize: false

---

### Task 5: Create Tailwind CSS Configuration

**File: `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
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
} satisfies Config
```

Verify:
- [ ] tailwind.config.ts created

---

### Task 6: Create PostCSS Configuration

**File: `postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Verify:
- [ ] postcss.config.js created

---

### Task 7: Create Vitest Configuration

**File: `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.*',
        'dist/',
        'dist-electron/',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**File: `vitest.setup.ts`**

```typescript
// Global test setup
import { expect } from 'vitest'

// Add custom matchers if needed
```

Verify:
- [ ] vitest.config.ts created with happy-dom environment
- [ ] vitest.setup.ts created

---

### Task 8: Create Electron Builder Configuration

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
    "package.json"
  ],
  "mac": {
    "target": ["dir"],
    "category": "public.app-category.games"
  },
  "win": {
    "target": ["dir"]
  }
}
```

Verify:
- [ ] electron-builder.json created with target: "dir"

---

### Task 9: Create HTML Entry Point

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
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>
```

Verify:
- [ ] public/index.html created
- [ ] Script imports /src/index.tsx

---

### Task 10: Create CSS Stylesheet

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

/* Import chessground CSS */
@import '@lichess-org/chessground/assets/chessground.base.css';
@import '@lichess-org/chessground/assets/chessground.brown.css';
@import '@lichess-org/chessground/assets/chessground.cburnett.css';

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
.cg-wrap {
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
```

Verify:
- [ ] src/styles/index.css created
- [ ] Chessground CSS imported

---

### Task 11: Update .gitignore

**File: `.gitignore`**

Update the existing .gitignore to consolidate it with the entries below. Keep any custom ignores already present.

```
# Dependencies
node_modules/
pnpm-lock.yaml

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

# Editor
.vscode/
.idea/
*.swp
*.swo

# Environment
.env
.env.local

# Data
.ligeon/
games.db
*.db

# Logs
.logs/
```

Verify:
- [ ] .gitignore updated
- [ ] .logs/ included in ignores

---

### Task 12: Create Placeholder Components

**File: `src/index.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
```

Verify:
- [ ] src/index.tsx created

---

**File: `src/App.tsx`**

```typescript
import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">ligeon</h1>
      <p className="text-gray-400">Chess PGN Game Browser</p>
      <p className="text-sm mt-4">Setting up with TypeScript + chessops...</p>
    </div>
  )
}
```

Verify:
- [ ] src/App.tsx created

---

**File: `electron/main.ts`**

```typescript
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

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
      preload: path.join(__dirname, 'preload.js'),
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

Verify:
- [ ] electron/main.ts created

---

**File: `electron/preload.ts`**

```typescript
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // Will be populated later
})
```

Verify:
- [ ] electron/preload.ts created

---

### Task 13: Verify Setup Works

Run:
```bash
pnpm install              # Install deps
pnpm run typecheck        # TypeScript check
pnpm run build:vite       # Build React
pnpm run dev              # Start dev server (Ctrl+C to stop)
```

Verify:
- [ ] `pnpm install` completes without errors
- [ ] `pnpm run typecheck` shows no errors
- [ ] `pnpm run build:vite` creates dist/ directory
- [ ] `pnpm run dev` opens Electron window
- [ ] Window displays "Setting up with TypeScript + chessops..."
- [ ] DevTools are accessible
- [ ] No console errors

---

**Next:**
- Update completed items in `ligeon_00_master_checklist.md`
- Proceed to `ligeon_02_electron_main.md`
