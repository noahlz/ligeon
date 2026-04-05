# Architecture

## Design Notes

**No Global State Store** — State lives in `App.tsx` via `useState` + custom hooks. Props flow down, callbacks flow up. This is intentional; avoid Redux/Zustand unless the prop tree becomes unmaintainable.

**Factory Functions Over Classes** — Move managers (`createChessManager`, `createVariationManager`) use closures instead of ES6 classes. Maintain this pattern; do not refactor to classes.

**Electron Preload Isolation** — The preload script runs in a separate context (CJS) and cannot import from the renderer (ESM). Type definitions may be duplicated; keep them synchronized manually when changing IPC APIs.

**IPC Event Aggregation** — Progress updates aggregate multiple events into one callback with explicit unsubscribe. This pattern is intentional; don't bypass it with direct `ipcRenderer.on()` in the renderer.

**Hooks Never Touch SQLite Directly** — Renderer hooks call `window.electron.*` for all data access. No direct SQLite or IPC imports in hooks or components.
