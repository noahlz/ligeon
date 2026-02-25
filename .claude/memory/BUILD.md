# Build & Compilation

## TypeScript Configs

| Config | Module | outDir | Constraints |
|--------|--------|--------|-------------|
| `src/main/tsconfig.json` | ESM | `dist-electron/` | Excludes `preload.ts` |
| `src/main/tsconfig.preload.json` | **CJS** | `dist-electron/preload/` | `rootDir=src/` |
| `src/renderer/tsconfig.json` | ESM | `dist/` | — |

Preload = CJS (Electron sandbox forbids ESM). Separate `outDir` prevents CJS output from overwriting ESM `shared/`.

## Compilation Targets

```
src/main/*.ts + src/shared/*.ts  →  tsc (ESM)  →  dist-electron/main/
src/main/preload.ts              →  tsc (CJS)  →  dist-electron/preload/
src/renderer/*.tsx               →  Vite       →  dist/
```

## Gotchas

### `.js` Extension in All Imports

ESM requires `.js` extension even for `.ts` source files.

```typescript
import { extractGameData } from './gameExtractor.js'  // correct
import { extractGameData } from './gameExtractor'      // wrong — breaks ESM
```

### Rebuild better-sqlite3

`npm test` auto-rebuilds for Node.js. Manual commands:
- `npm run rebuild:sqlite` — for tests
- `npm run rebuild:electron` — for the app

If rebuild succeeds but fails at runtime: `rm -rf node_modules/better-sqlite3/build` and retry.