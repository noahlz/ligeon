/**
 * Canonical list of valid NAG (Numeric Annotation Glyph) codes supported by this application.
 * Single source of truth — imported by both the IPC validator (main) and the annotation
 * picker (renderer). To add a new NAG code, update this list and add its definition in
 * src/renderer/utils/nag.ts.
 */
export const VALID_NAG_CODES: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 10, 13, 14, 15, 16, 17, 18, 19, 32
]
