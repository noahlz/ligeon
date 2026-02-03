# Ligeon

Electron.js desktop app for viewing chess games (PGN format).

Based on [Lichess](https://lichess.org) components:
- [chessops](https://github.com/niklasf/chessops) — Chess move logic
- [chessground](https://github.com/lichess-org/chessground) — Board UI
- [chessground examples](https://github.com/lichess-org/chessground-examples)

**TIP:** See [chessground config](https://raw.githubusercontent.com/lichess-org/chessground/refs/heads/master/src/config.ts) — for chessboard display options reference

## Pre-release, Active Development

This application has not yet been released - don't worry about making "backwards compatible" changes. Move fast and break things!

## Commands

```bash
npm run clean            # Delete dist, dist-electron, out
npm run build            # Compile renderer + main (no packaging)
npm run typecheck        # Check types
npm test                 # Run all tests (auto-rebuilds better-sqlite3)
npm run test:coverage    # Run tests with coverage report
npm run dev              # Dev server + launch Electron
npm run package          # Build + package (out/)
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
- chessops, chessground
- lucide-react (icons)
- SQLite (better-sqlite3)
- Vite, Vitest

See `package.json` for versions.

## Architecture

**Main Process** (Node.js): `src/main/` + `src/shared/` → `tsc` → `dist-electron/`
- App lifecycle, native APIs, SQLite, IPC handlers

**Renderer** (Browser): `src/renderer/` → `Vite` → `dist/`
- React components, Chessground board, IPC calls via `window.electron.*`

**Shared Library**: `src/shared/`
- PGN parsing, date/result converters, database schema, GameData type
- Used by src/main/ and CLI scripts

**Dev:** Vite on `localhost:5173`, Electron loads from dev server
**Prod:** Electron loads from `dist/index.html`

**Build:**
| Source | Compiler | Output | Entry |
|--------|----------|--------|-------|
| `src/main/*.ts` + `src/shared/*.ts` | TypeScript (ESM) | `dist-electron/` | `dist-electron/main/main.js` |
| `src/main/preload.ts` | TypeScript (CJS) | `dist-electron/preload/` | `dist-electron/preload/main/preload.js` |
| `src/renderer/*.tsx` | Vite | `dist/` | `index.html` |

**TypeScript configs:**
- `src/main/tsconfig.json` — Main + shared (Node.js ESM, rootDir=`src/`)
- `src/main/tsconfig.preload.json` — Preload (Node.js CJS, separate outDir — see Gotchas)
- `src/renderer/tsconfig.json` — Renderer (Browser)

## Project Structure

```
__tests__/             # Tests (Vitest)
  integration/
  performance/
  unit/
public/                # Static assets
  sounds/              # Audio files
resources/             # Icons, sample PGN files
scripts/               # CLI tools
src/
  main/                # Main process (Node.js, .ts only)
    config/            # Centralized configuration (paths, logger, settings)
    ipc/               # IPC handlers, validators, types
  renderer/            # Renderer (React/TypeScript)
    components/
    hooks/
    styles/            # CSS, Tailwind
    types/
    utils/
  shared/              # Shared code (single source for main + renderer)
    converters/        # Date, result converters
    database/          # Schema
    pgn/               # Game extraction
    types/             # GameData interface
dist/                  # BUILD: Compiled renderer (Vite)
dist-electron/         # BUILD: Compiled main + preload (tsc)
  main/                #   ESM — main process + shared
  preload/             #   CJS — preload (separate outDir, see Gotchas)
out/                   # BUILD: Packaged app (electron-builder)
```

## Code Navigation

### Key Entry Points

| Area | Entry Point | Purpose |
|------|-------------|---------|
| **Main Process** | | |
| Types | `src/shared/types/game.ts` | Central `GameData` interface |
| Database | `src/main/ipc/gameDatabase.ts` | SQLite wrapper + `DatabaseManager` singleton |
| Validation | `src/main/ipc/validators.ts` | IPC input validation (security) |
| Config | `src/main/config/paths.ts` | Centralized path configuration |
| PGN parsing | `src/shared/pgn/gameExtractor.ts` | Parse PGN → GameData |
| Import | `src/main/ipc/importHandlers.ts` | PGN file import orchestration |
| IPC bridge | `src/main/preload.ts` | Exposes `window.electron.*` API |
| IPC types | `src/renderer/types/electron.d.ts` | Type definitions for IPC API |
| **Renderer** | | |
| App root | `src/renderer/App.tsx` | Main layout, state management |
| Board UI | `src/renderer/components/BoardDisplay.tsx` | Chessground integration |
| Game browsing | `src/renderer/components/GameListSidebar.tsx` | Search/filter games |
| Move navigation | `src/renderer/components/MoveNavigation.tsx` | Nav buttons + keyboard shortcuts |
| **Utilities** | | |
| Chess logic | `src/renderer/utils/chessManager.ts` | Move parsing, FEN, ply navigation |
| Audio | `src/renderer/utils/audioManager.ts` | Move sounds (capture, check, etc.) |
| Date converter | `src/renderer/utils/dateConverter.ts` | Timestamp ↔ display format |
| Result converter | `src/shared/converters/resultConverter.ts` | Numeric result ↔ display (single source)

### Prefer LSP Over Text Search

When exploring or refactoring code:
- Start with LSP tools i.e. `typescript-lsp` plugin
- Fall back to Glob, Grep, Search, or Task(Explore) — if LSP yields no results
- **NOTE:** For text (comments, strings, config values, other non-LSP symbols) — use Glob/Grep/Search

Useful LSP operations:
- `findReferences` — Find all usages
- `documentSymbol` — List symbols in a file
- `incomingCalls`/`outgoingCalls` — Trace call hierarchy
- `goToDefinition` — Jump to symbol definition
- `hover` — Get type info

## Application Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              App.tsx (root)                                │
├────────────────┬────────────────────────────────────┬──────────────────────┤
│ Left Sidebar   │         Center Board Area          │   Right Panel        │
│ (w-72)         │         (flex-1)                   │   (w-80)             │
│ ┌────────────┐ │  ┌──────┐ ┌─────────────┐ ┌──────┐ │ ┌──────────────────┐ │
│ │Collection- │ │  │Spacer│ │ BoardDisplay│ │Ctrl- │ │ │GameInfo (collaps-│ │
│ │Selector    │ │  │      │ │ + coords    │ │Strip │ │ │ible header)      │ │
│ └────────────┘ │  │      │ └─────────────┘ │      │ │ └──────────────────┘ │
│ ┌────────────┐ │  │      │ ┌─────────────┐ │      │ │ ┌───────────────────┐│
│ │Filter panel│ │  │      │ │MoveNav      │ │      │ │ │MoveList (scroll-  ││
│ │(collapsible│ │  │      │ └─────────────┘ │      │ │ │able grid)         ││
│ └────────────┘ │  └──────┘                 └──────┘ │ │                   ││
│ ┌────────────┐ │                                    │ │ # │ White │ Black ││
│ │Game list   │ │                                    │ │ 1.│ e4    │ c5    ││
│ │(scrollable)│ │                                    │ │ 2.│ Nf3   │ e6    ││
│ │            │ │                                    │ │...│       │       ││
│ └────────────┘ │                                    │ └───────────────────┘│
└────────────────┴────────────────────────────────────┴──────────────────────┘
```

### Component → File Mapping

| UI Element | Component | File |
|------------|-----------|------|
| Collection dropdown + rename/delete | `CollectionSelector` | `src/renderer/components/CollectionSelector.tsx` |
| Filter panel (search, result radio) | `GameListSidebar` | `src/renderer/components/GameListSidebar.tsx` |
| Game list items | `GameListSidebar` | `src/renderer/components/GameListSidebar.tsx` |
| Chess board | `BoardDisplay` | `src/renderer/components/BoardDisplay.tsx` |
| Navigation buttons (`|<  <  ▶  >  >|`) | `MoveNavigation` | `src/renderer/components/MoveNavigation.tsx` |
| Control strip (Lichess, sound, flip) | `ControlStrip` | `src/renderer/components/ControlStrip.tsx` |
| Game title header (collapsible) | `GameInfo` | `src/renderer/components/GameInfo.tsx` |
| Move list grid | `MoveList` | `src/renderer/components/MoveList.tsx` |
| PGN import dialog | `ImportDialog` | `src/renderer/components/ImportDialog.tsx` |
| Delete confirmation dialog | `ConfirmDialog` | `src/renderer/components/ConfirmDialog.tsx` |

### Keyboard Shortcuts (MoveNavigation.tsx)

| Key | Action |
|-----|--------|
| `←` | Previous move |
| `→` | Next move |
| `Home` | First position |
| `End` | Last position |
| `Space` | Toggle auto-play |
| Mouse wheel | Prev/next move (when not over sidebar/move list) |

### Styling

**Color tokens** (`tailwind.config.ts` + `src/renderer/styles/index.css`):
- `ui-bg-page` — darkest background (main page)
- `ui-bg-box` — panel backgrounds
- `ui-bg-element` — buttons, list items
- `ui-bg-hover` — hover state
- `ui-text` / `ui-text-dim` / `ui-text-dimmer` — text hierarchy
- `ui-accent` — orange highlight (current move, active play button)

**Chessground CSS** (`src/renderer/styles/index.css`):
- Board uses `.board-coords-wrapper` for coordinate padding
- Coords positioned outside board via `.cg-wrap coords.ranks/files`
- Board orientation handled via `data-orientation="black"` attribute

### Layout Principles

- **Avoid absolute positioning** — use flex containers for resize behavior
- **Group related components** — Board + MoveNavigation wrapped together in flex-col
- **Symmetric spacing** — left spacer div matches ControlStrip width for centering

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

### No `.js` Files in `src/main/`

Only `.ts` source in `src/main/`. Compiled output `.js` goes into `dist-electron/main/`.

### Database is Main-Process Only

SQLite doesn't work in renderer. Route all DB calls through IPC:
1. Renderer: `window.electron.searchGames(...)`
2. preload.ts → ipcRenderer.invoke()
3. src/main/ipc/ handler executes
4. Result returned to renderer

### Validate IPC Inputs

All IPC handlers must validate inputs using `src/main/ipc/validators.ts`:

```typescript
if (!validateCollectionId(collectionId)) {
  logError('searchGames', { collectionId, reason: 'invalid' }, new Error('Validation failed'))
  return []
}
const sanitizedFilters = validateSearchFilters(filters)
```

- `validateCollectionId()` — blocks path traversal, limits length
- `validateFilePath()` — checks existence, file type, size
- `validateSearchFilters()` — trims strings, clamps numeric ranges
- `validateCollectionName()` — non-empty, max 200 chars

### Shared Code in src/shared/ (Single Source)

Place shared utilities in `src/shared/` not `src/utils/`.
- **Renderer**: `@shared` aliases work — Vite rewrites them at bundle time
- **Main process**: must use relative paths — see Import Patterns and `@shared` gotcha below

```typescript
// Renderer — @shared alias works via Vite
import { resultNumericToDisplay } from '@shared/converters/resultConverter.js'

// Main process — relative path required
import { GAMES_SCHEMA_SQL } from '../../shared/database/schema.js'
```

### Three TypeScript Configs

| Config | Purpose | Module | Target |
|--------|---------|--------|--------|
| `src/main/tsconfig.json` | Main process + shared | ES modules | Node.js |
| `src/main/tsconfig.preload.json` | Preload script | CommonJS | Node.js (sandboxed) |
| `src/renderer/tsconfig.json` | Renderer components | ES modules | Browser |

**IMPORTANT: Preload must use CommonJS.**
Electron's sandboxed preload scripts cannot use ES modules (`import`/`export`). They must use CommonJS (`require`/`module.exports`). The preload script is compiled separately with `module: "CommonJS"` and excluded from the main electron build. Do not use ES modules in preload scripts.

### Native Modules Must Be Rebuilt for Electron

`better-sqlite3` must be compiled for both Node.js (tests) and Electron (app), but can't have both binaries simultaneously.

**Automatic handling:**
- `npm test` / `npm run test:coverage` — auto-rebuilds for Node.js before tests, then for Electron after

**Manual rebuilds (if needed):**
- `npm run rebuild:sqlite` — clean + rebuild for Node.js (tests)
- `npm run rebuild:electron` — rebuild for Electron (app)

**Troubleshooting NODE_MODULE_VERSION errors:**
1. Identify context: tests (Node.js) or app (Electron)
2. Run appropriate rebuild script above
3. If `electron-rebuild` fails silently: `rm -rf node_modules/better-sqlite3/build` then rebuild

**Why clean build directory:** `electron-rebuild` sometimes claims success without actually rebuilding.

### Ignore DevTools Warnings

These are harmless when running `npm run dev`:
```
Request Autofill.enable failed
Request Autofill.setAddresses failed
```

### Structure

Each subdirectory has an `index.ts` barrel that re-exports contents.

### Import Patterns

From `src/main/ipc/` → `src/shared/`:
```typescript
import { extractGameData } from '../../shared/pgn/gameExtractor.js'
import { GAMES_SCHEMA_SQL } from '../../shared/database/schema.js'
```

From `src/main/ipc/utils/` → `src/shared/` (one extra `../`):
```typescript
export * from '../../../shared/converters/resultConverter.js'
```

From CLI (`scripts/`):
```typescript
import { extractGameData, GAMES_SCHEMA_SQL, type GameData } from '../src/shared/index.js'
```

### `@shared` Aliases Are Compile-Time Only

TypeScript `paths` (like `@shared/*`) satisfy the type-checker but are **not rewritten** in emitted `.js`. Node.js will crash at runtime with `Cannot find package '@shared/...'`.

- **Renderer (`src/renderer/`)**: `@shared` works — Vite rewrites aliases during bundling
- **Main process (`src/main/`)**: must use relative paths

```typescript
// ✗ Breaks at runtime in main process
import { GAMES_SCHEMA_SQL } from '@shared/database/schema.js'

// ✓ Correct — relative path survives tsc
import { GAMES_SCHEMA_SQL } from '../../shared/database/schema.js'
```

**Why relative paths work identically in source and output:** `rootDir` is `src/` and `outDir` is `dist-electron/`, so the directory layout under `src/` is mirrored exactly under `dist-electron/`. Any relative path correct in source is also correct after compilation.

### "File is not under rootDir" (TS6059) — Preload Build

`tsc` reports this when a file outside `rootDir` is pulled into the compilation. This happens even through `import type` — type-only imports still trigger file resolution.

**How it manifests here:** `preload.ts` → `import type { ... } from './ipc/types.js'` → `types.ts` re-exports from `src/shared/`. The transitive chain pulls `shared/` into the preload compilation.

**Solution (already applied):**
1. Preload `rootDir` set to `..` (= `src/`) so it covers both `src/main/` and `src/shared/`
2. Preload uses a **separate** `outDir` (`dist-electron/preload/`) — otherwise its CJS output would overwrite the main build's ESM `shared/` files
3. Main tsconfig excludes `preload.ts` to avoid compiling it as ESM

**Rule of thumb:** If a tsconfig pulls in files from multiple subdirectories (even transitively via `import type`), `rootDir` must be their common ancestor. If two tsconfigs compile the same source files with different module systems, they **must** use different `outDir`s.
