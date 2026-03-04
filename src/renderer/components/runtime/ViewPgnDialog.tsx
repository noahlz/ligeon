import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.js'
import { Button } from '@/components/ui/button.js'

interface ViewPgnDialogProps {
  pgn: string
  open: boolean
  onClose: () => void
}

export default function ViewPgnDialog({ pgn, open, onClose }: ViewPgnDialogProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pgn)
      toast.success('PGN copied to clipboard')
    } catch {
      toast.error('Failed to copy PGN')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>View PGN</DialogTitle>
        </DialogHeader>
        <textarea
          readOnly
          value={pgn}
          className="w-full h-64 font-mono text-xs bg-ui-bg-element text-ui-text border border-ui-border rounded p-2 resize-none focus:outline-none"
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => { void handleCopy() }}>Copy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
