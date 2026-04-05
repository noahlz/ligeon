# UI / UX

App screenshot: `ligeon-screen.png` (repo root).

## Gotchas

### Import Fix After Adding shadcn Components (`npx shadcn@latest add <name>`)

`npx shadcn@latest add` generates `import { cn } from "src/renderer/lib"` — manually fix to `"@/lib/utils.js"`.

### Radix Popover: Click-to-Toggle on External Trigger
Radix fires `onOpenChange(false)` on `pointerdown` before `onClick` fires, causing toggle logic to reopen the popover.

Fix: use `onInteractOutside` + `e.preventDefault()` on `PopoverContent` to veto the auto-close when the click originates from your own trigger. See `AnnotationPicker.tsx` for implementation.

### Circular Hook Dependencies via Refs
`useAutoPlay` and `useVariationState` depend on each other. The dependency is broken by storing stop callbacks in refs (`autoPlayStopRef`) in `App.tsx`, passed to hooks as parameters. Do not refactor this into state without understanding the cycle.

### Driver.js Guided Tour
`useTour` hook + `styles/tour.css`. Three independent contextual popovers (not a linear sequence). See the hook for implementation details.

### Chessground is Imperative — Two useEffect Pattern
`BoardDisplay.tsx` uses two `useEffect` blocks: one to initialize Chessground on mount, one to update it via `.set()` when props change. Do not merge them.