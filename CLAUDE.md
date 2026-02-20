# Ligeon

Electron.js desktop app for chess game viewing (PGN). 

*Pre-release — move fast, break things.*

Stack:
- Electron
- React
- SQLite
- Tailwind
- ShadCN
- ChessGround
- ChessOps
- Build: NPM and Vite

Reference Links:
- [chessops](https://github.com/niklasf/chessops) (move logic)
- [chessground](https://github.com/lichess-org/chessground) (board UI)
- [chessground config](https://raw.githubusercontent.com/lichess-org/chessground/refs/heads/master/src/config.ts) (display options ref)

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

1. Use `getDiagnostics` to check for issues with edited files.
2. `npm test`
3. `npm run typecheck`
4. `npm run app` — window opens, console shows "✓ IPC handlers set up"

## Project Structure

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
    components/        # UI components
      ui/              # shadcn/ui primitives (copied, not imported — see Styling)
    data/              # Static assets (openings.json)
    hooks/             # Custom React hooks
    lib/               # Shared utilities (cn helper)
    styles/            # CSS + Tailwind
    types/             # electron.ts (IPC API), navigableManager.ts, moveTypes.ts
    utils/             # chessManager, variationManager, chessHelpers, audioManager
  shared/              # Single source for main + renderer + CLI
    converters/        # resultConverter
    database/          # schema
    pgn/               # gameExtractor
    types/             # GameData interface
```

## Architecture

Three compilation targets share `src/shared/`:

```
src/main/*.ts + src/shared/*.ts  →  tsc (ESM)  →  dist-electron/main/     # Node.js: lifecycle, SQLite, IPC
src/main/preload.ts              →  tsc (CJS)  →  dist-electron/preload/  # Sandboxed bridge: window.electron.*
src/renderer/*.tsx               →  Vite       →  dist/                   # React UI, calls window.electron.*
```

**Dev:** Vite on `localhost:5173` | **Prod:** Electron loads `dist/index.html`

### Variation Architecture

Two managers implement `NavigableManager`:
- **ChessManager**: read-only mainline navigation
- **VariationManager**: mutable variation sequences (branching from mainline)

Key concepts:
- `branchPly` (1-based): mainline ply the variation *replaces*, not branches from. Odd = white, even = black.
- Positions stored as FEN strings; Chess objects reconstructed on demand
- UNIQUE constraint: one variation per branch point (upsert semantics)

## UI Layout

```
┌─────────────────┬──────────────────────────────────┬────────────────────┐
│ Left (w-72)     │ Center (flex-1)                  │ Right (w-80)       │
├─────────────────┼──────────────────────────────────┼────────────────────┤
│ CollectionSel.  │[spacer] BoardDisplay [CtrlStrip] │ GameInfo           │
│ GameListSidebar │                                  │ MoveList           │
│                 │                                  │                    │
│                 │     MoveNavigationButtons        │                    │
└─────────────────┴──────────────────────────────────┴────────────────────┘
```

## Styling

**[shadcn/ui](https://ui.shadcn.com):** `components/ui/` contains copy-pasted source (not npm imports). Add via `npx shadcn@latest add <name>`. Keep `ui/` customizations minimal; compose in app components.

**Colors** — `tailwind.config.ts` + `styles/index.css`:
- App: `ui-bg-page` → `ui-bg-box` → `ui-bg-element` → `ui-bg-hover`; `ui-text` → `ui-text-dim` → `ui-text-dimmer`; `ui-accent` (orange)
- shadcn: CSS variables (`--color-background`, `--color-primary`, `--color-destructive`, etc.)

**Layout:** 
- Flex only (no absolute positioning, unless justified by a comment).
- Left spacer width = ControlStrip width.

**Chessground:** Use `.board-coords-wrapper` for coord padding. Flip: `data-orientation="black"`.

## Gotchas

**Update this section after non-trivial fixes.**

### User Barrel Imports

Export from each subdirectory via `index.ts` barrel. 

### `.js` Extension in All Imports

ESM requires `.js` extension even for `.ts` source files.

### Import Paths by Context

Use relative paths to `shared/` from all targets (renderer, main, tests, CLI). No `@shared` alias. Use `@/` for renderer-internal imports only.

```typescript
// Renderer root (src/renderer/*.tsx):
import type { GameRow } from '../shared/types/game.js'

// Renderer components (src/renderer/components/*.tsx):
import { resultNumericToDisplay } from '../../shared/converters/resultConverter.js'

// Main IPC (src/main/ipc/*.ts):
import { extractGameData } from '../../shared/pgn/gameExtractor.js'
```

### No Database Migrations (Pre-Release)

Project is pre-release, so don't bother with database schema migrations. Users will delete / re-import game collections.

### Database Main-Process Only

SQLite unavailable in renderer. Access path: renderer → `window.electron.fn()` → preload → `src/main/ipc/` handler.

### Validate IPC Inputs

Validate all IPC handler inputs. See `src/main/ipc/validators.ts` and follow patterns in existing handlers.

### TypeScript Configs

| Config | Module | outDir | Constraints |
|--------|--------|--------|-------------|
| `src/main/tsconfig.json` | ESM | `dist-electron/` | Excludes `preload.ts` |
| `src/main/tsconfig.preload.json` | **CJS** | `dist-electron/preload/` | `rootDir=src/` |
| `src/renderer/tsconfig.json` | ESM | `dist/` | — |

Preload = CJS (Electron sandbox forbids ESM). Separate `outDir` prevents CJS output from overwriting ESM `shared/`.

### Rebuild better-sqlite3

`npm test` auto-rebuilds for Node.js. Manual: `npm run rebuild:sqlite` (tests) / `npm run rebuild:electron` (app).

If rebuild succeeds but fails at runtime: `rm -rf node_modules/better-sqlite3/build` and retry.

### shadcn/ui Import Fix

`npx shadcn@latest add` generates `import { cn } from "src/renderer/lib"` — must manually fix to `"@/lib/utils.js"` after adding components.

### Ignore DevTools Warnings

`Request Autofill.enable/setAddresses failed` — harmless in `npm run app`.

### Knip False Positives

`npm run knip` reports expected "unused exports" from `components/ui/**`. Do not remove. See `knip.json`.
