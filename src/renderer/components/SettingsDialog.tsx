import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Button } from '@/components/ui/button.js'
import type { BoardTheme } from '../../shared/types/game.js'
import { SettingsSection } from './settings/SettingsSection.js'
import { BoardThemeSection } from './settings/BoardThemeSection.js'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  boardTheme: BoardTheme
  onThemeChange: (theme: BoardTheme) => void
}

export default function SettingsDialog({ open, onClose, boardTheme, onThemeChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <SettingsSection label="Board Theme">
            <BoardThemeSection boardTheme={boardTheme} onThemeChange={onThemeChange} />
          </SettingsSection>
          {/* Future: <SettingsSection label="Piece Style"><PieceStyleSection .../></SettingsSection> */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
