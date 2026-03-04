import type { MoveType } from '../types/moveTypes.js'

// Prefix with import.meta.env.BASE_URL so paths work over file:// in the
// packaged app (where base is './' and '/sounds/...' would resolve to root).
const base = import.meta.env.BASE_URL
const SOUND_PATHS: Record<MoveType, string> = {
  move: `${base}sounds/Move.ogg`,
  capture: `${base}sounds/Capture.ogg`,
  check: `${base}sounds/Check.ogg`,
  castle: `${base}sounds/Castles.ogg`
}

// Cache for loaded audio elements
const audioCache = new Map<MoveType, HTMLAudioElement>()

/**
 * Preload a sound file into the cache
 */
function preloadSound(type: MoveType): HTMLAudioElement {
  if (audioCache.has(type)) {
    return audioCache.get(type)!
  }

  const audio = new Audio(SOUND_PATHS[type])
  audio.preload = 'auto'
  audioCache.set(type, audio)
  return audio
}

/**
 * Preload all sound files
 * Call this on app initialization to avoid delays on first play
 */
export function preloadAllSounds(): void {
  const types: MoveType[] = ['move', 'capture', 'check', 'castle']
  types.forEach(preloadSound)
}

/**
 * Play a move sound effect
 * Automatically handles caching and playback
 */
export function playMoveSound(type: MoveType): void {
  try {
    const audio = preloadSound(type)

    // Reset to start if already playing
    audio.currentTime = 0

    // Play the sound (may fail if user hasn't interacted with page yet)
    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise.catch((error: unknown) => {
        // Browser blocked autoplay - this is expected on first load
        // Silently ignore since sounds aren't critical to functionality
        console.debug(`Audio playback blocked for ${type}:`, error instanceof Error ? error.message : error)
      })
    }
  } catch (error) {
    // Log but don't throw - audio is non-critical
    console.error(`Failed to play ${type} sound:`, error)
  }
}
