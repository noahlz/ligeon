# Ligeon

Electron.js desktop app for chess game viewing (PGN). Pre-release — move fast, break things.

Links: 
- [chessops](https://github.com/niklasf/chessops) (move logic)
- [chessground](https://github.com/lichess-org/chessground) (board UI)
- [chessground config](https://raw.githubusercontent.com/lichess-org/chessground/refs/heads/master/src/config.ts) (display options ref).

## Commands

```bash
npm run clean            # Delete dist, dist-electron, out
npm run build            # Compile renderer + main
npm run typecheck        # Type-check
npm test                 # Run tests (auto-rebuilds better-sqlite3)
npm run test:coverage    # Tests + coverage
npm run app              # Dev server + Electron
npm run package          # Build + package → out/
```

## After Changes

1. `npm test`
2. `npm run typecheck`
3. `npm run app` — window opens, console shows "✓ IPC handlers set up"

## Architecture

Three compilation targets share `src/shared/`:

```
src/main/*.ts + src/shared/*.ts  →  tsc (ESM)  →  dist-electron/main/     # Node.js: lifecycle, SQLite, IPC
src/main/preload.ts              →  tsc (CJS)  →  dist-electron/preload/  # Sandboxed bridge: window.electron.*
src/renderer/*.tsx               →  Vite       →  dist/                   # React UI, calls window.electron.*
```

**Dev:** Vite on `localhost:5173`  
**Prod:** Electron loads `dist/index.html`

## Project Structure

Each subdirectory exports via an `index.ts` barrel.

```
__tests__/             # Vitest: integration/, performance/, unit/
public/sounds/         # Audio
resources/             # Icons, sample PGNs
scripts/               # CLI tools
src/
  main/                # Node.js only — .ts source, no .js
    config/            # paths, logger, settings
    ipc/               # handlers, validators, types
  renderer/            # React + Chessground
    components/        # UI components (see Component Map)
    hooks/             # Custom React hooks
    styles/            # CSS + Tailwind
    types/             # electron.d.ts (IPC API types)
    utils/             # chessManager, audioManager, dateConverter
  shared/              # Single source for main + renderer + CLI
    converters/        # resultConverter
    database/          # schema
    pgn/               # gameExtractor
    types/             # GameData interface
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/shared/types/game.ts` | `GameData` interface |
| `src/shared/pgn/gameExtractor.ts` | PGN → GameData |
| `src/shared/database/schema.ts` | SQLite schema |
| `src/shared/converters/resultConverter.ts` | Result numeric ↔ display |
| `src/main/config/paths.ts` | Centralized paths |
| `src/main/ipc/gameDatabase.ts` | `DatabaseManager` singleton |
| `src/main/ipc/validators.ts` | IPC input validation |
| `src/main/ipc/importHandlers.ts` | PGN import orchestration |
| `src/main/preload.ts` | `window.electron.*` bridge |
| `src/renderer/types/electron.d.ts` | IPC API type definitions |
| `src/renderer/App.tsx` | Root layout + state |
| `src/renderer/components/BoardDisplay.tsx` | Chessground board |
| `src/renderer/components/GameListSidebar.tsx` | Search, filter, game list |
| `src/renderer/components/MoveNavigation.tsx` | Nav buttons + keyboard shortcuts |
| `src/renderer/utils/chessManager.ts` | Move parsing, FEN, ply navigation |
| `src/renderer/utils/audioManager.ts` | Move sounds |
| `src/renderer/utils/dateConverter.ts` | Timestamp ↔ display |

### Prefer LSP Over Text Search

Use LSP first: `goToDefinition`, `findReferences`, `documentSymbol`, `incomingCalls`/`outgoingCalls`, `hover`. Fall back to Glob/Grep for text, comments, config values.

## UI Layout

```
┌─────────────────┬─────────────────────────────────┬─────────────────────┐
│ Left (w-72)     │Center (flex-1)                  │ Right (w-80)        │
├─────────────────┼─────────────────────────────────┼─────────────────────┤
│ CollectionSel.  │[spacer] BoardDisplay [CtrlStrip]│ GameInfo            │
│ GameListSidebar │        MoveNavigation           │ MoveList            │
│ ImportDialog    │                                 │                     │
│ ConfirmDialog   │                                 │                     │
└─────────────────┴─────────────────────────────────┴─────────────────────┘
```

| Component | File | Responsibility |
|-----------|------|----------------|
| CollectionSelector | `components/CollectionSelector.tsx` | Collection dropdown + rename/delete |
| GameListSidebar | `components/GameListSidebar.tsx` | Filter panel (search, result radio) + game list |
| BoardDisplay | `components/BoardDisplay.tsx` | Chessground board + coords |
| MoveNavigation | `components/MoveNavigation.tsx` | Nav buttons + keyboard shortcuts |
| ControlStrip | `components/ControlStrip.tsx` | Lichess link, sound toggle, flip |
| GameInfo | `components/GameInfo.tsx` | Collapsible game header |
| MoveList | `components/MoveList.tsx` | Scrollable move grid |
| ImportDialog | `components/ImportDialog.tsx` | PGN import |
| ConfirmDialog | `components/ConfirmDialog.tsx` | Delete confirmation |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / next move |
| `Home` / `End` | First / last position |
| `Space` | Toggle auto-play |
| Mouse wheel | Prev/next move (not over sidebar or move list) |

## Styling

**Colors** (`tailwind.config.ts` + `styles/index.css`):
- Backgrounds: `ui-bg-page` → `ui-bg-box` → `ui-bg-element` → `ui-bg-hover`
- Text: `ui-text` → `ui-text-dim` → `ui-text-dimmer`
- `ui-accent` — orange (current move, active button)

**Layout:** Flex only — no absolute positioning. Left spacer matches ControlStrip width for centering. Board + MoveNavigation in flex-col.

**Chessground:** `.board-coords-wrapper` for coord padding. Coords via `.cg-wrap coords.ranks/files`. Flip via `data-orientation="black"`.

## Gotchas

**Update this section after non-trivial fixes.**

### Use `.js` in All Imports

ESM requires `.js` extension even for `.ts` source. `src/main/` contains only `.ts` — compiled `.js` output goes to `dist-electron/`.

### Import Paths by Context

Use relative paths to `shared/` everywhere — renderer, main, tests, and CLI all do this. No `@shared` alias. (`@/` is used for renderer-internal imports only, e.g. `ImportDialog.tsx`.)

Depth of `../` depends on the file's location relative to `src/shared/`:

```typescript
// Renderer root (src/renderer/*.tsx):
import type { GameRow } from '../shared/types/game.js'

// Renderer components (src/renderer/components/*.tsx):
import { resultNumericToDisplay } from '../../shared/converters/resultConverter.js'

// Main IPC (src/main/ipc/*.ts):
import { extractGameData } from '../../shared/pgn/gameExtractor.js'

// Main IPC utils (src/main/ipc/utils/*.ts):
export * from '../../../shared/converters/resultConverter.js'

// CLI scripts (scripts/*.ts):
import { extractGameData, GAMES_SCHEMA_SQL, type GameData } from '../src/shared/index.js'
```

### Database is Main-Process Only

SQLite unavailable in renderer. All DB access via IPC: renderer → `window.electron.fn()` → preload → `src/main/ipc/` handler → return.

### Validate All IPC Inputs

Every IPC handler must validate inputs before use. See `src/main/ipc/validators.ts` for available functions; follow the pattern in `gameHandlers.ts` or `importHandlers.ts`.

### TypeScript Configs

| Config | Module | outDir | Constraints |
|--------|--------|--------|-------------|
| `src/main/tsconfig.json` | ESM | `dist-electron/` | Excludes `preload.ts` |
| `src/main/tsconfig.preload.json` | **CJS** | `dist-electron/preload/` | `rootDir=src/` — covers `shared/` pulled in via `import type` chains |
| `src/renderer/tsconfig.json` | ESM | `dist/` | — |

- Preload **must** use CJS — Electron sandbox forbids ESM.
- Preload needs a separate `outDir` — its CJS output would overwrite main's ESM `shared/` files otherwise.
- Rule: if a config pulls in files from multiple subdirs (even via `import type`), `rootDir` must be their common ancestor. Configs sharing source files with different module systems must have different `outDir`s.

### Rebuild better-sqlite3

`npm test` auto-rebuilds for Node.js. Manual rebuilds:
- `npm run rebuild:sqlite` — Node.js (tests)
- `npm run rebuild:electron` — Electron (app)

If rebuild appears to succeed but fails at runtime: `rm -rf node_modules/better-sqlite3/build` then retry.

### Ignore DevTools Warnings

`Request Autofill.enable/setAddresses failed` — harmless in `npm run app`.