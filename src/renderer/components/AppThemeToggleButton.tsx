import { Sun, Moon } from 'lucide-react'
import type { AppTheme } from '../../shared/types/game.js'
import { Button } from '@/components/ui/button.js'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip.js'

interface AppThemeToggleButtonProps {
  effectiveTheme: 'dark' | 'light'
  onAppThemeChange: (theme: AppTheme) => void
}

export default function AppThemeToggleButton({ effectiveTheme, onAppThemeChange }: AppThemeToggleButtonProps) {
  const effectiveDark = effectiveTheme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAppThemeChange(effectiveDark ? 'light' : 'dark')}
          className="bg-ui-bg-element hover:bg-ui-bg-hover"
        >
          {effectiveDark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        {effectiveDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </TooltipContent>
    </Tooltip>
  )
}
