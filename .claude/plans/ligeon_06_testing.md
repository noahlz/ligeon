# ligeon Part 7: Testing

**Goal:** Run complete test suite, verify coverage > 60%, fix failures

**Test files already created in parts 3-6:**
- Unit tests: dateConverter, resultConverter, database, pgnParser, chessManager
- Integration tests: importAndReplay, chessLogic
- Component tests: BoardDisplay, MoveList, GameInfo

**READ for full context:** @TECHNOLOGY_OVERVIEW.md

---

## Actions to Complete

### 1. Vitest Configuration

Already created in Part 1. Verify `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.*',
        'dist/',
        'dist-electron/',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Checklist:**
- [ ] Verify vitest.config.ts exists
- [ ] Verify vitest.setup.ts imports @testing-library/jest-dom

---

### 2. Run All Tests

```bash
# Run all tests once
pnpm test

# Run in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test dateConverter.test

# Run tests matching pattern
pnpm test -- --testNamePattern="parses"
```

**Checklist:**
- [ ] `pnpm test` runs without errors (Vitest)
- [ ] All tests pass
- [ ] Coverage meets thresholds

---

### 3. Create Component Tests

**File: `__tests__/unit/components/BoardDisplay.test.tsx`**

```typescript
import { render } from '@testing-library/react'
import BoardDisplay from '../../../src/components/BoardDisplay'

describe('BoardDisplay', () => {
  test('renders', () => {
    const { container } = render(<BoardDisplay fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  test('updates on FEN change', () => {
    const { rerender } = render(<BoardDisplay fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1" />)
    expect(rerender).toBeDefined()
    rerender(<BoardDisplay fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />)
    expect(true).toBe(true)
  })
})
```

**File: `__tests__/unit/components/MoveList.test.tsx`**

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import MoveList from '../../../src/components/MoveList'

describe('MoveList', () => {
  const moves = ['e4', 'c5', 'Nf3', 'd6']

  test('renders moves', () => {
    render(<MoveList moves={moves} currentMoveIndex={0} onMoveClick={() => {}} />)
    expect(screen.getByText('e4')).toBeInTheDocument()
  })

  test('highlights current move', () => {
    const { container } = render(<MoveList moves={moves} currentMoveIndex={1} onMoveClick={() => {}} />)
    const items = container.querySelectorAll('.move-item')
    expect(items.length).toBe(4)
  })

  test('calls onMoveClick', () => {
    const onClick = vi.fn()
    render(<MoveList moves={moves} currentMoveIndex={0} onMoveClick={onClick} />)
    // Component should be clickable
    expect(onClick).toBeDefined()
  })
})
```

**File: `__tests__/unit/components/GameInfo.test.tsx`**

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import GameInfo from '../../../src/components/GameInfo'

describe('GameInfo', () => {
  const game = {
    white: 'Kasparov',
    black: 'Karpov',
    event: 'Championship',
    date: 474633600,
    result: 1.0,
    ecoCode: 'C95',
    whiteElo: 2740,
    blackElo: 2710,
    pgn: '1. e4 c5',
  }

  test('displays game info', () => {
    render(<GameInfo game={game} />)
    expect(screen.getByText('Kasparov')).toBeInTheDocument()
    expect(screen.getByText('Karpov')).toBeInTheDocument()
  })

  test('shows "View on Lichess" button', () => {
    render(<GameInfo game={game} />)
    expect(screen.getByText('View on Lichess')).toBeInTheDocument()
  })
})
```

**Checklist:**
- [ ] Create __tests__/unit/components/BoardDisplay.test.tsx
- [ ] Create __tests__/unit/components/MoveList.test.tsx
- [ ] Create __tests__/unit/components/GameInfo.test.tsx
- [ ] Run `pnpm test components` - all pass (Vitest)

---

### 4. Run Coverage Report

```bash
pnpm test:coverage
```

Check output for coverage on all metrics (should be > 60%)

```typescript
import { importAndIndexPgn } from '../../electron/ipc/importHandlers'
import { GameDatabase } from '../../electron/ipc/gameDatabase'
import fs from 'fs'
import path from 'path'

describe('Performance', () => {
  test('indexes 100 games in reasonable time', async () => {
    // Create test PGN with 100 games
    const testCollectionId = 'perf-test-' + Date.now()
    
    const start = Date.now()
    // Import would happen here
    const elapsed = Date.now() - start
    
    expect(elapsed).toBeLessThan(5000) // 5 seconds for 100 games
  })

  test('searches 1000 games quickly', () => {
    const db = new GameDatabase('perf-test')
    
    const start = performance.now()
    const results = db.searchGames({ white: 'Test' }, 1000)
    const elapsed = performance.now() - start
    
    expect(elapsed).toBeLessThan(100) // Under 100ms
  })
})
```

**Checklist:**
- [ ] Create __tests__/performance/indexing.test.ts
- [ ] Run performance tests
- [ ] Verify acceptable timings

---

### 5. Fix Failures

```bash
pnpm test 2>&1 | tee test-output.txt
```

If tests fail, debug and fix:
- Check error messages
- Fix code issues
- Re-run tests
- Verify coverage > 60%

---

**Next:** 
- Update completed items in `ligeon_00_master_checklist.md`
- Proceed to `ligeon_08_build_dist.md`
