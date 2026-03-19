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

## macOS Code Signing & Notarization

Signing is handled by `electron-builder` via `@electron/osx-sign`. Entitlements files are in `build/`:

- `entitlements.mac.plist` — main process
- `entitlements.mac.inherit.plist` — helper processes (Electron Framework, GPU, renderer, etc.)

Both grant the same three entitlements required for Electron apps under hardened runtime:

| Entitlement | Why |
|-------------|-----|
| `com.apple.security.cs.allow-jit` | V8 JavaScript engine requires JIT |
| `com.apple.security.cs.allow-unsigned-executable-memory` | Electron renderer process |
| `com.apple.security.cs.disable-library-validation` | Loading native modules (better-sqlite3) |

**Do not add XML comments to these plist files.** The `codesign` utility uses a strict plist parser that rejects XML comments and fails with `cannot read entitlement data`.

Notarization uses App Store Connect API key auth (not Apple ID + password). Required GitHub secrets: `APPLE_API_KEY_CONTENT`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`, `CSC_LINK`, `CSC_KEY_PASSWORD`.