import { ExternalLink, Volume2, VolumeX, RefreshCcw } from 'lucide-react'
import { buildLichessURL, buildLichessAnalysisURL, buildFullPgn } from '../utils/externalLinks.js'
import type { GameRow } from '../../shared/types/game.js'
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

interface ControlStripProps {
  game?: GameRow
  fen?: string
  soundEnabled: boolean
  onToggleSound: () => void
  onFlipBoard: () => void
}

export default function ControlStrip({ game, fen, soundEnabled, onToggleSound, onFlipBoard }: ControlStripProps) {
  const handleImportGame = () => {
    if (!game) return
    window.electron.openExternal(buildLichessURL(buildFullPgn(game)))
  }

  const handleAnalyzePosition = () => {
    if (!fen) return
    window.electron.openExternal(buildLichessAnalysisURL(fen))
  }

  return (
    <div className="flex flex-col gap-2 items-center p-1 pt-0 h-full justify-start">
      {/* View on Lichess dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!game}
                className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 cursor-pointer"
              >
                <ExternalLink size={18} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">View on Lichess</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="left" align="start">
          <DropdownMenuItem onClick={handleImportGame}>
            Import Game
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAnalyzePosition} disabled={!fen}>
            Analyze Position
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sound toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            className="bg-ui-bg-element hover:bg-ui-bg-hover cursor-pointer"
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
            className="bg-ui-bg-element hover:bg-ui-bg-hover cursor-pointer"
          >
            <RefreshCcw size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Flip Board</TooltipContent>
      </Tooltip>
    </div>
  )
}
