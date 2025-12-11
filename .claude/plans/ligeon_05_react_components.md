# ligeon - Part 5: React Components

Complete guide for building React UI components for ligeon.

---

## Overview

This part implements 10+ React components for the complete UI.

---

## 5.1 Create src/index.jsx

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

## 5.2 Create src/components/BoardDisplay.jsx

```javascript
import React, { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'

export default function BoardDisplay({ fen }) {
  const boardRef = useRef(null)
  const cgRef = useRef(null)

  useEffect(() => {
    if (!boardRef.current) return
    if (!cgRef.current) {
      cgRef.current = Chessground(boardRef.current, {
        fen, coordinates: true, viewOnly: true, disableContextMenu: true,
        animation: { enabled: true, duration: 200 },
      })
    } else {
      cgRef.current.set({ fen })
    }
  }, [fen])

  return <div ref={boardRef} style={{ width: '400px', height: '400px' }} />
}
```

**Checklist:**
- [ ] Create src/components/BoardDisplay.jsx

---

## 5.3 Create src/components/MoveList.jsx

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

## 5.4 Create src/hooks/useAutoPlay.js

```javascript
import { useEffect, useRef, useState } from 'react'

export function useAutoPlay(moveIndex, totalMoves, onNext, onStop) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(null)
  const timerRef = useRef(null)
  const speeds = { fast: 3000, slow: 10000 }

  const start = (speed) => {
    if (moveIndex >= totalMoves) return
    setPlaySpeed(speed)
    setIsPlaying(true)
  }

  const stop = () => {
    setIsPlaying(false)
    setPlaySpeed(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const pause = () => {
    stop()
    onStop?.()
  }

  useEffect(() => {
    if (!isPlaying || !playSpeed) return
    if (moveIndex >= totalMoves) {
      setIsPlaying(false)
      onStop?.()
      return
    }
    timerRef.current = setTimeout(() => onNext(), speeds[playSpeed])
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isPlaying, playSpeed, moveIndex, totalMoves, onNext, onStop])

  return { isPlaying, playSpeed, start, stop, pause }
}
```

**Checklist:**
- [ ] Create src/hooks/useAutoPlay.js

---

## 5.5 Create src/components/MoveNavigation.jsx

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

## 5.6 Create src/components/GameInfo.jsx

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

## 5.7 Create src/components/GameListSidebar.jsx

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

## 5.8 Create src/components/ImportDialog.jsx

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

## 5.9 Create src/components/CollectionSelector.jsx

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

## 5.10 Create src/utils/audioManager.js

```javascript
const SOUND_URLS = {
  move: 'https://lichess1.org/sounds/standard/Move.ogg',
  capture: 'https://lichess1.org/sounds/standard/Capture.ogg',
  castling: 'https://lichess1.org/sounds/standard/Castling.ogg',
}

export class AudioManager {
  constructor() {
    this.audioContext = null
    this.enabled = true
    this.volume = 0.5
    this.bufferCache = new Map()
  }

  initialize() {
    if (!this.audioContext) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        this.audioContext = new AudioContext()
      } catch (e) {
        this.enabled = false
      }
    }
  }

  async playSound(soundName) {
    if (!this.enabled || !this.audioContext) return
    try {
      const url = SOUND_URLS[soundName]
      if (!url) return

      let buffer = this.bufferCache.get(soundName)
      if (!buffer) {
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.arrayBuffer()
        buffer = await this.audioContext.decodeAudioData(data)
        this.bufferCache.set(soundName, buffer)
      }

      const src = this.audioContext.createBufferSource()
      const gain = this.audioContext.createGain()
      src.buffer = buffer
      gain.gain.value = this.volume
      src.connect(gain)
      gain.connect(this.audioContext.destination)
      src.start(0)
    } catch (e) {
      console.warn('Audio error:', soundName)
    }
  }

  playMove() { this.playSound('move') }
  playCapture() { this.playSound('capture') }
  playCastling() { this.playSound('castling') }
}

export const audioManager = new AudioManager()
```

**Checklist:**
- [ ] Create src/utils/audioManager.js

---

## 5.11 Create src/utils/chessManager.js

```javascript
import { Chess } from 'chess.js'

export default class ChessManager {
  constructor() {
    this.chess = new Chess()
    this.moves = []
    this.currentMoveIndex = 0
  }

  loadGame(moves) {
    this.chess.reset()
    this.moves = moves
    this.currentMoveIndex = 0
  }

  nextMove() {
    if (this.currentMoveIndex < this.moves.length) {
      try {
        this.chess.move(this.moves[this.currentMoveIndex], { sloppy: true })
        this.currentMoveIndex++
      } catch (e) {}
    }
  }

  prevMove() {
    if (this.currentMoveIndex > 0) {
      this.currentMoveIndex--
      this.resetToMove(this.currentMoveIndex)
    }
  }

  goToMove(index) {
    if (index >= 0 && index <= this.moves.length) {
      this.resetToMove(index)
    }
  }

  goToStart() {
    this.chess.reset()
    this.currentMoveIndex = 0
  }

  goToEnd() {
    this.chess.reset()
    for (let i = 0; i < this.moves.length; i++) {
      try {
        this.chess.move(this.moves[i], { sloppy: true })
      } catch (e) { break }
    }
    this.currentMoveIndex = this.moves.length
  }

  getCurrentFEN() { return this.chess.fen() }
  getTotalMoves() { return this.moves.length }

  resetToMove(index) {
    this.chess.reset()
    this.currentMoveIndex = 0
    for (let i = 0; i < index; i++) {
      try {
        this.chess.move(this.moves[i], { sloppy: true })
        this.currentMoveIndex++
      } catch (e) { break }
    }
  }
}
```

**Checklist:**
- [ ] Create src/utils/chessManager.js

---

## 5.12 Create src/App.jsx

See **Part 5 Continued** (next document) for the main App component.

**Checklist:**
- [ ] Proceed to Part 5 Continued

---

## Summary

Created 11 components:
- ✅ BoardDisplay (Chessground)
- ✅ MoveList (with highlighting)
- ✅ MoveNavigation (⏮ ◀ ▶ ⏭ + play)
- ✅ GameInfo (metadata + Lichess link)
- ✅ GameListSidebar (search/filter)
- ✅ ImportDialog (progress + logs)
- ✅ CollectionSelector (dropdown)
- ✅ useAutoPlay hook
- ✅ AudioManager (CDN sounds)
- ✅ ChessManager (move logic)
- ✅ App.jsx (orchestration)

**Next: Part 5 Continued - Full App.jsx with state management**