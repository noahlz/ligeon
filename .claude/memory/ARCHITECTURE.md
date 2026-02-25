# Architecture

## Project Structure

```
__tests__/             # Vitest: integration/, performance/, unit/
public/sounds/         # Audio
resources/             # Icons, sample PGNs
scripts/               # CLI tools
src/
  main/                # Node.js only — .ts source, no .js
    config/            # paths, logger, settings, settingsStore
    ipc/               # handlers, validators, types, gameDatabase
  renderer/            # React + Chessground
    components/        # UI components
      ui/              # shadcn/ui primitives (copied, not imported)
    data/              # Static assets (openings.json)
    hooks/             # Custom React hooks
    lib/               # cn() helper
    styles/            # CSS + Tailwind
    types/             # electron.ts (IPC API), navigableManager.ts, moveTypes.ts
    utils/             # chessManager, variationManager, chessHelpers, audioManager, etc.
  shared/              # Single source for main + renderer + CLI
    converters/        # resultConverter, dateConverter
    database/          # schema
    pgn/               # gameExtractor
    types/             # GameData, GameRow interfaces
```

## Import Path Conventions

Use relative paths to `shared/` from all targets. No `@shared` alias. Use `@/` for renderer-internal imports only.

```typescript
// Renderer root (src/renderer/*.tsx):
import type { GameRow } from '../shared/types/game.js'

// Renderer components (src/renderer/components/*.tsx):
import { resultNumericToDisplay } from '../../shared/converters/resultConverter.js'

// Main IPC (src/main/ipc/*.ts):
import { extractGameData } from '../../shared/pgn/gameExtractor.js'
```

## Barrel Exports

Export from each subdirectory via `index.ts` barrel. Import from the directory, not the file directly (within the same target).

## Key Classes

**`NavigableManager`** — interface for position-sequence navigation; implemented by both managers below, used by navigation hooks.
**`ChessManager`** — read-only mainline replay from a PGN move string.
**`VariationManager`** — mutable variation sequences; supports interactive move-making from a branch FEN.

Consumed by hooks: `useGameNavigation`, `useBoardState`, `useVariationState`.

## PGN / FEN Parsing

Always use the ChessOps library for parsing / composing PGN and FEN strings.

## Gotchas

### No Global State Store
`App.tsx` manages all state via `useState` and custom hook composition. State flows down as props; callbacks flow up. This is intentional for the current scale.

### Managers Use Factory Functions, Not Classes
`createChessManager()` and `createVariationManager()` are factory functions returning interface objects with closure-based state. There are no ES6 classes. Do not refactor to classes without a clear reason.

### ElectronAPI Types Are Split
`ElectronAPI` interface lives in `src/renderer/types/electron.ts` and is declared on `Window`. The preload (`src/main/preload.ts`) cannot import from it (separate CJS compilation), so `ImportProgressData` is duplicated there. Keep them in sync manually.

### Preload Event Aggregation
`window.electron.onImportProgress()` aggregates three IPC events into one typed callback, returning an explicit unsubscribe function. This is not a standard Electron pattern — don't replace it with direct `ipcRenderer.on()` calls in the renderer.