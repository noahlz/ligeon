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
  currentAnnotationNag?: number
  onSetAnnotation?: (ply: number, nag: number) => void
  onClearAnnotation?: (ply: number) => void
  onClose: () => void
}

export function AnnotationPicker({
  ply,
  currentAnnotationNag,
  onSetAnnotation,
  onClearAnnotation,
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
          {NAG_DEFINITIONS.map(def => (
            <Tooltip key={def.nag}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (currentAnnotationNag === def.nag) {
                      onClearAnnotation?.(ply)
                    } else {
                      onSetAnnotation?.(ply, def.nag)
                    }
                    onClose()
                  }}
                  className={`h-10 w-11 font-mono text-base text-white p-0 ${
                    currentAnnotationNag === def.nag
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
          ))}
        </div>
        {currentAnnotationNag !== undefined && (
          <div className="border-t border-ui-bg-hover mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-ui-text-dim h-6"
              onClick={() => {
                onClearAnnotation?.(ply)
                onClose()
              }}
            >
              Clear annotation
            </Button>
          </div>
        )}
      </div>
    </PopoverContent>
  )
}
