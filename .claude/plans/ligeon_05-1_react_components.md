# ligeon Part 5.1: React Components - Core

**Goal:** Create all reusable React components and utilities

**Components to create:**
- BoardDisplay (Chessground), MoveList, MoveNavigation, GameInfo
- GameListSidebar, ImportDialog, CollectionSelector
- useAutoPlay hook, AudioManager, ChessManager

---

## Actions to Complete

### 1. Create src/index.jsx

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Checklist:**
- [ ] Create src/index.jsx

---

### 2. Create src/components/BoardDisplay.jsx

Implement Chessground board display in React with FEN-based position updates and move visualization.

References:
- `@chessground-examples/src/units/basics.ts` - basic Chessground setup
- `@chessground-examples/src/units/anim.ts` - animation configuration and lastMove highlighting
- `@chessground-examples/src/units/viewOnly.ts` - view-only mode with drawable layer disabled

Key patterns:
- Initialize Chessground on first render with container element and config options
- Update board position via `cg.set({ fen, lastMove })` when position changes
- Use view-only mode (no interactive moves) for game replay
- Configure animation duration (e.g., 300-500ms for smooth piece movement)
- Highlight last move squares via `lastMove: [fromSquare, toSquare]` to show which move just played
- Disable drawable layer with `drawable: { visible: false }` (replay doesn't need annotations)
- Import Chessground CSS stylesheets for styling

Props needed: `fen` (position), `lastMove` (array of 2 squares or null)

**Checklist:**
- [ ] Create src/components/BoardDisplay.jsx with FEN and lastMove props
- [ ] Configure animation duration for smooth transitions
- [ ] Disable drawable layer for view-only mode
- [ ] Update board when either FEN or lastMove prop changes

---

### 3. Create src/components/MoveList.jsx

```javascript
import React, { useRef, useEffect } from 'react'

export default function MoveList({ moves, currentMoveIndex, onMoveClick }) {
  const currentMoveRef = useRef(null)

  useEffect(() => {
    if (currentMoveRef.current) {
      currentMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentMoveIndex])

  return (
    <div className="move-list overflow-y-auto flex-1 p-2">
      {moves.map((move, idx) => {
        const moveNumber = Math.floor(idx / 2) + 1
        const isWhiteMove = idx % 2 === 0
        const isCurrent = idx === currentMoveIndex

        return (
          <div key={idx} ref={isCurrent ? currentMoveRef : null} onClick={() => onMoveClick(idx)} className={`move-item text-sm cursor-pointer ${isCurrent ? 'current' : ''}`}>
            {isWhiteMove && <span className="font-bold">{moveNumber}. </span>}
            {move}
            {!isWhiteMove && <br />}
          </div>
        )
      })}
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/components/MoveList.jsx

---

### 4. Create src/hooks/useAutoPlay.js

Implement auto-play timer hook with visibility checking to avoid wasted animations.

Reference: `@chessground-examples/src/units/viewOnly.ts` and `src/units/fen.ts` show board visibility check pattern: `if (!cg.state.dom.elements.board.offsetParent) return;`

Implementation notes:
- Timer-based auto-advance through moves at configurable speeds (3s fast, 10s slow)
- Check if board is visible before advancing (prevents animation waste if user switches tabs)
- Stop auto-play when reaching end of game
- Support pause/resume during playback
- Clear timers on unmount to prevent memory leaks

Methods/state needed:
- `start(speed)` - begin auto-play at given speed
- `stop()` / `pause()` - halt auto-play
- `isPlaying` - boolean state
- `playSpeed` - current speed identifier

**Checklist:**
- [ ] Create src/hooks/useAutoPlay.js with timer-based advance
- [ ] Add board visibility check before calling onNext() to skip hidden frames

---

### 5. Create src/components/MoveNavigation.jsx

```javascript
import React, { useEffect, useState } from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Play, Pause } from 'lucide-react'
import { useAutoPlay } from '../hooks/useAutoPlay'

