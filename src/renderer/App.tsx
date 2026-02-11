import { useState, useEffect } from 'react'
import { ChessKnight } from 'lucide-react'
import BoardDisplay from './components/BoardDisplay.js'
import MoveList from './components/MoveList.js'
import MoveNavigation from './components/MoveNavigation.js'
import GameInfo from './components/GameInfo.js'
import GameListSidebar from './components/GameListSidebar.js'
import ImportDialog from './components/ImportDialog.js'
import ControlStrip from './components/ControlStrip.js'
import PanelHandle from './components/PanelHandle.js'
import { TooltipProvider } from '@/components/ui/tooltip.js'
import { createChessManager, type ChessManager } from './utils/chessManager.js'
import { useAutoPlay } from './hooks/useAutoPlay.js'
import { useAudioInit } from './hooks/useAudioInit.js'
import { useBoardState } from './hooks/useBoardState.js'
import { useGameNavigation } from './hooks/useGameNavigation.js'
import { useGameMoves } from './hooks/useGameMoves.js'
import { useSidelineState } from './hooks/useSidelineState.js'
import type { GameRow, GameSearchResult } from '../shared/types/game.js'
import type { Key } from '@lichess-org/chessground/types'

interface Collection {
  id: string
  name: string
}

export default function App() {
  // Collections state
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFilePath, setImportFilePath] = useState<string | null>(null)

  // Game state
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null)
  const [selectedGameCollectionId, setSelectedGameCollectionId] = useState<string | null>(null)
  const [chessManager, setChessManager] = useState<ChessManager | null>(null)

  // Audio & sound
  const [soundEnabled, setSoundEnabled] = useState(true)
  const { audioInitialized } = useAudioInit()

  // Board orientation
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')

  // Panel collapse state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  // Board state & navigation
  const { fen, currentPly, lastMove, updateBoardState } = useBoardState({
    soundEnabled,
    audioInitialized,
  })

  const { handleFirst, handlePrev, handleNext, handleLast, handleJump } = useGameNavigation({
    chessManager,
    currentPly,
    updateBoardState,
  })

  // Move list parsing
  const { moves, result } = useGameMoves({ movesString: selectedGame?.moves })

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

  // Handle game selection
  const handleGameSelect = async (game: GameSearchResult) => {
    if (!selectedCollectionId) return

    // Fetch full game data with moves
    const fullGame = await window.electron.getGameMoves(selectedCollectionId, game.id)
    if (!fullGame) return

    setSelectedGame(fullGame)
    setSelectedGameCollectionId(selectedCollectionId)

    const manager = createChessManager(fullGame.moves)
    setChessManager(manager)

    // Reset to initial position
    updateBoardState(manager, 0)

    // Load sidelines for this game
    sidelineState.loadSidelines(selectedCollectionId, game.id)
  }

  // Auto-play hook
  const autoPlay = useAutoPlay({
    onAdvance: handleNext,
    currentPly,
    maxPly: chessManager?.getTotalPlies() || 0,
  })

  // Sideline state
  const sidelineState = useSidelineState({
    chessManager,
    collectionId: selectedGameCollectionId,
    gameId: selectedGame?.id ?? null,
    currentPly,
    updateBoardState,
    autoPlayStop: autoPlay.stop,
  })

  // Compute interactive board values — sideline overrides mainline.
  // When exploring a sideline, the board must show legal moves for the sideline position,
  // not the mainline position (different FENs = different legal moves).
  const boardDests = (sidelineState.isInSideline
    ? sidelineState.dests
    : chessManager?.getDests() ?? new Map()) as Map<Key, Key[]>

  const boardTurnColor = sidelineState.isInSideline
    ? sidelineState.turnColor
    : chessManager?.getTurnColor() ?? 'white'

  const handleTogglePlay = () => {
    if (autoPlay.isPlaying) {
      autoPlay.stop()
    } else {
      autoPlay.start()
    }
  }

  const handleSpeedChange = (speed: number) => {
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
  const handleImportComplete = async (collectionId: string) => {
    setShowImportDialog(false)
    setImportFilePath(null)
    // Reload collections
    const cols = await window.electron.listCollections()
    setCollections(cols)
    // Switch to the newly imported collection
    setSelectedCollectionId(collectionId)
    // Note: selectedGame state is intentionally NOT cleared
    // This allows the user to keep viewing the current game
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

  return (
    <TooltipProvider>
      <div className="h-screen bg-ui-bg-page text-ui-text flex flex-col">
        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div
            className={`${leftPanelOpen ? 'w-72' : 'w-0 overflow-hidden'} bg-ui-bg-box border-r border-ui-border p-2 overflow-y-auto transition-all duration-200`}
          >
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
              selectedGameCollectionId={selectedGameCollectionId}
            />
          </div>

          {/* Left panel handle */}
          <PanelHandle
            side="left"
            isOpen={leftPanelOpen}
            onToggle={() => setLeftPanelOpen(prev => !prev)}
          />

          {/* Center: Board area with control strip */}
          <div className="flex-1 flex flex-row items-start justify-center px-2 pt-10 pb-4 gap-2">
            {selectedGame && chessManager ? (
              <>
                {/* Board and Navigation wrapper */}
                <div className="flex flex-col items-center w-[min(64rem,calc(100vh-8rem))]">
                  {/* Board */}
                  <div className="w-full aspect-square board-coords-wrapper">
                    <BoardDisplay
                      key={selectedGame?.id}
                      fen={fen}
                      lastMove={lastMove}
                      orientation={boardOrientation}
                      check={chessManager.getMoveType(currentPly) === 'check' ? (currentPly % 2 === 1 ? 'black' : 'white') : false}
                      dests={boardDests}
                      turnColor={boardTurnColor}
                      onMove={sidelineState.handleUserMove}
                    />
                  </div>

                  {/* Navigation (below board) */}
                  {/* Route keyboard/button nav to whichever manager is active (sideline or mainline). */}
                  <div className="mt-2">
                    <MoveNavigation
                      onFirst={sidelineState.isInSideline ? sidelineState.sidelineNav.first : handleFirst}
                      onPrev={sidelineState.isInSideline ? sidelineState.sidelineNav.prev : handlePrev}
                      onNext={sidelineState.isInSideline ? sidelineState.sidelineNav.next : () => handleNext()}
                      onLast={sidelineState.isInSideline ? sidelineState.sidelineNav.last : handleLast}
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
                  game={selectedGame}
                  fen={fen}
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

          {/* Right panel handle */}
          <PanelHandle
            side="right"
            isOpen={rightPanelOpen}
            onToggle={() => setRightPanelOpen(prev => !prev)}
          />

          {/* Right panel: Game info and move list */}
          <div
            className={`${rightPanelOpen ? 'w-80' : 'w-0 overflow-hidden'} bg-ui-bg-box border-l border-ui-border p-2 flex flex-col gap-2 overflow-y-auto transition-all duration-200`}
            data-testid="move-list-panel"
          >
            {selectedGame ? (
              <>
                <GameInfo game={selectedGame} />
                {moves.length > 0 && (
                  <MoveList
                    moves={moves}
                    result={result}
                    currentPly={currentPly}
                    onJump={(ply) => {
                      // Clicking a mainline move exits sideline first to return navigation to mainline.
                      if (sidelineState.isInSideline) sidelineState.exitSideline()
                      handleJump(ply)
                    }}
                    sidelines={sidelineState.sidelines}
                    activeSidelineBranchPly={sidelineState.activeBranchPly}
                    sidelineMoves={sidelineState.sidelineMoves}
                    sidelinePly={sidelineState.sidelinePly}
                    onSidelineJump={sidelineState.sidelineNav.jump}
                    onDismissSideline={sidelineState.dismissSideline}
                    isInSideline={sidelineState.isInSideline}
                  />
                )}
              </>
            ) : (
              <div className="group relative flex flex-col gap-2 h-full">
                {/* Centered hint overlay — visible on hover */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm text-ui-text-dimmer bg-ui-bg-box/80 px-3 py-1.5 rounded-md">
                    Select a game to view moves.
                  </span>
                </div>

                {/* Skeleton GameInfo header */}
                <div className="bg-ui-bg-element rounded-sm p-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-ui-bg-hover rounded-sm w-48 animate-pulse" />
                    <div className="h-5 w-5 bg-ui-bg-hover rounded-sm ml-auto" />
                  </div>
                  <div className="h-3 bg-ui-bg-hover rounded-sm w-36 mt-1.5 animate-pulse" />
                </div>

                {/* Skeleton MoveList */}
                <div className="bg-ui-bg-element rounded-sm p-2 flex-1 font-mono min-h-0">
                  <div className="space-y-0.5">
                    {[...Array(30)].map((_, i) => (
                      <div key={i} className="grid gap-2 py-0.5" style={{ gridTemplateColumns: '2rem 1fr 1fr' }}>
                        <div className="h-5 w-5 bg-ui-bg-hover rounded-sm animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
                        <div className="h-5 bg-ui-bg-hover rounded-sm animate-pulse" style={{ width: `${40 + (i * 7) % 35}%`, animationDelay: `${i * 50 + 25}ms` }} />
                        <div className="h-5 bg-ui-bg-hover rounded-sm animate-pulse" style={{ width: `${35 + (i * 11) % 40}%`, animationDelay: `${i * 50 + 50}ms` }} />
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
    </TooltipProvider>
  )
}
