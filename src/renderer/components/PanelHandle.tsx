import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

interface PanelHandleProps {
  side: 'left' | 'right'
  isOpen: boolean
  onToggle: () => void
}

export default function PanelHandle({ side, isOpen, onToggle }: PanelHandleProps) {
  const label = side === 'left'
    ? (isOpen ? 'Hide sidebar' : 'Show sidebar')
    : (isOpen ? 'Hide moves' : 'Show moves')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onToggle}
          className="w-1.5 h-full cursor-pointer flex items-center justify-center shrink-0 relative"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.2), rgba(255,255,255,0.03), rgba(0,0,0,0.2))',
          }}
        >
          {/* Grip handle */}
          <div
            className="absolute w-2 h-16 rounded-sm bg-ui-bg-hover border border-ui-border-light shadow-[0_0_4px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 items-center justify-center"
          >
            <div className="w-0.5 h-0.5 rounded-full bg-white/25" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/25" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/25" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/25" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/25" />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side={side === 'left' ? 'right' : 'left'}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}