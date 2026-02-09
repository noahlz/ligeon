import { ExternalLink, Volume2, VolumeX, RefreshCcw } from 'lucide-react'
import { buildLichessURL } from '../utils/externalLinks.js'
import { Button } from '@/components/ui/button.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

interface ControlStripProps {
  pgn?: string
  soundEnabled: boolean
  onToggleSound: () => void
  onFlipBoard: () => void
}

export default function ControlStrip({ pgn, soundEnabled, onToggleSound, onFlipBoard }: ControlStripProps) {
  const handleViewOnLichess = () => {
    if (!pgn) return
    window.electron.openExternal(buildLichessURL(pgn))
  }

  return (
    <div className="flex flex-col gap-2 items-center p-1 pt-0 h-full justify-start">
      {/* View on Lichess button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewOnLichess}
            disabled={!pgn}
            className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50"
          >
            <ExternalLink size={18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Import on Lichess</TooltipContent>
      </Tooltip>

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
    </div>
  )
}
