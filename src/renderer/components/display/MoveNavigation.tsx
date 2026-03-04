import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Play,
  Pause,
} from 'lucide-react'
import { useGameControls } from '../../hooks/useGameControls.js'
import { Slider } from '@/components/ui/slider.js'
import { Button } from '@/components/ui/button.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

interface MoveNavigationProps {
  onFirst: () => void
  onPrev: () => void
  onNext: () => void
  onLast: () => void
  onTogglePlay: () => void
  isPlaying: boolean
  speed: number
  onSpeedChange: (speed: number) => void
  currentPly: number
  totalPlies: number
}

export default function MoveNavigation({
  onFirst,
  onPrev,
  onNext,
  onLast,
  onTogglePlay,
  isPlaying,
  speed,
  onSpeedChange,
  currentPly,
  totalPlies,
}: MoveNavigationProps) {
  useGameControls({ onFirst, onPrev, onNext, onLast, onTogglePlay })

  const isAtStart = currentPly === 0
  const isAtEnd = currentPly === totalPlies

  return (
    <div id="tour-move-navigation" className="flex flex-col gap-1 items-center py-2">
      {/* Navigation buttons */}
      <div className="flex gap-1.5 items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onFirst}
              disabled={isAtStart}
              className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 cursor-pointer"
            >
              <ChevronsLeft size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>First (Home)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              disabled={isAtStart}
              className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Previous (←)</TooltipContent>
        </Tooltip>

        {/* Play/Pause */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isPlaying ? 'default' : 'ghost'}
              size="icon"
              onClick={onTogglePlay}
              disabled={isAtEnd && !isPlaying}
              className={
                isPlaying
                  ? 'bg-ui-accent hover:bg-orange-600'
                  : 'bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 cursor-pointer'
              }
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={isAtEnd}
              className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next (→)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLast}
              disabled={isAtEnd}
              className="bg-ui-bg-element hover:bg-ui-bg-hover disabled:bg-ui-bg-box disabled:opacity-50 cursor-pointer"
            >
              <ChevronsRight size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Last (End)</TooltipContent>
        </Tooltip>
      </div>

      {/* Speed slider (visible during auto-play) */}
      {isPlaying && (
        <div className="flex items-center gap-2 mt-1 cursor-pointer">
          <span className="text-xs text-ui-text-dim w-8">{(speed / 1000).toFixed(1)}s</span>
          <Slider
            value={[speed]}
            onValueChange={([v]) => onSpeedChange(v)}
            min={500}
            max={10000}
            step={500}
            className="w-32"
          />
        </div>
      )}
    </div>
  )
}
