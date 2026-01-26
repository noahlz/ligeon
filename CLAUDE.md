# Ligeon

Electron.js desktop app for viewing chess games (PGN format).

Based on [Lichess](https://lichess.org) components:
- [chessops](https://github.com/niklasf/chessops) — Chess move logic
- [chessground](https://github.com/lichess-org/chessground) — Board UI
- [chessground examples](https://github.com/lichess-org/chessground-examples)

## Pre-release, Active Development

This application has not yet been released - don't worry about making "backwards compatible" changes. Move fast and break things!

## Commands

```bash
npm run dev              # Dev server + launch Electron
npm run build            # Compile renderer + main (no packaging)
npm run build:main       # Compile main process only
npm run build:renderer   # Compile renderer only
npm run package          # Build + package (out/)
npm test                 # Run all tests
npm run clean            # Delete dist, dist-electron, out
npm run typecheck        # Check types
```

## After Changes

Always validate with:
1. `npm test` — run tests
2. `npm run typecheck` — check types
3. `npm run dev` — launch app
   - Window should open
   - Console shows "✓ IPC handlers set up"
   - Ignore "Autofill.enable failed" warnings

## Tech Stack

- Node.js, TypeScript
- Electron, React, Tailwind CSS
- SQLite (better-sqlite3)
- chessops, chessground
- Vite, Vitest

See `package.json` for versions.

## Architecture

**Main Process** (Node.js): `electron/` + `lib/` → `tsc` → `dist-electron/`
- App lifecycle, native APIs, SQLite, IPC handlers

**Renderer** (Browser): `src/` → `Vite` → `dist/`
- React components, Chessground board, IPC calls via `window.electron.*`

**Shared Library**: `lib/`
- PGN parsing, date/result converters, database schema, GameData type
- Used by electron/ and CLI scripts

**Dev:** Vite on `localhost:5173`, Electron loads from dev server
**Prod:** Electron loads from `dist/index.html`

**Build:**
| Source | Compiler | Output | Entry |
|--------|----------|--------|-------|
| `electron/*.ts` + `lib/*.ts` | TypeScript | `dist-electron/` | `electron/main.js` |
| `src/*.tsx` | Vite | `dist/` | `index.html` |

**TypeScript configs:**
- `electron/tsconfig.json` — Main + lib (Node.js, rootDir=`..`)
- `tsconfig.json` — Renderer (Browser)

## Project Structure

```
├── __tests__          # Tests (Vitest)
│   ├── integration
│   ├── performance
│   └── unit
├── electron            # Main process (Node.js, .ts only, no .js)
│   └── ipc             # IPC handlers
├── lib/                # Shared code (PGN parsing, converters, schema, types)
│   ├── converters/     # Date, result converters
│   ├── database/       # Schema
│   ├── pgn/            # Game extraction
│   └── types/          # GameData interface
├── resources/          # Icons, sample PGN files
├── scripts/            # CLI tools
├── src/                # Renderer (React/TypeScript)
│   ├── components/     # UI components
│   ├── hooks/          # Custom hooks
│   ├── styles/         # CSS, Tailwind
│   ├── types/          # Types
│   └── utils/          # Utilities
├── dist/               # BUILD: Compiled renderer
├── dist-electron/      # BUILD: Compiled main + lib
└── out/                # BUILD: Packaged app
```

## Code Navigation

### Start from Key Files

Start explortation / refactoring / feature changes from standard Electron/React and from the below top-level entry point files that define app-specific logic:

| Area | Entry Point | Purpose |
|------|-------------|---------|
| Types | `lib/types/game.ts` | Central `GameData` interface |
| Database | `electron/ipc/gameDatabase.ts` | SQLite wrapper for games |
| PGN parsing | `lib/pgn/gameExtractor.ts` | Parse PGN → GameData |
| Import | `electron/ipc/importHandlers.ts` | PGN file import orchestration |
| Board UI | `src/components/BoardDisplay.tsx` | Chessground integration |
| Game browsing | `src/components/GameListSidebar.tsx` | Search/filter games |

### Prefer LSP Over Text Search

When exploring or refactoring code:
- Start wth LSP tools i.e. `typescript-lsp` plugin
- Fall back to of Glob, Grep, Search, or Task(Explore) — if LSP yields no results.
- **NOTE:** For text (comments, strings, config values, other non-LSP symbols) — use Glob/Grep/Search.

Useful LSP tools available via `typescript-lsp`:
- `findReferences` — Find all usages
- `documentSymbol` — List symbols in a file
- `incomingCalls`/`outgoingCalls` — Trace call hierarchy
- `goToDefinition` — Jump to symbol definition
- `hover` — Get type info

## Gotchas

**RULE: Update this section after non-trivial fixes.**

When you fix a bug or solve a problem that required multiple attempts or significant reasoning:
1. Propose adding a summary of the fix/approach to this section
2. If existing content is inaccurate or obsolete, propose removing or revising it 

### Use `.js` Extensions in Imports

ES modules require `.js` even for `.ts` imports (TypeScript compiles to `.js`).

```typescript
// ✓ Correct
import { GameDatabase } from './gameDatabase.js'

// ✗ Incorrect
import { GameDatabase } from './gameDatabase'
```

### No `.js` Files in `electron/`

Only `.ts` source in `electron/`. Compiled output `.js` goes into `dist-electron/`. 

### Database is Main-Process Only

SQLite doesn't work in renderer. Route all DB calls through IPC:
1. Renderer: `window.electron.searchGames(...)`
2. preload.ts → ipcRenderer.invoke()
3. electron/ipc/ handler executes
4. Result returned to renderer

### Three TypeScript Configs

| Config | Purpose | Module | Target |
|--------|---------|--------|--------|
| `electron/tsconfig.json` | Main process + lib | ES modules | Node.js |
| `electron/tsconfig.preload.json` | Preload script | CommonJS | Node.js (sandboxed) |
| `tsconfig.json` | Renderer components | ES modules | Browser |

**IMPORTANT: Preload must use CommonJS.**
Electron's sandboxed preload scripts cannot use ES modules (`import`/`export`). They must use CommonJS (`require`/`module.exports`). The preload script is compiled separately with `module: "CommonJS"` and excluded from the main electron build. Do not use ES modules in preload scripts.

### Native Modules Must Be Rebuilt for Electron

Native Node modules (like `better-sqlite3`) must be compiled for Electron's Node version, not system Node:

```bash
npm rebuild better-sqlite3 --build-from-source   # Force rebuild for current Node
npx electron-rebuild -f                          # Rebuild for Electron
```

**Note:** `electron-rebuild` sometimes claims success without actually rebuilding. If tests still fail with NODE_MODULE_VERSION mismatch, try:
```bash
rm -rf node_modules/better-sqlite3/build && npm rebuild better-sqlite3 --build-from-source
```

### Ignore DevTools Warnings

These are harmless when running `npm run dev`:
```
Request Autofill.enable failed
Request Autofill.setAddresses failed
```

## Shared Library (`lib/`)

Platform-agnostic code shared between electron/ and CLI scripts.

### Structure

Each subdirectory has an `index.ts` barrel that re-exports contents.

### Import Patterns

From electron (relative to `electron/ipc/`):
```typescript
import { extractGameData, GAMES_SCHEMA_SQL } from '../../lib/pgn/gameExtractor.js'
import { GAMES_SCHEMA_SQL } from '../../lib/database/schema.js'
```

From CLI (relative to `scripts/`):
```typescript
import { extractGameData, GAMES_SCHEMA_SQL, type GameData } from '../lib/index.js'
```

### Add New Code

1. If appropriate, create module in `lib/*/` (e.g., `lib/converters/myConverter.ts`)
2. Export from `lib/*/index.ts`
3. Use `.js` extensions in imports
