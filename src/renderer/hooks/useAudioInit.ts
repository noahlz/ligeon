import { useRef, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { preloadAllSounds } from '../utils/audioManager.js'

export interface UseAudioInitReturn {
  /** Ref indicating whether audio has been initialized */
  audioInitialized: MutableRefObject<boolean>
}

/**
 * Initializes audio on first user interaction (click or keydown).
 * Uses { once: true } listeners to ensure single initialization.
 * Cleans up event listeners on unmount.
 */
export function useAudioInit(): UseAudioInitReturn {
  const audioInitialized = useRef(false)

  useEffect(() => {
    const initAudio = () => {
      if (!audioInitialized.current) {
        preloadAllSounds()
        audioInitialized.current = true
      }
    }

    window.addEventListener('click', initAudio, { once: true })
    window.addEventListener('keydown', initAudio, { once: true })

    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
  }, [])

  return { audioInitialized }
}
