# Architecture

## Project Structure

```
__tests__/             # Unit and integration tests (Vitest)
public/sounds/         # Audio files for move/capture/check sounds
resources/             # Static assets (icons, sample PGNs)
scripts/               # CLI utilities

src/
  main/                # Electron main process (Node.js only, .ts source)
    config/            # App paths, logger config, settings persistence
    ipc/               # IPC event handlers for game operations, validation

  renderer/            # React UI layer (Chessground board, move list, etc.)
    components/        # React components, no business logic
      display/         # Pure display components (no IPC, no state)
      runtime/         # Stateful/interactive components (game UI, dialogs)
      settings/        # Settings UI components
      ui/              # shadcn/ui primitives (bundled, not node_modules)
    data/              # Static JSON (openings database)
    hooks/             # Custom React hooks managing state and effects
      ipc/             # Hooks that call window.electron.* IPC methods
    lib/               # Helper functions (cn() for Tailwind)
    styles/            # CSS + Tailwind config
    types/             # TypeScript interfaces (IPC API, enums, type defs)
    utils/             # Pure utility functions with unit tests — NO React deps

  shared/              # Code used by main + renderer + CLI scripts
    converters/        # Format conversion (date, result, etc.)
    database/          # Schema definitions
    pgn/               # PGN parsing and game data extraction
    types/             # Shared TypeScript interfaces
```

## Import Path Conventions

- **`shared/`**: Always use relative paths (no `@shared` alias). Available to main, renderer, and CLI scripts.
- **`@/`**: Renderer-only alias for `src/renderer/` — use for imports within renderer (e.g. UI components).
- **renderer/utils/**: Import directly from file; no barrel (e.g. `'../utils/formatters.js'`).
- **shared/** subdirs: Import from directory (barrel re-exports in `index.ts`).

## Barrel Exports

`src/shared/` uses `index.ts` barrels — import from the directory.  
**`src/renderer/utils/` has NO barrel** — import directly from the individual file.

## Business Logic Extraction Rule

**Pure function with no React dependencies → extract to `renderer/utils/` and add a unit test.**  
**Logic that reads/mutates React state → stays in hooks or components.**

Before adding a utility, scan `renderer/utils/` for existing files that logically own the concept (e.g. board math → `boardUtils.ts`, string formatting → `formatters.ts`, move indexing → `moveFormatter.ts`). Do not create a new file when an existing one fits.

## Core Abstractions

**Move Navigation**: Three factory functions manage board state:
- **`NavigableManager`** interface — unified API for position-sequence navigation
- **`ChessManager`** — read-only mainline game replay
- **`VariationManager`** — mutable variation exploration (branch into alternatives)

Used by hooks (`useGameNavigation`, `useBoardState`, `useVariationState`) to drive the board UI.

## Chess Logic Library

**ChessOps** is the single source of truth for move validation, FEN parsing, and legal move generation. Do not hand-parse positions or validate moves — delegate to ChessOps. This ensures consistency across the app and prevents subtle rule bugs.

## Design Notes

**No Global State Store** — State lives in `App.tsx` via `useState` + custom hooks. Props flow down, callbacks flow up. This is intentional; avoid Redux/Zustand unless the prop tree becomes unmaintainable.

**Factory Functions Over Classes** — Move managers (`createChessManager`, `createVariationManager`) use closures instead of ES6 classes. Maintain this pattern; do not refactor to classes.

**Electron Preload Isolation** — The preload script runs in a separate context (CJS) and cannot import from the renderer (ESM). Type definitions may be duplicated; keep them synchronized manually when changing IPC APIs.

**IPC Event Aggregation** — Progress updates aggregate multiple events into one callback with explicit unsubscribe. This pattern is intentional; don't bypass it with direct `ipcRenderer.on()` in the renderer.
