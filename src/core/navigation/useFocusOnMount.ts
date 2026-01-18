import { useEffect, useRef } from 'react'
import { setFocus } from '@noriginmedia/norigin-spatial-navigation'

export interface UseFocusOnMountOptions {
  /**
   * The focus key to set focus to when conditions are met
   */
  focusKey: string
  /**
   * Whether the component is ready to receive focus
   * (e.g., content loaded, not in loading state)
   * @default true
   */
  isReady?: boolean
  /**
   * Delay in ms before setting focus (useful for animation completion)
   * @default 0
   */
  delay?: number
  /**
   * Whether to only focus on first mount (not on subsequent updates)
   * @default true
   */
  onlyOnMount?: boolean
}

/**
 * Hook that sets focus to a specific element when conditions are met.
 * Useful for managing focus during loading/error state transitions.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, isLoading, error } = useQuery(...)
 *
 *   useFocusOnMount({
 *     focusKey: 'MY_COMPONENT_GRID',
 *     isReady: !isLoading && !error,
 *   })
 *
 *   // ...
 * }
 * ```
 */
export function useFocusOnMount(options: UseFocusOnMountOptions): void {
  const { focusKey, isReady = true, delay = 0, onlyOnMount = true } = options
  const hasFocused = useRef(false)

  useEffect(() => {
    // Skip if not ready
    if (!isReady) return

    // Skip if already focused and onlyOnMount is true
    if (onlyOnMount && hasFocused.current) return

    // Set focus after delay
    const timer = setTimeout(() => {
      setFocus(focusKey)
      hasFocused.current = true
    }, delay)

    return () => clearTimeout(timer)
  }, [focusKey, isReady, delay, onlyOnMount])
}

/**
 * Hook that restores focus after state transitions.
 * Remembers the last focused element and restores focus when content reloads.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, isLoading, refetch } = useQuery(...)
 *   const { saveFocus, restoreFocus } = useFocusRestoration()
 *
 *   // Before refetch
 *   const handleRefresh = () => {
 *     saveFocus()
 *     refetch()
 *   }
 *
 *   // After data loads
 *   useEffect(() => {
 *     if (!isLoading && data) {
 *       restoreFocus()
 *     }
 *   }, [isLoading, data])
 * }
 * ```
 */
export function useFocusRestoration(): {
  saveFocus: () => void
  restoreFocus: () => void
  lastFocusKey: string | null
} {
  const lastFocusKeyRef = useRef<string | null>(null)

  const saveFocus = () => {
    const activeElement = document.activeElement as HTMLElement
    const focusKey = activeElement?.getAttribute('data-focus-key')
    lastFocusKeyRef.current = focusKey
  }

  const restoreFocus = () => {
    if (lastFocusKeyRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (lastFocusKeyRef.current) {
          setFocus(lastFocusKeyRef.current)
        }
      }, 50)
    }
  }

  return {
    saveFocus,
    restoreFocus,
    lastFocusKey: lastFocusKeyRef.current,
  }
}
