# Ligeon

Electron.js desktop app for viewing chess games (PGN format).

Based on [Lichess](https://lichess.org) components:
- [chessops](https://github.com/niklasf/chessops) — Chess move logic
- [chessground](https://github.com/lichess-org/chessground) — Board UI
- [chessground examples](https://github.com/lichess-org/chessground-examples)

## Plans

Check `.claude/plans/` for implementation tasks. These are guidelines, not strict rules. Use AskUserQuestion for decisions. If an earlier plan seems to be missing, it was already completed (check with the user to confirm).

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

## Gotchas

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

### Two TypeScript Configs

- `electron/tsconfig.json` — Node.js (ES modules, no DOM)
- `tsconfig.json` — Browser (DOM, React JSX)

### Ignore DevTools Warnings

These are harmless when running `npm run dev`:
```
Request Autofill.enable failed
Request Autofill.setAddresses failed
```

## Shared Library (`lib/`)

Platform-agnostic code shared between electron/ and CLI scripts.

### Structure

Each subdirectory has an `index.ts` barrel that re-exports contents:

```
lib/
├── index.ts              # Re-exports all
├── converters/           # Date, result converters
├── database/             # Schema constant
├── pgn/                  # Game extraction
└── types/                # GameData interface
```

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

1. Create module in `lib/*/` (e.g., `lib/converters/myConverter.ts`)
2. Export from `lib/*/index.ts`
3. Use `.js` extensions in imports
