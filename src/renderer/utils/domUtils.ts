/**
 * DOM utilities for common element checks used across hooks and components.
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
