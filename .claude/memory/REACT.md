# React Components & Hooks

## Component Patterns

- Keep `components/` files under ~350 lines. When adding substantial new UI (a new popover, picker, or interactive widget), create a new `.tsx` file rather than growing an existing component.
- Pattern: clear `Props` interface, all state passed as props, no direct store/context access.
- Reference implementations: `CommentRow`, `VariationRow`, `MoveCell`, `AnnotationPicker`.

## `@/` Alias

`@/` is renderer-internal only. Maps to `src/renderer` (configured in `vite.config.ts`).

```typescript
import { cn } from '@/lib/utils.js'               // correct
import type { MoveTypes } from '@/types/moveTypes.js'  // correct
```

Note: still requires `.js` extension per ESM rules. If imports resolve at build time but fail at runtime, double-check the extension.

## Hooks

Custom hooks live in `src/renderer/hooks/`. They follow the same pattern as components — accept state as arguments, return derived state and handlers. No direct SQLite or IPC access; call `window.electron.*` for data.
