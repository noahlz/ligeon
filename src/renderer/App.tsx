import { useState, useEffect, useRef, useCallback } from 'react'
import { ChessKnight } from 'lucide-react'
import BoardDisplay from './components/BoardDisplay.js'
import MoveList from './components/MoveList.js'
import MoveNavigation from './components/MoveNavigation.js'
import GameInfo from './components/GameInfo.js'
import GameListSidebar from './components/GameListSidebar.js'
import ImportDialog from './components/ImportDialog.js'
import ConfirmDialog from './components/ConfirmDialog.js'
import ControlStrip from './components/ControlStrip.js'
import PanelHandle from './components/PanelHandle.js'
import { TooltipProvider } from '@/components/ui/tooltip.js'
import { Toaster } from '@/components/ui/sonner.js'
import { showErrorToast } from './utils/errorToast.js'
import { createChessManager, type ChessManager } from './utils/chessManager.js'
import { getCheckColor } from './utils/chessHelpers.js'
import { useAutoPlay } from './hooks/useAutoPlay.js'
import { useAudioInit } from './hooks/useAudioInit.js'
import { useBoardTheme } from './hooks/useBoardTheme.js'
import { useBoardState } from './hooks/useBoardState.js'
import { useGameNavigation } from './hooks/useGameNavigation.js'
import { useGameMoves } from './hooks/useGameMoves.js'
import { useVariationState } from './hooks/useVariationState.js'
import { useCommentState } from './hooks/useCommentState.js'
import { useAnnotationState } from './hooks/useAnnotationState.js'
import { sortNagsByCategory } from './utils/nag.js'
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

  // Board theme
  const { boardTheme, handleThemeChange } = useBoardTheme()

  // Board orientation
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')

  // Panel collapse state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  // Board state & navigation
  const { fen, currentPly, lastMove, updateBoardState, boardSyncKey, forceBoardSync } = useBoardState({
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
    void loadCollections()
  // Run once on mount only — selectedCollectionId intentionally excluded to avoid
  // re-fetching collections when a game is selected within the same session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Break circular dependency between useAutoPlay and useVariationState via refs.
  // useVariationState needs autoPlay.stop; useAutoPlay needs variation ply values.
  // Refs are populated after both hooks run but before any user interaction.
  const autoPlayStopRef = useRef<() => void>(() => {})
  const autoPlayStop = useCallback(() => autoPlayStopRef.current(), [])

  // Comment state
  const commentState = useCommentState()

  // Annotation state
  const annotationState = useAnnotationState()

  // Variation state (uses stable stop ref — only called during user interactions, never during render)
  const variationState = useVariationState({
    chessManager,
    collectionId: selectedGameCollectionId,
    gameId: selectedGame?.id ?? null,
    currentPly,
    updateBoardState,
    autoPlayStop,
    forceBoardSync,
  })

  // Compute effective ply for auto-play based on active context
  const effectivePly = variationState.isInVariation ? variationState.variationPly : currentPly
  const effectiveMaxPly = variationState.isInVariation
    ? variationState.variationMaxPly
    : chessManager?.getTotalPlies() || 0

  // onAdvance routes to variation or mainline — useAutoPlay stores it in a ref internally,
  // so new function identity per render doesn't cause interval restarts.
  const autoPlay = useAutoPlay({
    onAdvance: variationState.isInVariation
      ? variationState.advanceVariation
      : () => handleNext(),
    currentPly: effectivePly,
    maxPly: effectiveMaxPly,
  })

  // Populate stop ref after useAutoPlay is initialized
  autoPlayStopRef.current = autoPlay.stop

  // Handle game selection
  const handleGameSelect = async (game: GameSearchResult) => {
    if (!selectedCollectionId) return

    // Fetch full game data with moves
    let fullGame
    try {
      fullGame = await window.electron.getGameMoves(selectedCollectionId, game.id)
    } catch (error) {
      showErrorToast('Failed to open game', error)
      return
    }
    if (!fullGame) {
      showErrorToast('Failed to open game')
      return
    }

    setSelectedGame(fullGame)
    setSelectedGameCollectionId(selectedCollectionId)

    const manager = createChessManager(fullGame.moves)
    setChessManager(manager)

    // Reset to initial position
    updateBoardState(manager, 0)

    // Load variations, comments, and annotations for this game
    try {
      await Promise.all([
        variationState.loadVariations(selectedCollectionId, game.id),
        commentState.loadComments(selectedCollectionId, game.id),
        annotationState.loadAnnotations(selectedCollectionId, game.id),
      ])
    } catch (error) {
      showErrorToast('Failed to load game data', error)
    }
  }

  // Compute interactive board values — variation overrides mainline.
  // When exploring a variation, the board must show legal moves for the variation position,
  // not the mainline position (different FENs = different legal moves).
  const boardDests = (variationState.isInVariation
    ? variationState.dests
    : chessManager?.getDests() ?? new Map()) as Map<Key, Key[]>

  const boardTurnColor = variationState.isInVariation
    ? variationState.turnColor
    : chessManager?.getTurnColor() ?? 'white'

  const boardCheckColor = variationState.isInVariation
    ? variationState.checkColor
    : (chessManager ? getCheckColor(chessManager.getMoveType(currentPly), boardTurnColor) : false)

  // Annotation badges for the board — show current ply's annotations at the destination square
  // Sorted move → position → observation; only shown on mainline (not in variations)
  const currentAnnotations = annotationState.annotationsByPly.get(currentPly) ?? []
  const boardAnnotationNags = (!variationState.isInVariation && currentAnnotations.length > 0)
    ? sortNagsByCategory(currentAnnotations.map(a => a.nag))
    : []
  const boardAnnotationSquare = boardAnnotationNags.length > 0 && lastMove && lastMove.length >= 2
    ? (lastMove[1] as string)
    : null

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
    try {
      const cols = await window.electron.listCollections()
      setCollections(cols)
      // Switch to the newly imported collection
      setSelectedCollectionId(collectionId)
      // Note: selectedGame state is intentionally NOT cleared
      // This allows the user to keep viewing the current game
    } catch (error) {
      showErrorToast('Failed to reload collections', error)
    }
  }

  // Handle import dialog close (cancelled)
  const handleImportClose = () => {
    setShowImportDialog(false)
    setImportFilePath(null)
  }

  // Handle collection deletion
  const handleDeleteCollection = async (collectionId: string) => {
    try {
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
    } catch (error) {
      showErrorToast('Failed to delete collection', error)
    }
  }

  // Handle collection rename
  const handleRenameCollection = async () => {
    // Reload collections to get updated name
    const cols = await window.electron.listCollections()
    setCollections(cols)
  }

  // Stable callback for drag-to-reorder variations.
  // Updates local state optimistically (no exitVariation side-effect) after IPC.
  const handleReorderVariations = useCallback(async (branchPly: number, orderedIds: number[]) => {
    if (!selectedGameCollectionId || !selectedGame) return
    try {
      await window.electron.reorderVariations(selectedGameCollectionId, selectedGame.id, branchPly, orderedIds)
      variationState.reorderLocalVariations(branchPly, orderedIds)
    } catch (error) {
      showErrorToast('Failed to save variation order', error)
    }
  // variationState object excluded — only its stable reorderLocalVariations method is needed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGameCollectionId, selectedGame, variationState.reorderLocalVariations])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen bg-ui-bg-page text-ui-text flex flex-col">
        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div
            className={`${leftPanelOpen ? 'w-72' : 'w-0 overflow-hidden'} bg-ui-bg-box border-r border-ui-border p-2 overflow-y-auto transition-all duration-200`}
          >
            <GameListSidebar
              collectionId={selectedCollectionId}
              onGameSelect={(game) => { void handleGameSelect(game) }}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onSelectCollection={setSelectedCollectionId}
              onImport={() => { void handleImportClick() }}
              onDeleteCollection={(id) => { void handleDeleteCollection(id) }}
              onRenameCollection={() => { void handleRenameCollection() }}
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
                      check={boardCheckColor}
                      dests={boardDests}
                      turnColor={boardTurnColor}
                      onMove={variationState.handleUserMove}
                      boardSyncKey={boardSyncKey}
                      annotationNags={boardAnnotationNags}
                      annotationSquare={boardAnnotationSquare}
                    />
                  </div>

                  {/* Navigation (below board) */}
                  {/* Route keyboard/button nav to whichever manager is active (variation or mainline). */}
                  <div className="mt-2">
                    <MoveNavigation
                      onFirst={() => { autoPlay.stop(); (variationState.isInVariation ? variationState.variationNav.first : handleFirst)() }}
                      onPrev={() => { autoPlay.stop(); (variationState.isInVariation ? variationState.variationNav.prev : handlePrev)() }}
                      onNext={() => { autoPlay.stop(); (variationState.isInVariation ? variationState.variationNav.next : handleNext)() }}
                      onLast={() => { autoPlay.stop(); (variationState.isInVariation ? variationState.variationNav.last : handleLast)() }}
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
                  comments={commentState.comments}
                  annotations={annotationState.annotations}
                  variations={variationState.variations}
                  variationComments={commentState.variationComments}
                  boardTheme={boardTheme}
                  onThemeChange={handleThemeChange}
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
            className={`${rightPanelOpen ? 'w-96' : 'w-0 overflow-hidden'} bg-ui-bg-box border-l border-ui-border p-2 flex flex-col gap-2 overflow-y-auto transition-all duration-200`}
            data-testid="move-list-panel"
          >
            {selectedGame ? (
              <>
                <GameInfo game={selectedGame} />
                {moves.length > 0 && (
                  <MoveList
                    key={selectedGame?.id}
                    moves={moves}
                    result={result}
                    currentPly={currentPly}
                    onJump={(ply) => {
                      autoPlay.stop()
                      // Clicking a mainline move exits variation first to return navigation to mainline.
                      if (variationState.isInVariation) variationState.exitVariation()
                      handleJump(ply)
                    }}
                    variations={variationState.variations}
                    activeVariationBranchPly={variationState.activeBranchPly}
                    activeVariationId={variationState.activeVariationId}
                    variationMoves={variationState.variationMoves}
                    variationPly={variationState.variationPly}
                    onVariationJump={variationState.jumpToVariationMove}
                    onDismissVariation={variationState.requestDeletion}
                    onReorderVariations={selectedGameCollectionId && selectedGame ? (branchPly, orderedIds) => { void handleReorderVariations(branchPly, orderedIds) } : undefined}
                    isInVariation={variationState.isInVariation}
                    annotationHandlers={{
                      annotations: annotationState.annotations,
                      onSetAnnotation: (ply, nag) => {
                        if (selectedGameCollectionId && selectedGame) {
                          void annotationState.setAnnotation(selectedGameCollectionId, selectedGame.id, ply, nag)
                        }
                      },
                      onRemoveAnnotation: (ply: number, nag: number) => {
                        if (selectedGameCollectionId && selectedGame) {
                          void annotationState.removeAnnotation(selectedGameCollectionId, selectedGame.id, ply, nag)
                        }
                      },
                    }}
                    commentHandlers={{
                      comments: commentState.comments,
                      editingPly: commentState.editingPly,
                      editValue: commentState.editValue,
                      onEdit: commentState.startEditing,
                      onValueChange: commentState.setEditValue,
                      onSave: selectedGameCollectionId && selectedGame
                        ? () => { void commentState.saveComment(selectedGameCollectionId, selectedGame.id) }
                        : undefined,
                      onCancel: commentState.cancelEditing,
                      onDeleteRequest: commentState.requestDeletion,
                      variationComments: commentState.variationComments,
                      onSaveVariationComment: (variationId: number, text: string) => {
                        if (selectedGameCollectionId && selectedGame) {
                          void window.electron.upsertVariationComment(
                            selectedGameCollectionId, selectedGame.id, variationId, text
                          ).then(saved => {
                            if (saved) commentState.updateVariationComment(saved)
                          }).catch((error: unknown) => {
                            showErrorToast('Failed to save variation comment', error)
                          })
                        }
                      },
                      onDeleteVariationComment: (variationId: number) => {
                        if (selectedGameCollectionId && selectedGame) {
                          void window.electron.deleteVariationComment(
                            selectedGameCollectionId, selectedGame.id, variationId
                          ).then(() => {
                            commentState.removeVariationComment(variationId)
                          }).catch((error: unknown) => {
                            showErrorToast('Failed to delete variation comment', error)
                          })
                        }
                      },
                    }}
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
                    {Array.from({ length: 30 }).map((_, i) => (
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
          onComplete={(id) => { void handleImportComplete(id) }}
          onClose={handleImportClose}
        />

        {/* Comment deletion confirmation */}
        <ConfirmDialog
          isOpen={commentState.pendingDeletion !== null}
          title="Delete Comment"
          message="Delete this comment? This cannot be undone."
          onConfirm={() => {
            if (selectedGameCollectionId && selectedGame) {
              void commentState.confirmDeletion(selectedGameCollectionId, selectedGame.id)
            }
          }}
          onCancel={commentState.cancelDeletion}
          confirmIcon="trash"
        />

        {/* Variation deletion confirmation */}
        <ConfirmDialog
          isOpen={variationState.pendingDeletion !== null}
          title="Delete Variation"
          message="Delete this variation? This cannot be undone."
          onConfirm={variationState.confirmDeletion}
          onCancel={variationState.cancelDeletion}
          confirmIcon="trash"
        />

      </div>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  )
}
