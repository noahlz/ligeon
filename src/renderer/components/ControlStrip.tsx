import { Volume2, VolumeX, RefreshCcw, Settings } from 'lucide-react'
import type { GameRow, CommentData, AnnotationData, VariationData, AppTheme } from '../../shared/types/game.js'
import { Button } from '@/components/ui/button.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'
import LichessMenuButton from './LichessMenuButton.js'
import AppThemeToggleButton from './AppThemeToggleButton.js'

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
  effectiveTheme: 'dark' | 'light'
  onAppThemeChange: (theme: AppTheme) => void
  onOpenSettings: () => void
}

export default function ControlStrip({ game, fen, soundEnabled, onToggleSound, onFlipBoard, comments, annotations, variations, variationComments, effectiveTheme, onAppThemeChange, onOpenSettings }: ControlStripProps) {
  return (
    <div className="flex flex-col gap-2 items-center p-1 pt-0 h-full justify-start">
      <LichessMenuButton
        game={game}
        fen={fen}
        comments={comments}
        annotations={annotations}
        variations={variations}
        variationComments={variationComments}
      />
      <FlipBoardButton onFlipBoard={onFlipBoard} />
      <SoundToggleButton soundEnabled={soundEnabled} onToggleSound={onToggleSound} />
      <SettingsButton onOpen={onOpenSettings} />
      <AppThemeToggleButton effectiveTheme={effectiveTheme} onAppThemeChange={onAppThemeChange} />
    </div>
  )
}

function FlipBoardButton({ onFlipBoard }: { onFlipBoard: () => void }) {
  return (
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
  )
}

function SoundToggleButton({ soundEnabled, onToggleSound }: { soundEnabled: boolean; onToggleSound: () => void }) {
  return (
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
  )
}

function SettingsButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpen}
          className="bg-ui-bg-element hover:bg-ui-bg-hover"
        >
          <Settings size={18} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Settings</TooltipContent>
    </Tooltip>
  )
}
