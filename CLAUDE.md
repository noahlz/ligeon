# Ligeon

Ligeon is an Electron.js desktop application for viewing chess games (PGN format data).

It is based on the JavaScript components used to build [Lichess](https://lichess.org). Example projects:

- [chessops](https://github.com/niklasf/chessops) - Logic for moving chess pieces
- [chessground](https://github.com/lichess-org/chessground) - Chess game UI
- [chessground examples](https://github.com/lichess-org/chessground-examples)

## Implementation Plan

Find the implementation plan under `.claude/plans/`

**NOTE** these are a plan, not strict instructions. Be flexible in adjusting the plans as you proceed through the implementation. Use AskUserQuestion when you need a decision from the User.

The user will delete plan files after they are implemented - so if one appears to be missing, it was already done.

## Dev Commands

```bash
npm run dev              # Start dev server and launch Electron window
npm run build            # Compile renderer + main process (no packaging)
npm run build:main       # Compile only main process (electron/)
npm run build:renderer   # Compile only renderer (src/)
npm run package          # Build + create distributable in out/
npm test                 # Run all tests (unit + integration)
npm run clean            # Remove all build outputs (dist, dist-electron, out)
npm run typecheck        # Check TypeScript types
```

## Validation After Changes

After making code changes, validate with these steps:

1. **Run tests:** `npm test`
2. **Type check:** `npm run typecheck`
3. **Launch app:** `npm run dev`
   - Verify the Electron window opens
   - Check console for IPC handler setup messages
   - DevTools console warnings about "Autofill.enable" are harmless

## Technology Stack

See `package.json` for current versions.

- **Runtime:** Node.js
- **Language:** TypeScript
- **Main Application:** Electron, React, Tailwind CSS
- **Database:** SQLite with better-sqlite3
- **Chess Logic:** chessops
- **Board UI:** chessground
- **Package Manager:** npm
- **Build Tool:** Vite
- **Testing:** Vitest

## Architecture Overview

This is an Electron app with two processes that communicate via IPC:

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAIN PROCESS                             │
│                     (Node.js runtime)                           │
│  electron/ → tsc → dist-electron/                               │
│                                                                 │
│  • App lifecycle (main.ts)                                      │
│  • Native APIs (file dialogs, menus)                            │
│  • SQLite database (better-sqlite3)                             │
│  • IPC handlers (electron/ipc/)                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ IPC (preload.ts context bridge)
┌──────────────────────────▼──────────────────────────────────────┐
│                      RENDERER PROCESS                           │
│                    (Chromium browser)                           │
│  src/ → Vite → dist/                                            │
│                                                                 │
│  • React UI components                                          │
│  • Chessground board display                                    │
│  • User interactions                                            │
│  • Calls main process via window.electron.*                     │
└─────────────────────────────────────────────────────────────────┘
```

**Dev mode:** Vite serves React on `localhost:5173`, Electron loads from dev server
**Production:** Electron loads from `dist/index.html`

### Build Pipeline

| Source | Compiler | Output | Entry Point |
|--------|----------|--------|-------------|
| `electron/*.ts` | TypeScript (`tsc`) | `dist-electron/*.js` | `main.js` |
| `src/*.tsx` | Vite (esbuild) | `dist/` | `index.html` |

Two separate TypeScript configs:
- `electron/tsconfig.json` — Main process (Node.js target)
- `tsconfig.json` — Renderer process (browser target, extends `tsconfig.base.json`)

## Project Structure

```
├── .claude/
│   └── plans/          # Implementation plans (delete after completing)
├── __tests__/          # Test suite (Vitest)
│   ├── integration/    # End-to-end tests for PGN import workflow
│   ├── performance/    # Performance benchmarks for database operations
│   └── unit/           # Unit tests for database, converters, IPC handlers
├── dist/               # BUILD OUTPUT: Compiled renderer (React app)
├── dist-electron/      # BUILD OUTPUT: Compiled main process (Electron)
├── out/                # BUILD OUTPUT: Packaged app bundles (dmg, nsis)
├── electron/           # Main process source (TypeScript only, no .js files)
│   ├── ipc/            # IPC handlers for renderer ↔ main communication
│   │   └── utils/      # Shared utilities (date/result converters)
├── public/             # Static assets copied to dist/ by Vite (favicon, etc.)
├── resources/          # Assets for app packaging (icons, sample data)
│   ├── icons/          # Application icons for electron-builder
│   └── sample-games/   # Example PGN files for testing/demo
└── src/                # Renderer process source (React/TypeScript)
    ├── components/     # React UI components
    ├── hooks/          # Custom React hooks
    ├── styles/         # Tailwind CSS and global styles
    ├── types/          # TypeScript type definitions for renderer
    └── utils/          # Renderer utility functions
```

## Gotchas

### ES Modules Require `.js` Extensions

This project uses ES modules (`"type": "module"` in package.json). When importing local files in the `electron/` directory:

- **Use `.js` extensions** in import statements, even when importing `.ts` files
- TypeScript compiles `.ts` → `.js`, so imports must reference the output filename

```typescript
// Correct
import { GameDatabase } from './gameDatabase.js'
import { convertResult } from './utils/resultConverter.js'

// Incorrect - will fail at runtime
import { GameDatabase } from './gameDatabase'
```

### No Compiled Files in Source Directories

The `electron/` directory should contain only `.ts` source files. If you see `.js` files there, they are stale build artifacts and should be deleted. Compiled output goes to `dist-electron/`.

### Database Access is Main-Process Only

SQLite (better-sqlite3) is a native Node.js module that only runs in the main process. The renderer cannot access it directly. All database operations go through IPC:

1. Renderer calls `window.electron.searchGames(...)`
2. `preload.ts` forwards to main process via `ipcRenderer.invoke()`
3. Main process handler in `electron/ipc/` executes database query
4. Result returns to renderer

### Two TypeScript Configs

Don't mix them up:
- `electron/tsconfig.json` — Compiles to Node.js (ES modules, no DOM)
- `tsconfig.json` — Compiles to browser (DOM APIs, React JSX)

### Harmless DevTools Warnings

When running `npm run dev`, these console errors are expected and harmless:
```
Request Autofill.enable failed
Request Autofill.setAddresses failed
```
These are Chrome DevTools features not available in Electron's version.
