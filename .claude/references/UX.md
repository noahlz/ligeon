# UI / UX

App screenshot: `ligeon-screen.png` (repo root).

## Gotchas

### shadcn Import Fix (`npx shadcn@latest add <name>`)

`npx shadcn@latest add` generates `import { cn } from "src/renderer/lib"` — fix to `"@/lib/utils.js"`.

### Radix Popover: Click-to-Toggle on External Trigger
Radix fires `onOpenChange(false)` on `pointerdown` before `onClick` fires, causing toggle logic to reopen the popover.

Fix: use `onInteractOutside` + `e.preventDefault()` on `PopoverContent` to veto auto-close when the click originates from your trigger. See `AnnotationPicker.tsx`.

### Circular Hook Dependencies via Refs
`useAutoPlay` and `useVariationState` depend on each other; cycle broken via `autoPlayStopRef` in `App.tsx`, passed to hooks as parameters. Don't refactor to state.

### Driver.js Guided Tour
`useTour` hook + `styles/tour.css`. Three independent contextual popovers (not a linear sequence).

### Chessground is Imperative — Two useEffect Pattern
`BoardDisplay.tsx`: two `useEffect` blocks — init on mount, update via `.set()` on props change. Don't merge.