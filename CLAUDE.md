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

Export from each subdirectory via `index.ts` barrel.

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
      ui/              # shadcn/ui primitives (copied, not imported — see Styling)
    hooks/             # Custom React hooks
    lib/               # Shared utilities (cn helper)
    styles/            # CSS + Tailwind
    types/             # electron.ts (IPC API ambient types)
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
| `src/renderer/types/electron.ts` | IPC API ambient type definitions |
| `src/renderer/App.tsx` | Root layout + state |
| `src/renderer/components/BoardDisplay.tsx` | Chessground board |
| `src/renderer/components/GameListSidebar.tsx` | Search, filter, game list |
| `src/renderer/components/MoveNavigation.tsx` | Nav buttons + keyboard shortcuts |
| `src/renderer/utils/chessManager.ts` | Move parsing, FEN, ply navigation |
| `src/renderer/utils/audioManager.ts` | Move sounds |
| `src/renderer/utils/dateConverter.ts` | Timestamp ↔ display |

### LSP First, Glob/Grep Second

Use LSP tools: `goToDefinition`, `findReferences`, `documentSymbol`, `incomingCalls`/`outgoingCalls`, `hover`. Fall back to Glob/Grep for text, comments, config values.

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
| Mouse wheel | Prev/next move (only over board or move list) |

## Styling

**[shadcn/ui](https://ui.shadcn.com):** Dialogs and buttons use shadcn/ui components in `components/ui/` — **copy-pasted source code**, not npm imports. Add components via `npx shadcn@latest add <name>`. Config: `components.json`. Keep `ui/` customizations minimal; compose around them in app components.

**Colors** — `tailwind.config.ts` + `styles/index.css`:
- App: `ui-bg-page` → `ui-bg-box` → `ui-bg-element` → `ui-bg-hover`; `ui-text` → `ui-text-dim` → `ui-text-dimmer`; `ui-accent` (orange)
- shadcn: CSS variables (`--color-background`, `--color-primary`, `--color-destructive`, etc.) in `index.css` — used by `ui/` components

**Layout:** Flex only (no absolute positioning). Left spacer width = ControlStrip width. Board + MoveNavigation = flex-col.

**Chessground:** Use `.board-coords-wrapper` for coord padding. Coords: `.cg-wrap coords.ranks/files`. Flip: `data-orientation="black"`.

## Gotchas

**Update this section after non-trivial fixes.**

### `.js` Extension in All Imports

ESM requires `.js` extension even for `.ts` source. `src/main/` = `.ts` source only; `.js` output → `dist-electron/`.

### Import Paths by Context

Use relative paths to `shared/` (all targets: renderer, main, tests, CLI). No `@shared` alias. Use `@/` for renderer-internal imports only.

`../` depth = file's distance from `src/shared/`:

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

### Database Main-Process Only

SQLite unavailable in renderer. DB access: renderer → `window.electron.fn()` → preload → `src/main/ipc/` handler → return.

### Validate IPC Inputs

Validate all IPC handler inputs before use. See `src/main/ipc/validators.ts`. Follow patterns in `gameHandlers.ts` or `importHandlers.ts`.

### TypeScript Configs

| Config | Module | outDir | Constraints |
|--------|--------|--------|-------------|
| `src/main/tsconfig.json` | ESM | `dist-electron/` | Excludes `preload.ts` |
| `src/main/tsconfig.preload.json` | **CJS** | `dist-electron/preload/` | `rootDir=src/` — covers `shared/` pulled in via `import type` chains |
| `src/renderer/tsconfig.json` | ESM | `dist/` | — |

- Preload = CJS (Electron sandbox forbids ESM).
- Preload = separate `outDir` (else CJS output overwrites main's ESM `shared/`).
- Multi-subdir config → `rootDir` = common ancestor  
- Different module systems → different `outDir`s.

### Rebuild better-sqlite3

`npm test` auto-rebuilds for Node.js. Manual:
- `npm run rebuild:sqlite` (tests)
- `npm run rebuild:electron` (app)

If rebuild succeeds but fails at runtime: `rm -rf node_modules/better-sqlite3/build` and retry.

### Ignore DevTools Warnings

`Request Autofill.enable/setAddresses failed` — harmless in `npm run app`.

### Knip False Positives

`npm run knip` reports expected "unused exports" from shadcn/ui components (`components/ui/**`). These are library components designed to export comprehensive APIs even when not all exports are used. Do not remove these exports. See `knip.json` for configured ignores:
- `electron.ts` marked as entry point (ambient type declarations, no explicit imports)
- `tailwindcss` ignored (peer dependency of `@tailwindcss/vite`)