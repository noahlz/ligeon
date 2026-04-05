/**
 * Vitest coverage exclusions.
 *
 * Excluded categories:
 *   - node_modules, build output, test files, config files (vitest defaults)
 *   - shadcn/ui primitives  — copy-pasted vendor code, not authored here
 *   - Pure type files       — interfaces/type aliases only, no executable code
 *   - Barrel index files    — re-exports only
 *   - App entry points      — require Electron/DOM runtime to execute
 *   - Logger                — module-level side effects (creates log files on import)
 *   - Trivial wrappers      — single-line delegations with no logic to verify
 *   - Browser-only modules  — depend on HTMLAudioElement; not unit-testable without heavy mocking
 *   - Config/infrastructure — OS-specific paths and file I/O; require heavy fs mocking for low value
 *   - CLI scripts           — not part of app runtime
 *   - React display/runtime/ipc — directory names explain why; see ARCHITECTURE.md
 */
export const coverageExcludes: string[] = [
  // Vitest defaults (kept explicit for clarity)
  'node_modules/',
  '.worktrees/',
  '__tests__/',
  '*.config.*',
  'dist/',
  'dist-electron/',

  // This file itself
  'vitest.coverage.excludes.ts',

  // CLI scripts — not part of app runtime
  'scripts/**',

  // shadcn/ui primitives — copy-pasted, not authored
  'src/renderer/components/ui/**',

  // Pure type files — interfaces/type aliases only, zero executable code
  'src/renderer/types/**',
  'src/main/ipc/types.ts',
  'src/shared/types/**',

  // Barrel index files — re-exports only
  'src/**/index.ts',

  // App entry points — require Electron/DOM runtime
  'src/main/main.ts',
  'src/main/preload.ts',
  'src/renderer/index.tsx',

  // Logger — module-level side effects (creates log files on import)
  'src/main/config/logger.ts',

  // Config/infrastructure — OS-specific defaults and raw fs I/O; testing requires
  // mocking process.platform, os.homedir(), and fs — high noise, low signal
  'src/main/config/settings.ts',
  'src/main/config/settingsStore.ts',

  // Electron-coupled IPC handlers — excluded because they call Electron/fs APIs
  // that cannot be meaningfully unit-tested without a full Electron mock harness:
  //   collectionHandlers: listCollections/renameCollection/deleteCollection all
  //     directly call fs.readdirSync, fs.statSync, fs.rmSync against real paths.
  //   settingsHandlers: selectCollectionsDirectory calls dialog.showOpenDialog
  //     (Electron renderer dialog API); getSettings/updateSettings are thin
  //     wrappers over settingsStore which is already excluded above.
  'src/main/ipc/collectionHandlers.ts',
  'src/main/ipc/settingsHandlers.ts',

  // Trivial wrappers — single-line delegation, no branching logic
  'src/main/config/paths.ts',
  'src/renderer/lib/utils.ts',

  // Browser-only — depends on HTMLAudioElement, not unit-testable
  'src/renderer/utils/audioManager.ts',

  // Low-value in unit testing - delegates to other functions.
  'src/renderer/utils/errorToast.ts',

  // Root React component — no RTL test yet
  'src/renderer/App.tsx',

  // ===========================================================================
  // DIRECTORY-BASED EXCLUSIONS
  // Each directory name explains why the files in it are excluded.
  // ===========================================================================

  // Pure presentation components — props-in → JSX-out, no testable state
  'src/renderer/components/display/**',

  // Runtime-coupled components — require Chessground canvas or Electron IPC
  'src/renderer/components/runtime/**',

  // Settings panel UI — display-only settings sections
  'src/renderer/components/settings/**',

  // IPC hooks — primary job is calling window.electron.* or browser APIs;
  // testing would only assert that mocks were called
  'src/renderer/hooks/ipc/**',

  // ===========================================================================
  // INDIVIDUAL EXCLUSIONS — testable hooks/components not yet covered
  // ===========================================================================

  // Trivial useMemo wrapper over already-tested parseMoves
  'src/renderer/hooks/useGameMoves.ts',

  // Partially tested (14 tests cover core CRUD flows) but complex navigation paths
  // (enterVariation, variationNav, jumpToVariationMove, handleUserMove in-variation)
  // require multi-step setup with real FEN + VariationManager; drops coverage to 69%.
  // See __tests__/hooks/useVariationState.test.ts for existing tests.
  'src/renderer/hooks/useVariationState.ts',

  // ===========================================================================
  // STATIC SITE
  // ===========================================================================

  'site/**'
]
