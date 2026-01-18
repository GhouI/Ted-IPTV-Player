import { useEffect, useCallback, useState, useRef } from 'react'
import { KeyEventManager, isBackKey } from './KeyEventManager'

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
  /**
   * Unique ID for this handler instance (for debugging)
   * @default 'back-handler'
   */
  handlerId?: string
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
 * Uses KeyEventManager for coordinated event handling with other components.
 */
export function useBackHandler(options: BackHandlerOptions = {}): BackHandlerState {
  const { onBack, showExitConfirmation = true, handlerId = 'back-handler' } = options
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Use refs to avoid stale closures in the handler
  const onBackRef = useRef(onBack)
  const showExitDialogRef = useRef(showExitDialog)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    showExitDialogRef.current = showExitDialog
  }, [showExitDialog])

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

  useEffect(() => {
    // Initialize KeyEventManager
    KeyEventManager.init()

    // Register handler with navigation priority (lower than modal)
    const unregister = KeyEventManager.register({
      id: handlerId,
      priority: 'navigation',
      handler: (event: KeyboardEvent): boolean => {
        // Only handle back key
        if (!isBackKey(event)) {
          return false
        }

        // If exit dialog is showing, cancel it on back press
        if (showExitDialogRef.current) {
          setShowExitDialog(false)
          return true
        }

        // Try the custom back handler first
        if (onBackRef.current) {
          const handled = onBackRef.current()
          if (handled) {
            return true
          }
        }

        // At root level - show exit confirmation or exit directly
        if (showExitConfirmation) {
          setShowExitDialog(true)
        } else {
          confirmExit()
        }
        return true
      },
    })

    return unregister
  }, [handlerId, showExitConfirmation, confirmExit])

  return {
    showExitDialog,
    confirmExit,
    cancelExit,
  }
}