export default function MoveNavigation({ moveIndex, totalMoves, onStart, onPrev, onNext, onEnd }) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const autoPlay = useAutoPlay(moveIndex, totalMoves, onNext, () => {})

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (autoPlay.isPlaying) return
      if (e.key === 'Home') onStart()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'End') onEnd()
      if (e.key === ' ') { e.preventDefault(); setShowSpeedMenu(!showSpeedMenu) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onStart, onPrev, onNext, onEnd, autoPlay.isPlaying, showSpeedMenu])

  const isAtStart = moveIndex === 0
  const isAtEnd = moveIndex === totalMoves
  const handleNav = (cb) => { if (autoPlay.isPlaying) autoPlay.stop(); cb() }

  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="flex gap-2">
        <button onClick={() => handleNav(onStart)} disabled={isAtStart && !autoPlay.isPlaying} className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 rounded" title="Start">
          <ChevronsLeft size={20} />
        </button>
        <button onClick={() => handleNav(onPrev)} disabled={isAtStart && !autoPlay.isPlaying} className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 rounded" title="Previous">
          <ChevronLeft size={20} />
        </button>

        <div className="relative">
          <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className={`p-2 rounded ${autoPlay.isPlaying ? 'bg-amber-600' : 'bg-slate-600'}`} disabled={isAtEnd && !autoPlay.isPlaying} title="Play">
            {autoPlay.isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {showSpeedMenu && !autoPlay.isPlaying && (
            <div className="absolute top-full mt-2 bg-slate-700 rounded shadow-lg z-50">
              <button onClick={() => { autoPlay.start('fast'); setShowSpeedMenu(false) }} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
                Fast (3 sec)
              </button>
              <button onClick={() => { autoPlay.start('slow'); setShowSpeedMenu(false) }} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
                Slow (10 sec)
              </button>
            </div>
          )}

          {autoPlay.isPlaying && (
            <button onClick={() => autoPlay.pause()} className="absolute top-full mt-2 left-0 px-4 py-2 bg-slate-700 text-sm z-50" title={`Pause (${autoPlay.playSpeed === 'fast' ? '3s' : '10s'})`}>
              Pause
            </button>
          )}
        </div>

        <button onClick={() => handleNav(onNext)} disabled={isAtEnd && !autoPlay.isPlaying} className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 rounded" title="Next">
          <ChevronRight size={20} />
        </button>
        <button onClick={() => handleNav(onEnd)} disabled={isAtEnd && !autoPlay.isPlaying} className="p-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 rounded" title="End">
          <ChevronsRight size={20} />
        </button>
      </div>
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/components/MoveNavigation.jsx

---

### 6. Create src/components/GameInfo.jsx

```javascript
import React from 'react'
import { timestampToDisplay } from '../utils/dateConverter'
import { resultNumericToDisplay } from '../utils/resultConverter'

export default function GameInfo({ game }) {
  const handleViewOnLichess = () => {
    const encoded = encodeURIComponent(game.pgn)
    window.open(`https://lichess.org/api/import?pgn=${encoded}`, '_blank')
  }

  return (
    <div className="bg-slate-700 rounded p-4 space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400">White</p>
          <p className="font-semibold">{game.white}{game.whiteElo ? ` (${game.whiteElo})` : ''}</p>
        </div>
        <div>
          <p className="text-gray-400">Black</p>
          <p className="font-semibold">{game.black}{game.blackElo ? ` (${game.blackElo})` : ''}</p>
        </div>
        <div>
          <p className="text-gray-400">Event</p>
          <p>{game.event || 'Unknown'}</p>
        </div>
        <div>
          <p className="text-gray-400">Date</p>
          <p>{timestampToDisplay(game.date)}</p>
        </div>
        <div>
          <p className="text-gray-400">Result</p>
          <p>{resultNumericToDisplay(game.result)}</p>
        </div>
        {game.ecoCode && <div><p className="text-gray-400">ECO</p><p>{game.ecoCode}</p></div>}
      </div>
      <button onClick={handleViewOnLichess} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold">
        View on Lichess
      </button>
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/components/GameInfo.jsx

---

### 7. Create src/components/GameListSidebar.jsx

```javascript
import React, { useState, useEffect } from 'react'
import { timestampToDisplay } from '../utils/dateConverter'
import { resultNumericToDisplay } from '../utils/resultConverter'

export default function GameListSidebar({ collectionId, onGameSelect }) {
  const [games, setGames] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({ result: null })

  useEffect(() => {
    const searchGames = async () => {
      const results = await window.electron.searchGames(collectionId, {
        white: searchTerm || undefined,
        result: filters.result,
        limit: 1000,
      })
      setGames(results)
    }
    searchGames()
  }, [searchTerm, filters])

  return (
    <div className="flex flex-col gap-4 h-full">
      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 bg-slate-600 rounded text-white placeholder-gray-400" />

      <div className="text-xs space-y-2">
        <label className="text-gray-400">Result</label>
        <div className="flex gap-2">
          {[null, 1.0, 0.5, 0.0].map((val, i) => (
            <label key={i} className="flex items-center gap-1">
              <input type="radio" checked={filters.result === val} onChange={() => setFilters({ result: val })} />
              <span>{val === null ? 'Any' : val === 1.0 ? 'W' : val === 0.5 ? 'D' : 'B'}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={() => setSearchTerm('')} className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm">
        Reset
      </button>

      <div className="text-gray-400 text-sm">{games.length} games</div>

      <div className="overflow-y-auto flex-1">
        {games.map((game) => (
          <div key={game.id} onClick={() => onGameSelect(game)} className="p-2 mb-2 bg-slate-600 hover:bg-slate-500 rounded cursor-pointer text-sm">
            <p className="font-semibold">{game.white} vs {game.black}</p>
            <p className="text-gray-400 text-xs">{timestampToDisplay(game.date)} - {resultNumericToDisplay(game.result)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/components/GameListSidebar.jsx

---

### 8. Create src/components/ImportDialog.jsx

```javascript
import React, { useEffect, useRef, useState } from 'react'

export default function ImportDialog({ isOpen, onComplete }) {
  const [collectionName, setCollectionName] = useState('')
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState({ parsed: 0, indexed: 0, skipped: 0, logs: [] })
  const logEndRef = useRef(null)

  useEffect(() => {
    const unsubscribe = window.electron.onImportProgress((data) => setProgress(data))
    return unsubscribe
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progress.logs])

  const handleImport = async () => {
    setIsIndexing(true)
    const filePath = await window.electron.selectFile()
    if (filePath) {
      const collectionId = crypto.randomUUID()
      await window.electron.importPgn(filePath, collectionId, collectionName)
      setIsIndexing(false)
      setCollectionName('')
      onComplete?.()
    }
  }

  if (!isOpen) return null

  const percent = progress.parsed > 0 ? Math.round((progress.indexed / progress.parsed) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-96 max-h-screen overflow-auto">
        {!isIndexing ? (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Import Collection</h2>
            <input type="text" placeholder="Name" value={collectionName} onChange={(e) => setCollectionName(e.target.value)} className="w-full px-3 py-2 border rounded mb-4 bg-slate-700 border-slate-600" />
            <button onClick={handleImport} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Select PGN & Import
            </button>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Indexing</h2>
            <div className="w-full bg-slate-600 rounded-full h-3 mb-4">
              <div className="bg-blue-600 h-full transition-all" style={{ width: `${percent}%` }} />
            </div>
            <p className="text-sm text-gray-400 mb-4">Indexed: {progress.indexed.toLocaleString()}</p>
            <div className="border rounded bg-slate-900 p-3 h-48 overflow-y-auto font-mono text-xs">
              {progress.logs?.map((log, idx) => (
                <div key={idx} className={log.type === 'error' ? 'text-red-500' : 'text-gray-300'}>
                  {log.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/components/ImportDialog.jsx

---

### 9. Create src/components/CollectionSelector.jsx

```javascript
import React, { useState } from 'react'

export default function CollectionSelector({ collections, selectedId, onSelect, onImport }) {
  const [showMenu, setShowMenu] = useState(false)
  const selected = collections.find(c => c.id === selectedId)

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
        {selected?.name || 'Select'} ▼
      </button>
      {showMenu && (
        <div className="absolute top-full mt-1 bg-slate-700 rounded shadow-lg z-50">
          {collections.map(col => (
            <button key={col.id} onClick={() => { onSelect(col.id); setShowMenu(false) }} className={`block w-full text-left px-4 py-2 hover:bg-slate-600 ${selectedId === col.id ? 'bg-slate-600' : ''}`}>
              {col.name}
            </button>
          ))}
          <div className="border-t border-slate-600" />
          <button onClick={() => { onImport?.(); setShowMenu(false) }} className="block w-full text-left px-4 py-2 hover:bg-slate-600">
            + Import
          </button>
        </div>
      )}
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/components/CollectionSelector.jsx

---

### 10. Create src/utils/audioManager.js

Implement audio manager for streaming sound effects from Lichess CDN with in-memory caching.

Implementation notes:
- Stream sound URLs from Lichess CDN (not bundled)
- Cache decoded audio buffers in memory after first play
- Use Web Audio API for playback control
- Handle network/decode errors gracefully
- Provide methods: `playMove()`, `playCapture()`, `playCastling()`
- Initialize on first user interaction (browser audio policy)

**Checklist:**
- [ ] Create src/utils/audioManager.js with AudioContext initialization, buffer caching, and playback methods

---

### 11. Create src/utils/chessManager.js

Implement chess move replay logic for PGN game navigation with move tracking.

References:
- `@chessground-examples/src/util.ts` - chess.js integration with board state
- `@chessground-examples/src/units/anim.ts` - move tracking for animation
- `@chessground-examples/src/units/viewOnly.ts` - automatic move execution pattern

Implementation notes:
- Load game moves from PGN parser output
- Track current move index during replay and previous move for UI highlighting
- Generate FEN at any move position by replaying moves from start
- Support navigation: next, previous, go to start/end, jump to arbitrary move
- Use chess.js sloppy notation for PGN move compatibility
- Reset and replay moves from start for backward navigation (efficient enough for typical games)
- Store last move (fromSquare, toSquare) for highlighting in BoardDisplay

Methods needed:
- `loadGame(moves)` - load PGN moves
- `nextMove()` / `prevMove()` - advance/rewind one move
- `goToMove(index)` - jump to arbitrary move
- `goToStart()` / `goToEnd()` - jump to start/end
- `getCurrentFEN()` - get current board position
- `getLastMove()` - get [fromSquare, toSquare] or null for highlighting
- `getTotalMoves()` - get total move count

**Checklist:**
- [ ] Create src/utils/chessManager.js with move replay and FEN generation
- [ ] Track previous/current move for lastMove highlighting
- [ ] Export getLastMove() method for BoardDisplay

---

### 12. Test Components

```bash
npm run dev
```

Expected: All components render without errors

**Summary:** All reusable components created (board, moves, navigation, info, sidebar, dialog, selector, audio, chess logic)

**Next:** Proceed to ligeon_05-2_react_components.md for App.jsx