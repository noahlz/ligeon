# Architecture

## Design Notes

**No Global State** — State in `App.tsx` via `useState` + custom hooks. Props down, callbacks up. Avoid Redux/Zustand unless the prop tree becomes unmaintainable.

**Factory Functions, Not Classes** — `createChessManager`, `createVariationManager` use closures. Don't refactor to classes.

**Preload Isolation** — Preload is CJS, renderer is ESM; can't import across. Duplicate type definitions must stay in sync manually when changing IPC APIs.

**IPC Event Aggregation** — Progress updates aggregate multiple events into one callback with explicit unsubscribe. Don't bypass with direct `ipcRenderer.on()` in the renderer.

**Hooks Never Touch SQLite Directly** — Renderer hooks call `window.electron.*` for all data access. No direct SQLite or IPC imports in hooks or components.