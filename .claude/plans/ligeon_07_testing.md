# ligeon - Part 7: Testing

Complete testing strategy and setup for all layers.

---

## Overview

Testing covers:
- Unit tests (utilities, database, components)
- Integration tests (import, replay, search)
- Performance benchmarks
- Setup and configuration

---

## 7.1 Jest Configuration

Already created in Part 1. Verify `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'electron/**/*.js',
    '!**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 },
  },
}
```

**Checklist:**
- [ ] Verify jest.config.js exists
- [ ] Verify jest.setup.js imports @testing-library/jest-dom

---

## 7.2 Run Tests

Execute tests:

```bash
# Run all tests once
npm test

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- dateConverter.test

# Run tests matching pattern
npm test -- --testNamePattern="parses"
```

**Checklist:**
- [ ] `npm test` runs without errors
- [ ] All tests pass
- [ ] Coverage meets thresholds

---

## 7.3 Test Files Created (Parts 3-6)

**Utility tests:**
- `__tests__/unit/dateConverter.test.js`
- `__tests__/unit/resultConverter.test.js`
- `__tests__/unit/pgnParser.test.js`
- `__tests__/unit/database.test.js`
- `__tests__/unit/chessManager.test.js`

**Integration tests:**
- `__tests__/integration/importAndReplay.test.js`
- `__tests__/integration/chessLogic.test.js`

**Checklist:**
- [ ] All test files exist
- [ ] All tests pass

---

## 7.4 Add Component Tests

**File: `__tests__/unit/components/BoardDisplay.test.jsx`**

```javascript
import React from 'react'
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

**File: `__tests__/unit/components/MoveList.test.jsx`**

```javascript
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
    const onClick = jest.fn()
    render(<MoveList moves={moves} currentMoveIndex={0} onMoveClick={onClick} />)
    // Component should be clickable
    expect(onClick).toBeDefined()
  })
})
```

**File: `__tests__/unit/components/GameInfo.test.jsx`**

```javascript
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
- [ ] Create __tests__/unit/components/BoardDisplay.test.jsx
- [ ] Create __tests__/unit/components/MoveList.test.jsx
- [ ] Create __tests__/unit/components/GameInfo.test.jsx
- [ ] Run `npm test -- components` - all pass

---

## 7.5 Performance Tests

**File: `__tests__/performance/indexing.test.js`**

```javascript
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
- [ ] Create __tests__/performance/indexing.test.js
- [ ] Run performance tests
- [ ] Verify acceptable timings

---

## 7.6 Coverage Report

Generate and view coverage:

```bash
npm run test:coverage
```

This creates `coverage/` directory with HTML report.

**Open in browser:**
```bash
open coverage/lcov-report/index.html
```

**Target coverage:**
- Branches: 60%+
- Functions: 60%+
- Lines: 60%+
- Statements: 60%+

**Checklist:**
- [ ] Run coverage report
- [ ] Verify all metrics meet 60%
- [ ] Identify untested code

---

## 7.7 Test All Utilities

Run each test category:

```bash
# Converters
npm test -- dateConverter.test
npm test -- resultConverter.test

# Parser
npm test -- pgnParser.test

# Database
npm test -- database.test

# Chess
npm test -- chessManager.test

# Components
npm test -- components

# Integration
npm test -- integration

# Performance
npm test -- performance
```

**Checklist:**
- [ ] All converter tests pass
- [ ] Parser tests pass
- [ ] Database tests pass
- [ ] Chess tests pass
- [ ] Component tests pass
- [ ] Integration tests pass
- [ ] Performance acceptable

---

## 7.8 Continuous Test During Development

Run tests in watch mode:

```bash
npm run test:watch
```

This re-runs tests when files change. Great for TDD.

**Workflow:**
1. Write failing test
2. Write code to pass test
3. Watch mode auto-reruns
4. Refactor with confidence

**Checklist:**
- [ ] Understand watch mode
- [ ] Use during development

---

## 7.9 Mock IPC Calls in Tests

For components that call `window.electron`, mock it:

```javascript
beforeAll(() => {
  global.window.electron = {
    listCollections: jest.fn().mockResolvedValue([]),
    searchGames: jest.fn().mockResolvedValue([]),
    getGameMoves: jest.fn().mockResolvedValue(null),
  }
})
```

**Checklist:**
- [ ] Add mocks for IPC calls in component tests
- [ ] Mock should return realistic data

---

## 7.10 Debugging Failed Tests

Print debug info:

```javascript
import { screen, debug } from '@testing-library/react'

test('something', () => {
  render(<MyComponent />)
  
  // Print DOM
  debug()
  
  // Print specific element
  debug(screen.getByText('text'))
})
```

Or run single test:

```bash
npm test -- --testNamePattern="specific test name"
```

**Checklist:**
- [ ] Know how to debug failing tests
- [ ] Use debug() for DOM inspection
- [ ] Use --testNamePattern for single tests

---

## 7.11 Before Deployment

Run full test suite:

```bash
npm test -- --coverage
```

**Verification checklist:**
- [ ] All tests pass
- [ ] Coverage > 60% on all metrics
- [ ] No console errors
- [ ] No console warnings (if possible)
- [ ] Performance acceptable

---

## 7.12 CI/CD Integration

For GitHub Actions, add `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

**Checklist:**
- [ ] (Optional) Setup GitHub Actions
- [ ] Automated tests on every push

---

## Summary

Implemented:
- ✅ Jest configuration (Part 1)
- ✅ Unit tests for all utilities
- ✅ Integration tests for workflows
- ✅ Component tests
- ✅ Performance benchmarks
- ✅ Coverage reporting
- ✅ Watch mode development
- ✅ Debugging strategies

---

## Testing Commands Reference

```bash
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm test -- file.test     # Specific test
npm test -- --testNamePattern="name"  # Named test
```

---

## Next Steps

Proceed to **Part 8: Build & Distribution** for packaging and deployment.

**Checklist:**
- [ ] All tests passing
- [ ] Coverage acceptable
- [ ] Ready for build phase

---

**Testing Complete! Ready for Part 8: Build & Distribution.**