import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Button } from '@/components/ui/button.js'
import { cn } from '@/lib/utils.js'
import type { BoardTheme } from '../../shared/types/game.js'

interface ThemeOption {
  id: BoardTheme
  light: string
  dark: string
}

const THEMES: ThemeOption[] = [
  { id: 'brown', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green', light: '#ffffdd', dark: '#86a666' },
  { id: 'blue',  light: '#dee3e6', dark: '#8ca2ad' },
  { id: 'grey',  light: '#c8c8c8', dark: '#7a7a7a' },
]

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  boardTheme: string
  onThemeChange: (theme: string) => void
}

export default function SettingsDialog({ open, onClose, boardTheme, onThemeChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal text-muted-foreground">Board Theme</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map((theme) => {
            const isActive = boardTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                title={theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}
                aria-label={`${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)} board theme`}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center justify-center rounded-md p-1.5 transition-colors cursor-pointer hover:bg-ui-bg-hover',
                  isActive && 'ring-2 ring-ui-accent bg-ui-bg-element'
                )}
              >
                <div
                  className="w-20 h-20 rounded"
                  style={{
                    backgroundImage: `repeating-conic-gradient(${theme.light} 0% 25%, ${theme.dark} 0% 50%)`,
                    backgroundSize: '25% 25%',
                  }}
                />
              </button>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
