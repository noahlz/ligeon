import { useState, useRef, useCallback } from 'react'
import { ExternalLink } from 'lucide-react'
import { buildLichessURL, buildLichessAnalysisURL, buildFullPgn, buildAnnotatedPgn } from '../utils/externalLinks.js'
import type { GameRow, CommentData, AnnotationData, VariationData } from '../../shared/types/game.js'
import { Button } from '@/components/ui/button.js'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu.js'
import ViewPgnDialog from './ViewPgnDialog.js'

interface LichessMenuButtonProps {
  game?: GameRow
  fen?: string
  comments?: CommentData[]
  annotations?: AnnotationData[]
  variations?: VariationData[]
  variationComments?: Map<number, CommentData>
}

export default function LichessMenuButton({
  game,
  fen,
  comments = [],
  annotations = [],
  variations = [],
  variationComments = new Map(),
}: LichessMenuButtonProps) {
  const [lichessMenuOpen, setLichessMenuOpen] = useState(false)
  const [viewPgnOpen, setViewPgnOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showLabel = useCallback(() => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null }
    if (game && !lichessMenuOpen) setHovered(true)
  }, [game, lichessMenuOpen])

  const scheduleHideLabel = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setHovered(false), 100)
  }, [])

  const openMenu = () => {
    if (!game) return
    setHovered(false)
    setLichessMenuOpen(true)
  }

  const handleImportGame = () => {
    if (!game) return
    void window.electron.openExternal(buildLichessURL(buildFullPgn(game)))
  }

  const handleAnalyzePosition = () => {
    if (!fen) return
    void window.electron.openExternal(buildLichessAnalysisURL(fen))
  }

  return (
    <>
      {game && (
        <ViewPgnDialog
          pgn={buildAnnotatedPgn(game, comments, annotations, variations, variationComments)}
          open={viewPgnOpen}
          onClose={() => setViewPgnOpen(false)}
        />
      )}
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
    </>
  )
}
