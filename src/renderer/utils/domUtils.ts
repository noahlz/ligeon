/**
 * DOM utilities for common element checks and input event handling.
 */

/**
 * Returns true if the event target is an editable text input element.
 * Used to suppress keyboard shortcuts when the user is typing.
 *
 * @param target - The event target (e.g. from KeyboardEvent or WheelEvent)
 */
export function isEditableInput(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
}

/**
 * Maps a wheel event's deltaY to a navigation direction.
 * Returns null when deltaY is zero (no movement).
 */
export function getWheelDirection(deltaY: number): 'next' | 'prev' | null {
  if (deltaY > 0) return 'next'
  if (deltaY < 0) return 'prev'
  return null
}

/**
 * Returns true if enough time has elapsed since the last scroll event
 * to process a new wheel event (debounce guard).
 */
export function shouldProcessWheelEvent(now: number, lastScrollTime: number, debounceMs: number): boolean {
  return now - lastScrollTime >= debounceMs
}
