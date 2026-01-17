import { init, setKeyMap } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useRef, type ReactNode } from 'react'

// VIDAA remote key codes
const VIDAA_KEY_CODES = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  BACK: 461, // VIDAA back button
  BACK_ALT: 8, // Backspace as fallback for testing
} as const

interface SpatialNavigationProviderProps {
  children: ReactNode
}

/**
 * Initializes the Norigin Spatial Navigation library with VIDAA-specific configuration.
 */
function initSpatialNavigation(): void {
  init({
    debug: import.meta.env.DEV,
    visualDebug: false,
    distanceCalculationMethod: 'center',
    throttle: 100,
  })

  // Set key map for VIDAA remote control
  setKeyMap({
    left: VIDAA_KEY_CODES.LEFT,
    right: VIDAA_KEY_CODES.RIGHT,
    up: VIDAA_KEY_CODES.UP,
    down: VIDAA_KEY_CODES.DOWN,
    enter: VIDAA_KEY_CODES.ENTER,
  })
}

/**
 * Provider component that initializes spatial navigation for TV remote control.
 * Wrap your app with this component to enable D-pad navigation.
 */
export function SpatialNavigationProvider({
  children,
}: SpatialNavigationProviderProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initSpatialNavigation()
      initialized.current = true
    }
  }, [])

  return <>{children}</>
}

export { VIDAA_KEY_CODES }
