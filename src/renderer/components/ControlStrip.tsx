import { ExternalLink, Volume2, VolumeX, RefreshCcw } from 'lucide-react'
import { buildLichessURL } from '../utils/externalLinks.js'

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
      <button
        onClick={handleViewOnLichess}
        disabled={!pgn}
        className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover cursor-pointer disabled:bg-ui-bg-box disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
        title="View on Lichess"
      >
        <ExternalLink size={18} />
      </button>

      {/* Sound toggle */}
      <button
        onClick={onToggleSound}
        className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded-sm cursor-pointer"
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Flip board */}
      <button
        onClick={onFlipBoard}
        className="p-1.5 bg-ui-bg-element hover:bg-ui-bg-hover rounded-sm cursor-pointer"
        title="Flip Board"
      >
        <RefreshCcw size={18} />
      </button>

    </div>
  )
}
