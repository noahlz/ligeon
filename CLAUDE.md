# ligeon - LLM Development Guide

**Tech Stack:** Electron, React 18, Tailwind CSS, SQLite, chess.js, Chessground
**For details:** See `@.claude/plans/TECHNOLOGY_OVERVIEW.md`

---

## Build & Test: Silent Output Mode

All build and test commands produce **zero console output on success**. All output is logged to `.logs/` (gitignored, auto-cleaned).

### Log Files

```
.logs/
├── build-vite.log       # React/Tailwind bundling (Vite)
├── build-electron.log   # Electron packager (electron-builder)
├── test-unit.log        # Jest unit tests
└── test-integration.log # Jest integration tests
```

### Core Commands

```bash
npm run clean              # Remove all build outputs (dist, dist-electron, .logs, coverage, compiled JS)
npm run build              # Full build: clean, bundle React, package Electron
npm run build:vite         # React bundling only
npm run build:electron     # Electron packaging only
npm run build:mac          # macOS DMG installer
npm run build:win          # Windows NSIS/portable installer

npm test                   # Run all tests (unit + integration)
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:watch         # Watch mode (shows output—for development)
npm run test:coverage      # Coverage report (silent, outputs to coverage/)

npm run dev                # Start dev server + Electron window
```

### Handling Build/Test Failures

When a command fails (non-zero exit code), extract only the relevant error lines:

**Vite build errors:**
```bash
grep -iE "(error|✘)" .logs/build-vite.log | head -20
```

**Electron build errors:**
```bash
grep -E "(error|Error|ERROR|✖|⨯)" .logs/build-electron.log | head -20
```

**Jest test failures:**
```bash
grep -E "(FAIL|●|Error:|Expected|Received)" .logs/test-unit.log | head -30
```

Full logs available: `cat .logs/filename.log`

### Configuration Details

| File | Key Setting | Purpose |
|------|-------------|---------|
| `package.json` | Scripts redirect to `.logs/` with `> .logs/name.log 2>&1` | Silent output redirection |
| `vite.config.js` | `reportCompressedSize: false` | Suppresses Vite's build summary |
| `jest.config.js` | `verbose: false` | Suppresses Jest's test name listing |
| `.gitignore` | Includes `.logs/` | Prevents log files from being committed |

### Error Extraction Helper

**`scripts/extract-errors.sh`** - Reusable script for extracting tool-specific errors:

```bash
npm run build || ./scripts/extract-errors.sh .logs/build-vite.log "error|✘"
npm run test || ./scripts/extract-errors.sh .logs/test-unit.log "FAIL|●|Error:"
```

---

## Project Structure

- `src/` - React components, utilities, styles
- `electron/` - Main process, IPC handlers
- `electron/ipc/` - Database, game handlers, import logic
- `__tests__/` - Unit tests, integration tests, component tests
- `resources/` - Icons, sample games
- `public/` - Static assets, HTML entry point

See master checklist: `@.claude/plans/ligeon_00_master_checklist.md`
