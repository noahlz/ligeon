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
 *   - React components      — see NOTE below
 *   - React hooks           — see NOTE below
 */
export const coverageExcludes: string[] = [
  // Vitest defaults (kept explicit for clarity)
  'node_modules/',
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

  // ===========================================================================
  // FUTURE: React Testing Library
  // ===========================================================================
  // All React components and hooks below are excluded because Vitest alone
  // cannot meaningfully test React component behaviour (rendering, events,
  // state transitions, DOM output). The right tool is React Testing Library
  // (+ @testing-library/user-event), which integrates with Vitest via
  // @testing-library/react.
  //
  // When RTL is set up, remove these exclusions and add test files under:
  //   __tests__/components/   for src/renderer/components/**
  //   __tests__/hooks/        for src/renderer/hooks/**
  //
  // Priority order once RTL is available:
  //   1. useGameNavigation, useBoardState  — core navigation logic
  //   2. useGameMoves, useGameControls     — game loading and playback
  //   3. MoveList, MoveCell               — most complex UI components
  //   4. GameListSidebar                  — filtering + selection
  //   5. useVariationState, useCommentState, useAnnotationState
  //   6. Remaining components
  // ===========================================================================
  'src/renderer/App.tsx',        // root React component — same RTL story as components/
  'src/renderer/components/**',
  'src/renderer/hooks/**',
]
