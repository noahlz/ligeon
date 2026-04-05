# Build & Compilation

## Gotchas

### `.js` Extension in All Imports

ESM requires `.js` extension even for `.ts` source files.

```typescript
import { extractGameData } from './gameExtractor.js'  // correct
import { extractGameData } from './gameExtractor'      // wrong — breaks ESM
```

### CJS Packages in ESM Main Process

`module: "NodeNext"` enforces strict ESM/CJS boundaries. CJS-only packages (no `exports`, no `type: "module"`) fail ESM `import` with "not callable" or "no call signatures" TS errors.

Use `_require` (already in `main.ts` via `createRequire`):

```typescript
const { updateElectronApp } = _require('update-electron-app') as typeof import('update-electron-app')
```

`typeof import(...)` preserves type safety.

### Rebuild better-sqlite3

`npm test` auto-rebuilds for Node.js. Manual commands:
- `npm run rebuild:sqlite` — for tests
- `npm run rebuild:electron` — for the app

If rebuild succeeds but fails at runtime: `rm -rf node_modules/better-sqlite3/build` and retry.

## macOS Code Signing & Notarization

`electron-builder` + `@electron/osx-sign`. Entitlements in `resources/` (tracked; `build/` is gitignored):

- `resources/entitlements.mac.plist` — main process
- `resources/entitlements.mac.inherit.plist` — helper processes (Electron Framework, GPU, renderer, etc.)

| Entitlement | Why |
|-------------|-----|
| `com.apple.security.cs.allow-jit` | V8 requires JIT |
| `com.apple.security.cs.allow-unsigned-executable-memory` | Electron renderer |
| `com.apple.security.cs.disable-library-validation` | Native modules (better-sqlite3) |

Notarization uses App Store Connect API key auth (not Apple ID + password). Required GitHub secrets: `APPLE_API_KEY_CONTENT`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`, `CSC_LINK`, `CSC_KEY_PASSWORD`.