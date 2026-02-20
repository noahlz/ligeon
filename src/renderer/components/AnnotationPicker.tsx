import { NAG_DEFINITIONS } from '../utils/nag.js'
import {
  PopoverContent,
} from '@/components/ui/popover.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'
import { Button } from '@/components/ui/button.js'

export interface AnnotationPickerProps {
  ply: number
  /** All NAG codes currently set at this ply */
  currentAnnotationNags: number[]
  onSetAnnotation?: (ply: number, nag: number) => void
  /** Remove a specific annotation by NAG code (toggle-off behavior) */
  onRemoveAnnotation?: (ply: number, nag: number) => void
  onClose: () => void
}

export function AnnotationPicker({
  ply,
  currentAnnotationNags,
  onSetAnnotation,
  onRemoveAnnotation,
  onClose,
}: AnnotationPickerProps) {
  return (
    <PopoverContent
      side="bottom"
      align="center"
      className="w-auto p-2"
      onOpenAutoFocus={e => e.preventDefault()}
    >
      <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1 gap-4">
          <span className="text-xs text-ui-text-dimmer">Select annotation</span>
          <button
            onClick={() => onClose()}
            className="text-ui-text-dimmer hover:text-ui-text leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {NAG_DEFINITIONS.map(def => {
            const isActive = currentAnnotationNags.includes(def.nag)
            return (
              <Tooltip key={def.nag}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isActive) {
                        onRemoveAnnotation?.(ply, def.nag)
                      } else {
                        onSetAnnotation?.(ply, def.nag)
                      }
                      onClose()
                    }}
                    className={`h-10 w-11 font-mono text-base text-white p-0 ${
                      isActive
                        ? 'ring-1 ring-ui-accent bg-ui-accent/20'
                        : 'hover:text-white'
                    }`}
                  >
                    {def.symbol}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{def.description}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </PopoverContent>
  )
}
