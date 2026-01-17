import { useEffect, useCallback, useState } from 'react'
import { VIDAA_KEY_CODES } from './SpatialNavigationProvider'

export interface BackHandlerOptions {
  /**
   * Callback invoked when back is pressed and can be handled (e.g., navigate back).
   * Return true if the back action was handled, false to show exit confirmation.
   */
  onBack?: () => boolean
  /**
   * Whether to show exit confirmation when at root level.
   * @default true
   */
  showExitConfirmation?: boolean
}

export interface BackHandlerState {
  /** Whether the exit confirmation dialog is currently shown */
  showExitDialog: boolean
  /** Call this to confirm exit and close the app */
  confirmExit: () => void
  /** Call this to cancel the exit dialog */
  cancelExit: () => void
}

/**
 * Hook that handles the back button press on VIDAA TV remotes.
 * Shows an exit confirmation dialog when at root level (no history to go back to).
 */
export function useBackHandler(options: BackHandlerOptions = {}): BackHandlerState {
  const { onBack, showExitConfirmation = true } = options
  const [showExitDialog, setShowExitDialog] = useState(false)

  const confirmExit = useCallback(() => {
    setShowExitDialog(false)
    // VIDAA specific exit - try various methods
    if (typeof window !== 'undefined') {
      // Method 1: VIDAA/Tizen webOS exit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tizen = (window as any).tizen
      if (tizen?.application?.getCurrentApplication) {
        tizen.application.getCurrentApplication().exit()
        return
      }
      // Method 2: webOS exit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const webOS = (window as any).webOS
      if (webOS?.platformBack) {
        webOS.platformBack()
        return
      }
      // Method 3: Close window (works in some environments)
      window.close()
    }
  }, [])

  const cancelExit = useCallback(() => {
    setShowExitDialog(false)
  }, [])

  const handleBackButton = useCallback(
    (event: KeyboardEvent) => {
      const keyCode = event.keyCode || event.which

      // Check if it's the back button (VIDAA or fallback)
      if (keyCode !== VIDAA_KEY_CODES.BACK && keyCode !== VIDAA_KEY_CODES.BACK_ALT) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      // If exit dialog is showing, cancel it on back press
      if (showExitDialog) {
        setShowExitDialog(false)
        return
      }

      // Try the custom back handler first
      if (onBack) {
        const handled = onBack()
        if (handled) {
          return
        }
      }

      // At root level - show exit confirmation or exit directly
      if (showExitConfirmation) {
        setShowExitDialog(true)
      } else {
        confirmExit()
      }
    },
    [onBack, showExitConfirmation, showExitDialog, confirmExit]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleBackButton, true)
    return () => {
      window.removeEventListener('keydown', handleBackButton, true)
    }
  }, [handleBackButton])

  return {
    showExitDialog,
    confirmExit,
    cancelExit,
  }
}
