import { useState, useRef, useCallback } from 'react'
import { ExternalLink, Volume2, VolumeX, RefreshCcw, Settings } from 'lucide-react'
import { buildLichessURL, buildLichessAnalysisURL, buildFullPgn, buildAnnotatedPgn } from '../utils/externalLinks.js'
import type { GameRow, CommentData, AnnotationData, VariationData, BoardTheme, PieceSet } from '../../shared/types/game.js'
import { Button } from '@/components/ui/button.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu.js'
import ViewPgnDialog from './ViewPgnDialog.js'
import SettingsDialog from './SettingsDialog.js'

interface ControlStripProps {
  game?: GameRow
  fen?: string
  soundEnabled: boolean
  onToggleSound: () => void
  onFlipBoard: () => void
  comments?: CommentData[]
  annotations?: AnnotationData[]
  variations?: VariationData[]
  variationComments?: Map<number, CommentData>
  boardTheme: BoardTheme
  onThemeChange: (theme: BoardTheme) => void
  pieceSet: PieceSet
  onPieceSetChange: (set: PieceSet) => void
}

export default function ControlStrip({ game, fen, soundEnabled, onToggleSound, onFlipBoard, comments = [], annotations = [], variations = [], variationComments = new Map(), boardTheme, onThemeChange, pieceSet, onPieceSetChange }: ControlStripProps) {
  const [lichessMenuOpen, setLichessMenuOpen] = useState(false)
  const [viewPgnOpen, setViewPgnOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showLabel = useCallback(() => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null }
    if (game && !lichessMenuOpen) setHovered(true)
  }, [game, lichessMenuOpen])

  const scheduleHideLabel = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setHovered(false), 100)
  }, [])

  const handleImportGame = () => {
    if (!game) return
    void window.electron.openExternal(buildLichessURL(buildFullPgn(game)))
  }

  const handleAnalyzePosition = () => {
    if (!fen) return
    void window.electron.openExternal(buildLichessAnalysisURL(fen))
  }

  const openMenu = () => {
    if (!game) return
    setHovered(false)
    setLichessMenuOpen(true)
  }

  return (
    <div className="flex flex-col gap-2 items-center p-1 pt-0 h-full justify-start">
      {game && (
        <ViewPgnDialog
          pgn={buildAnnotatedPgn(game, comments, annotations, variations, variationComments)}
          open={viewPgnOpen}
          onClose={() => setViewPgnOpen(false)}
        />
      )}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        boardTheme={boardTheme}
        onThemeChange={onThemeChange}
        pieceSet={pieceSet}
        onPieceSetChange={onPieceSetChange}
      />
      {/* View on Lichess — hover shows clickable label, click opens dropdown */}
      <div
        className="relative"
        onMouseEnter={showLabel}
        onMouseLeave={scheduleHideLabel}
      >
        <DropdownMenu open={lichessMenuOpen} onOpenChange={setLichessMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!game}
              className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50"
            >
              <ExternalLink size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left" align="start">
            <DropdownMenuItem onClick={handleImportGame}>
              View Game
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAnalyzePosition} disabled={!fen}>
              Analyze Position
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setLichessMenuOpen(false); setViewPgnOpen(true) }}>
              View PGN
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Hover label — clickable, opens dropdown */}
        {hovered && (
          <button
            onClick={openMenu}
            onMouseEnter={showLabel}
            onMouseLeave={scheduleHideLabel}
            className="absolute right-full top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md cursor-pointer hover:bg-accent animate-in fade-in-0 zoom-in-95 slide-in-from-right-2"
          >
            View on Lichess
          </button>
        )}
      </div>

      {/* Sound toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            className="bg-ui-bg-element hover:bg-ui-bg-hover"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{soundEnabled ? 'Sound Off' : 'Sound On'}</TooltipContent>
      </Tooltip>

      {/* Flip board */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFlipBoard}
            className="bg-ui-bg-element hover:bg-ui-bg-hover"
          >
            <RefreshCcw size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Flip Board</TooltipContent>
      </Tooltip>

      {/* Settings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="bg-ui-bg-element hover:bg-ui-bg-hover"
          >
            <Settings size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Settings</TooltipContent>
      </Tooltip>
    </div>
  )
}
