# UI / UX

## Layout

```
┌─────────────────┬──────────────────────────────────┬────────────────────┐
│ Left (w-72)     │ Center (flex-1)                  │ Right (w-80)       │
├─────────────────┼──────────────────────────────────┼────────────────────┤
│ CollectionSel.  │[spacer] BoardDisplay [CtrlStrip] │ GameInfo           │
│ GameListSidebar │                                  │ MoveList           │
│                 │                                  │                    │
│                 │     MoveNavigationButtons        │                    │
└─────────────────┴──────────────────────────────────┴────────────────────┘
```

Rules:
- Flex only (no absolute positioning, unless justified by a comment).
- Left spacer width = ControlStrip width.

## Tailwind Colors

`tailwind.config.ts` + `styles/index.css`:

- Backgrounds: `ui-bg-page` → `ui-bg-box` → `ui-bg-element` → `ui-bg-hover`
- Text: `ui-text` → `ui-text-dim` → `ui-text-dimmer`
- Accent: `ui-accent` (orange)
- shadcn: CSS variables (`--color-background`, `--color-primary`, `--color-destructive`, etc.)

## shadcn/ui

`components/ui/` contains copy-pasted source — **not npm imports**. Add components via:

```bash
npx shadcn@latest add <name>
```

Keep `ui/` customizations minimal; compose in app components.

### Import Fix After Adding Components
`npx shadcn@latest add` generates `import { cn } from "src/renderer/lib"` — manually fix to `"@/lib/utils.js"`.

## Chessground

- Use `.board-coords-wrapper` for coordinate padding.
- Flip board: `data-orientation="black"` attribute.
- Config reference: see chessground config link in CLAUDE.md.

## Gotchas

### Radix Popover: Click-to-Toggle on External Trigger
Radix fires `onOpenChange(false)` on `pointerdown` before `onClick` fires, causing toggle logic to reopen the popover.

Fix: use `onInteractOutside` + `e.preventDefault()` on `PopoverContent` to veto the auto-close when the click originates from your own trigger. See `AnnotationPicker.tsx` for implementation.

### DevTools Warnings
`Request Autofill.enable/setAddresses failed` — harmless in `npm run app`, ignore.
