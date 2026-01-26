import { useState, useEffect, useRef, useCallback } from 'react'
import type { Key } from '@lichess-org/chessground/types'
import BoardDisplay from './components/BoardDisplay.js'
import MoveList from './components/MoveList.js'
import MoveNavigation from './components/MoveNavigation.js'
import GameInfo from './components/GameInfo.js'
import GameListSidebar from './components/GameListSidebar.js'
import ImportDialog from './components/ImportDialog.js'
import { createChessManager, type ChessManager } from './utils/chessManager.js'
import { playMoveSound, preloadAllSounds } from './utils/audioManager.js'
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

  // Game state
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null)
  const [chessManager, setChessManager] = useState<ChessManager | null>(null)
  const [currentPly, setCurrentPly] = useState(0)
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [lastMove, setLastMove] = useState<Key[] | undefined>(undefined)

  // Audio initialization flag
  const audioInitialized = useRef(false)

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
    const fullGame = await window.electron.getGameMoves(selectedCollectionId, game.id.toString())
    if (!fullGame) return

    setSelectedGame(fullGame)

    // Create chess manager with the game's moves
    const manager = createChessManager(fullGame.moves)
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

    // Play sound for the move (if not at initial position)
    if (ply > 0 && audioInitialized.current) {
      const moveType = manager.getMoveType(ply)
      if (moveType) {
        playMoveSound(moveType)
      }
    }
  }, [])

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

  // Handle import completion
  const handleImportComplete = async () => {
    setShowImportDialog(false)
    // Reload collections
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
            onImport={() => setShowImportDialog(true)}
          />
        </div>

        {/* Center: Board and navigation */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {selectedGame && chessManager ? (
            <>
              {/* Board */}
              <div className="w-full max-w-2xl aspect-square mb-2">
                <BoardDisplay fen={fen} lastMove={lastMove} />
              </div>

              {/* Navigation */}
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
            </>
          ) : (
            <div className="text-ui-text-dim text-center">
              <p className="text-lg mb-2">No game selected</p>
              <p className="text-sm">Select a game from the sidebar to begin</p>
            </div>
          )}
        </div>

        {/* Right panel: Game info and move list */}
        <div className="w-80 bg-ui-bg-box border-l border-ui-border p-2 flex flex-col gap-2 overflow-y-auto">
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
            <div className="text-ui-text-dim text-sm">No game selected</div>
          )}
        </div>
      </div>

      {/* Import dialog */}
      <ImportDialog isOpen={showImportDialog} onComplete={handleImportComplete} />
    </div>
  )
}
