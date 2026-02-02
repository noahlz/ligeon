import { useState, useEffect, useRef, useCallback } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import { ChessKnight } from 'lucide-react'
import BoardDisplay from './components/BoardDisplay.js'
import MoveList from './components/MoveList.js'
import MoveNavigation from './components/MoveNavigation.js'
import GameInfo from './components/GameInfo.js'
import GameListSidebar from './components/GameListSidebar.js'
import ImportDialog from './components/ImportDialog.js'
import ControlStrip from './components/ControlStrip.js'
import { createChessManager, type ChessManager } from './utils/chessManager.js'
import { playMoveSound, preloadAllSounds } from './utils/audioManager.js'
import { separateResultFromMoves } from './utils/moveFormatter.js'
import { useAutoPlay } from './hooks/useAutoPlay.js'

interface Collection {
  id: string
  name: string
}

interface GameSearchResult {
  id: number
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  whiteElo: number | null
  blackElo: number | null
  ecoCode: string | null
}

interface GameRow {
  id: number
  white: string
  black: string
  event: string | null
  date: number | null
  result: number
  whiteElo: number | null
  blackElo: number | null
  ecoCode: string | null
  site: string | null
  round: string | null
  moveCount: number
  moves: string
}

export default function App() {
  // Collections state
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFilePath, setImportFilePath] = useState<string | null>(null)

  // Game state
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null)
  const [chessManager, setChessManager] = useState<ChessManager | null>(null)
  const [currentPly, setCurrentPly] = useState(0)
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [lastMove, setLastMove] = useState<Key[] | undefined>(undefined)

  // Audio state
  const audioInitialized = useRef(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Board orientation
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')

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

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioInitialized.current) {
        preloadAllSounds()
        audioInitialized.current = true
      }
    }

    // Listen for any user interaction to initialize audio
    window.addEventListener('click', initAudio, { once: true })
    window.addEventListener('keydown', initAudio, { once: true })

    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
  }, [])

  // Handle game selection
  const handleGameSelect = async (game: GameSearchResult) => {
    if (!selectedCollectionId) return

    // Fetch full game data with moves
    const fullGame = await window.electron.getGameMoves(selectedCollectionId, game.id)
    if (!fullGame) return

    setSelectedGame(fullGame)

    // Create chess manager with the game's moves (filter out result notation)
    const movesArray = fullGame.moves
      .replace(/\d+\./g, '') // Remove move numbers
      .split(/\s+/)
      .filter(m => m.length > 0)
    const { gameMoves } = separateResultFromMoves(movesArray)
    const movesString = gameMoves.join(' ')
    const manager = createChessManager(movesString)
    setChessManager(manager)

    // Reset to initial position
    setCurrentPly(0)
    updateBoardState(manager, 0)
  }

  // Update board state from chess manager
  const updateBoardState = useCallback((manager: ChessManager, ply: number) => {
    manager.goto(ply)
    setFen(manager.getFen())
    const move = manager.getLastMove()
    setLastMove(move ? move as Key[] : undefined)
    setCurrentPly(ply)

    // Play sound for the move (if not at initial position and sound is enabled)
    if (ply > 0 && soundEnabled && audioInitialized.current) {
      const moveType = manager.getMoveType(ply)
      if (moveType) {
        playMoveSound(moveType)
      }
    }
  }, [soundEnabled])

  // Navigation handlers
  const handleFirst = useCallback(() => {
    if (!chessManager) return
    updateBoardState(chessManager, 0)
  }, [chessManager, updateBoardState])

  const handlePrev = useCallback(() => {
    if (!chessManager) return
    updateBoardState(chessManager, Math.max(0, currentPly - 1))
  }, [chessManager, currentPly, updateBoardState])

  const handleNext = useCallback((): boolean => {
    if (!chessManager) return false
    const totalPlies = chessManager.getTotalPlies()
    if (currentPly < totalPlies) {
      updateBoardState(chessManager, currentPly + 1)
      return true
    }
    return false
  }, [chessManager, currentPly, updateBoardState])

  const handleLast = useCallback(() => {
    if (!chessManager) return
    const totalPlies = chessManager.getTotalPlies()
    updateBoardState(chessManager, totalPlies)
  }, [chessManager, updateBoardState])

  const handleJump = useCallback((ply: number) => {
    if (!chessManager) return
    updateBoardState(chessManager, ply)
  }, [chessManager, updateBoardState])

  // Auto-play hook
  const autoPlay = useAutoPlay({
    onAdvance: handleNext,
    currentPly,
    maxPly: chessManager?.getTotalPlies() || 0,
  })

  const handleTogglePlay = () => {
    if (autoPlay.isPlaying) {
      autoPlay.stop()
    } else {
      autoPlay.start()
    }
  }

  const handleSpeedChange = (speed: 'fast' | 'slow') => {
    autoPlay.setSpeed(speed)
  }

  const handleFlipBoard = () => {
    setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')
  }

  // Handle import menu click - open file picker first
  const handleImportClick = async () => {
    const filePath = await window.electron.selectFile()
    if (filePath) {
      setImportFilePath(filePath)
      setShowImportDialog(true)
    }
  }

  // Handle import completion
  const handleImportComplete = async () => {
    setShowImportDialog(false)
    setImportFilePath(null)
    // Reload collections
    const cols = await window.electron.listCollections()
    setCollections(cols)
  }

  // Handle import dialog close (cancelled)
  const handleImportClose = () => {
    setShowImportDialog(false)
    setImportFilePath(null)
  }

  // Handle collection deletion
  const handleDeleteCollection = async (collectionId: string) => {
    await window.electron.deleteCollection(collectionId)
    // Reload collections
    const cols = await window.electron.listCollections()
    setCollections(cols)
    // Clear selection if deleted collection was selected
    if (selectedCollectionId === collectionId) {
      setSelectedCollectionId(cols.length > 0 ? cols[0].id : null)
      setSelectedGame(null)
      setChessManager(null)
    }
  }

  // Handle collection rename
  const handleRenameCollection = async () => {
    // Reload collections to get updated name
    const cols = await window.electron.listCollections()
    setCollections(cols)
  }

  // Parse moves for MoveList component
  const moves = selectedGame?.moves
    ? selectedGame.moves
        .replace(/\d+\./g, '') // Remove move numbers
        .split(/\s+/)
        .filter(m => m.length > 0)
    : []

  return (
    <div className="h-screen bg-ui-bg-page text-ui-text flex flex-col">
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-ui-bg-box border-r border-ui-border p-2 overflow-y-auto">
          <GameListSidebar
            collectionId={selectedCollectionId}
            onGameSelect={handleGameSelect}
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={setSelectedCollectionId}
            onImport={handleImportClick}
            onDeleteCollection={handleDeleteCollection}
            onRenameCollection={handleRenameCollection}
            selectedGame={selectedGame}
          />
        </div>

        {/* Center: Board area with control strip */}
        <div className="flex-1 flex flex-row items-start justify-center px-2 pt-10 pb-2 gap-2">
          {selectedGame && chessManager ? (
            <>
              {/* Left spacer (matches control strip width) */}
              <div className="flex flex-col gap-2 items-center p-1 pt-0 h-full justify-start" style={{ width: '38px' }} />

              {/* Board and Navigation wrapper */}
              <div className="flex-1 flex flex-col items-center">
                {/* Board */}
                <div className="w-full max-w-4xl aspect-square board-coords-wrapper">
                  <BoardDisplay
                    key={selectedGame?.id}
                    fen={fen}
                    lastMove={lastMove}
                    orientation={boardOrientation}
                    check={chessManager.getMoveType(currentPly) === 'check' ? (currentPly % 2 === 1 ? 'black' : 'white') : false}
                  />
                </div>

                {/* Navigation (below board) */}
                <div className="mt-4">
                  <MoveNavigation
                    onFirst={handleFirst}
                    onPrev={handlePrev}
                    onNext={() => handleNext()}
                    onLast={handleLast}
                    onTogglePlay={handleTogglePlay}
                    isPlaying={autoPlay.isPlaying}
                    speed={autoPlay.speed}
                    onSpeedChange={handleSpeedChange}
                    currentPly={currentPly}
                    totalPlies={chessManager.getTotalPlies()}
                  />
                </div>
              </div>

              {/* Control Strip */}
              <ControlStrip
                pgn={selectedGame.moves}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onFlipBoard={handleFlipBoard}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <ChessKnight size={200} className="text-ui-text-dimmer mb-4" strokeWidth={1} />
              <p className="text-lg text-ui-text-dim">Please select a game...</p>
            </div>
          )}
        </div>

        {/* Right panel: Game info and move list */}
        <div className="w-80 bg-ui-bg-box border-l border-ui-border p-2 flex flex-col gap-2 overflow-y-auto" data-testid="move-list-panel">
          {selectedGame ? (
            <>
              <GameInfo game={selectedGame} />
              {moves.length > 0 && (
                <MoveList
                  moves={moves}
                  currentPly={currentPly}
                  onJump={handleJump}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Skeleton GameInfo header */}
              <div className="bg-ui-bg-element rounded p-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-ui-bg-hover rounded flex-1" />
                  <div className="h-5 w-5 bg-ui-bg-hover rounded" />
                </div>
              </div>

              {/* Skeleton MoveList */}
              <div className="bg-ui-bg-element rounded p-2 flex-1">
                <div className="space-y-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="grid gap-2" style={{ gridTemplateColumns: 'auto 1fr 1fr' }}>
                      <div className="h-6 w-6 bg-ui-bg-hover rounded" />
                      <div className="h-6 bg-ui-bg-hover rounded" />
                      <div className="h-6 bg-ui-bg-hover rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        filePath={importFilePath}
        onComplete={handleImportComplete}
        onClose={handleImportClose}
      />
    </div>
  )
}
