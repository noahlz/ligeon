# ligeon Part 5.2: React Components - Main App

**Goal:** Create App.jsx that orchestrates all components and manages state

---

## Actions to Complete

### 1. Create src/App.jsx

```javascript
import React, { useEffect, useRef, useState } from 'react'
import BoardDisplay from './components/BoardDisplay'
import MoveList from './components/MoveList'
import MoveNavigation from './components/MoveNavigation'
import GameInfo from './components/GameInfo'
import GameListSidebar from './components/GameListSidebar'
import CollectionSelector from './components/CollectionSelector'
import ImportDialog from './components/ImportDialog'
import ChessManager from './utils/chessManager'
import { audioManager } from './utils/audioManager'

export default function App() {
  const [collections, setCollections] = useState([])
  const [selectedCollectionId, setSelectedCollectionId] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [moveIndex, setMoveIndex] = useState(0)
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const chessManagerRef = useRef(new ChessManager())

  // Initialize audio on first click
  useEffect(() => {
    const initAudio = () => {
      audioManager.initialize()
      document.removeEventListener('click', initAudio)
    }
    document.addEventListener('click', initAudio)
    return () => document.removeEventListener('click', initAudio)
  }, [])

  // Load collections on mount
  useEffect(() => {
    const loadCollections = async () => {
      const cols = await window.electron.listCollections()
      setCollections(cols)
      if (cols.length > 0 && !selectedCollectionId) {
        setSelectedCollectionId(cols[0].id)
      }
    }

    loadCollections()
  }, [])

  // Helper: detect capture move
  const detectCapture = (beforeFen, afterFen) => {
    const pieceBefore = beforeFen.split(' ')[0].replace(/[/0-8]/g, '').length
    const pieceAfter = afterFen.split(' ')[0].replace(/[/0-8]/g, '').length
    return pieceBefore > pieceAfter
  }

  // Helper: detect castling move
  const detectCastling = (beforeFen, afterFen) => {
    const beforeKing = beforeFen.split(' ')[0].indexOf('K')
    const afterKing = afterFen.split(' ')[0].indexOf('K')
    return Math.abs(beforeKing - afterKing) === 2
  }

  // Move handlers with sound
  const handleStart = () => {
    chessManagerRef.current.goToStart()
    setMoveIndex(0)
    setFen(chessManagerRef.current.getCurrentFEN())
  }

  const handlePrev = () => {
    if (moveIndex > 0) {
      chessManagerRef.current.prevMove()
      setMoveIndex(moveIndex - 1)
      setFen(chessManagerRef.current.getCurrentFEN())
      audioManager.playMove()
    }
  }

  const handleNext = () => {
    if (selectedGame && moveIndex < selectedGame.moves.length) {
      const beforeFen = chessManagerRef.current.getCurrentFEN()
      chessManagerRef.current.nextMove()
      setMoveIndex(moveIndex + 1)
      setFen(chessManagerRef.current.getCurrentFEN())

      const afterFen = chessManagerRef.current.getCurrentFEN()
      if (detectCastling(beforeFen, afterFen)) {
        audioManager.playCastling()
      } else if (detectCapture(beforeFen, afterFen)) {
        audioManager.playCapture()
      } else {
        audioManager.playMove()
      }
    }
  }

  const handleEnd = () => {
    if (selectedGame) {
      chessManagerRef.current.goToEnd()
      setMoveIndex(selectedGame.moves.length)
      setFen(chessManagerRef.current.getCurrentFEN())
    }
  }

  const handleMoveClick = (index) => {
    chessManagerRef.current.goToMove(index)
    setMoveIndex(index)
    setFen(chessManagerRef.current.getCurrentFEN())
    audioManager.playMove()
  }

  // Game selection
  const handleSelectGame = async (game) => {
    setSelectedGame(null)
    const fullGame = await window.electron.getGameMoves(selectedCollectionId, game.id)
    if (fullGame) {
      chessManagerRef.current.loadGame(fullGame.moves)
      setSelectedGame(fullGame)
      setMoveIndex(0)
      setFen(chessManagerRef.current.getCurrentFEN())
    }
  }

  // Collection operations
  const handleRenameCollection = async (collectionId, newName) => {
    await window.electron.renameCollection(collectionId, newName)
    const updated = collections.map(c => c.id === collectionId ? { ...c, name: newName } : c)
    setCollections(updated)
  }

  const handleDeleteCollection = async (collectionId) => {
    if (window.confirm('Delete this collection?')) {
      await window.electron.deleteCollection(collectionId)
      const filtered = collections.filter(c => c.id !== collectionId)
      setCollections(filtered)
      if (selectedCollectionId === collectionId) {
        setSelectedCollectionId(filtered[0]?.id || null)
      }
    }
  }

  const handleImportComplete = async () => {
    setShowImportDialog(false)
    const updated = await window.electron.listCollections()
    setCollections(updated)
    if (updated.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(updated[0].id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">ligeon</h1>
        <div className="flex gap-2">
          <CollectionSelector collections={collections} selectedId={selectedCollectionId} onSelect={setSelectedCollectionId} onImport={() => setShowImportDialog(true)} />
          <button onClick={() => setShowImportDialog(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded">
            Import New
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Board and Info */}
        <div className="flex flex-col gap-4">
          <BoardDisplay fen={fen} />
          {selectedGame && <GameInfo game={selectedGame} />}
        </div>

        {/* Move List and Game List */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Move List */}
          {selectedGame && (
            <div className="flex flex-col gap-2 bg-slate-700 rounded p-4 flex-1 min-h-0">
              <p className="text-sm font-bold text-gray-400">Move List</p>
              <MoveList moves={selectedGame.moves} currentMoveIndex={moveIndex} onMoveClick={handleMoveClick} />
              <MoveNavigation moveIndex={moveIndex} totalMoves={selectedGame.moves.length} onStart={handleStart} onPrev={handlePrev} onNext={handleNext} onEnd={handleEnd} />
            </div>
          )}

          {/* Game List */}
          {selectedCollectionId && (
            <div className="bg-slate-700 rounded p-4 flex-1 min-h-0">
              <p className="text-sm font-bold text-gray-400 mb-2">Games</p>
              <GameListSidebar collectionId={selectedCollectionId} onGameSelect={handleSelectGame} />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ImportDialog isOpen={showImportDialog} onComplete={handleImportComplete} />
    </div>
  )
}
```

**Checklist:**
- [ ] Create src/App.jsx
- [ ] Verify all imports work
- [ ] Test: npm run dev starts

---

### 2. Test App

```bash
npm run dev
```

Expected: App starts, collections load, all components render

**User flow:**
1. App starts → collections load
2. Select collection → games list
3. Click game → board shows, move list displays
4. Use ⏮ ◀ ▶ ⏭ or keyboard → navigate moves
5. Click play → speed menu → auto-play works
6. Sounds play (move/capture/castling)
7. "View on Lichess" sends full PGN

**Summary:** App.jsx created with full state management and user interaction

**Next:** Proceed to ligeon_06_chess_logic.md