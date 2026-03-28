import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js'
import { Button } from '@/components/ui/button.js'
import type { AppTheme, BoardTheme, PieceSet, GameListLimit } from '../../../shared/types/game.js'
import { SettingsSection } from '../settings/SettingsSection.js'
import { AppThemeSection } from '../settings/AppThemeSection.js'
import { BoardThemeSection } from '../settings/BoardThemeSection.js'
import { PieceSetSection } from '../settings/PieceSetSection.js'
import { GameListSection } from '../settings/GameListSection.js'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  appTheme: AppTheme
  onAppThemeChange: (theme: AppTheme) => void
  boardTheme: BoardTheme
  onThemeChange: (theme: BoardTheme) => void
  pieceSet: PieceSet
  onPieceSetChange: (set: PieceSet) => void
  gameListLimit: GameListLimit
  onGameListLimitChange: (limit: GameListLimit) => void
}

export default function SettingsDialog({
  open,
  onClose,
  appTheme,
  onAppThemeChange,
  boardTheme,
  onThemeChange,
  pieceSet,
  onPieceSetChange,
  gameListLimit,
  onGameListLimitChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <SettingsSection label="Theme">
            <AppThemeSection appTheme={appTheme} onAppThemeChange={onAppThemeChange} />
          </SettingsSection>
          <SettingsSection label="Board Color">
            <BoardThemeSection boardTheme={boardTheme} onThemeChange={onThemeChange} />
          </SettingsSection>
          <SettingsSection label="Piece Set">
            <PieceSetSection pieceSet={pieceSet} onPieceSetChange={onPieceSetChange} />
          </SettingsSection>
          <SettingsSection label="Game List Limit">
            <GameListSection
              gameListLimit={gameListLimit}
              onGameListLimitChange={onGameListLimitChange}
            />
          </SettingsSection>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
