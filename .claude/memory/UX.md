# UI / UX

## Layout

```
┌─────────────────┬──────────────────────────────────┬────────────────────┐
│ Left (w-72)     │ Center (flex-1)                  │ Right (w-80)       │
├─────────────────┼──────────────────────────────────┼────────────────────┤
│ CollectionSel.  │[Spacer] BoardDisplay [CtrlStrip] │ GameInfo           │
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

`components/ui/` contains copy-pasted source — **not npm imports**. Keep `ui/` customizations minimal; compose in app components.

### Import Fix After Adding Components (`npx shadcn@latest add <name>`)

`npx shadcn@latest add` generates `import { cn } from "src/renderer/lib"` — manually fix to `"@/lib/utils.js"`.

## Chessground And ChessOps Integration

For board UI behavior, see `src/renderer/utils/chessManager.ts` and `variationManager.ts`. Both implement `NavigableManager` (`src/renderer/types/navigableManager.ts`).

## Gotchas

### Radix Popover: Click-to-Toggle on External Trigger
Radix fires `onOpenChange(false)` on `pointerdown` before `onClick` fires, causing toggle logic to reopen the popover.

Fix: use `onInteractOutside` + `e.preventDefault()` on `PopoverContent` to veto the auto-close when the click originates from your own trigger. See `AnnotationPicker.tsx` for implementation.

### Circular Hook Dependencies via Refs
`useAutoPlay` and `useVariationState` depend on each other. The dependency is broken by storing stop callbacks in refs (`autoPlayStopRef`) in `App.tsx`. Do not refactor this into state without understanding the cycle.

### Driver.js Guided Tour
`useTour` hook + `styles/tour.css`. Three independent contextual popovers (not a linear sequence). See the hook for implementation details.

### Chessground is Imperative — Two useEffect Pattern
`BoardDisplay.tsx` uses two `useEffect` blocks: one to initialize Chessground on mount, one to update it via `.set()` when props change. Do not merge them. 