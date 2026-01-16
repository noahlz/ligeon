# Plan Updates Needed

Based on implementation of Phase 1 (Project Setup), the following updates are needed in the plan files:

## Key Changes From Implementation

### 1. HTML Entry Point Location
- **What Changed**: `index.html` must be at project root, not in `public/`
- **Reason**: Vite expects `index.html` at the root by default
- **Impact**: None for later phases (backend code doesn't reference this)

### 2. Electron TypeScript Compilation
- **What Changed**: Added separate `electron/tsconfig.json` and `build:electron-ts` script
- **Reason**: Main tsconfig has `noEmit: true` for type checking only
- **Impact**: Plans need to mention compiling electron code before running

### 3. Compiled Electron Files in .gitignore
- **What Changed**: Added `electron/*.js` to .gitignore
- **Reason**: TypeScript files compile to JS, which should not be committed
- **Impact**: None for implementation, just documentation

### 4. React 18 JSX Transform
- **What Changed**: Don't import `React` in files using JSX
- **Reason**: React 18's automatic JSX transform (tsconfig has `"jsx": "react-jsx"`)
- **Impact**: Update example code in plans to not import React unnecessarily

## Files Requiring Updates

### ❌ ligeon_05_react_components.md (Lines 16-29)
**Current code shows:**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
```

**Should be:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
```

**Reason**: React 18 automatic JSX transform - explicit React import not needed

---

### ❌ ligeon_06_testing.md (Line 94)
**Current code shows:**
```typescript
import React from 'react'
```

**Should be:** Remove the import entirely (or only import specific items if needed)

**Reason**: Same as above - unnecessary with React 18's JSX transform

---

### ❌ ligeon_07_build_dist.md (Lines 22-34)
**Current scripts show:**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "electron:dev": "concurrently \"pnpm dev\" \"wait-on http://localhost:5173 && electron .\"",
  "electron:build": "pnpm build && electron-builder",
  "electron:build:mac": "pnpm build && electron-builder --mac",
  "electron:build:win": "pnpm build && electron-builder --win"
}
```

**Should be:**
```json
"scripts": {
  "dev": "pnpm run build:electron-ts && concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
  "build:vite": "tsc && vite build",
  "build:electron-ts": "tsc -p electron/tsconfig.json",
  "build": "pnpm run build:vite && pnpm run build:electron-ts && electron-builder",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "typecheck": "tsc --noEmit"
}
```

**Reason**:
- Need to compile electron TypeScript before running dev server
- Separate scripts for vite build and electron compilation
- Build script needs both compilations

---

### ⚠️ ligeon_07_build_dist.md (Lines 35-69)
**Current shows**: Build config inline in package.json

**Actual implementation**: Build config is in separate `electron-builder.json` file

**Action**: Update plan to reference the existing electron-builder.json instead of showing inline config

---

## Notes for Future Phases

### Phase 2 (Electron Main Process)
- ✅ No changes needed - code already references `preload.js` correctly (compiled output)
- ✅ ES module imports look correct

### Phase 3 (Database & I/O)
- ✅ No changes needed - `.js` extensions in imports are correct for ES modules
- ✅ File paths all correct

### Phase 4 (PGN Parsing)
- ✅ No changes needed - import patterns look correct

### Phase 5 (React Components)
- ❌ Needs update: Remove unnecessary `React` imports from example code
- ✅ Component patterns look fine otherwise

### Phase 6 (Testing)
- ❌ Needs update: Test file imports should not include `React`
- ✅ Test config and patterns look fine

### Phase 7 (Build & Distribution)
- ❌ Needs update: Script names and build process
- ⚠️ Update to reference electron-builder.json file

## Summary

**High Priority Updates:**
1. Fix React import pattern in Phase 5 examples
2. Update build scripts in Phase 7 to match actual implementation
3. Add note about `build:electron-ts` requirement

**Low Priority:**
- Document that index.html is at root (already done correctly)
- Document electron/*.js in gitignore (already done)

**No Action Needed:**
- Phases 2, 3, 4 look good as-is
- Backend code patterns are correct
