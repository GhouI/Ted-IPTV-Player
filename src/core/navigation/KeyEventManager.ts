/**
 * KeyEventManager - Centralized key event handling for TV remote control.
 *
 * This module provides a priority-based key event system that ensures
 * proper event propagation and prevents conflicts between multiple
 * keydown listeners (modals, player controls, back handler, etc.)
 */

import { VIDAA_KEY_CODES } from './SpatialNavigationProvider'

export type KeyEventPriority = 'modal' | 'player' | 'navigation' | 'default'

export interface KeyEventHandler {
  /** Unique identifier for this handler */
  id: string
  /** Priority level - higher priority handlers are called first */
  priority: KeyEventPriority
  /** Handler function - return true if event was handled (stops propagation) */
  handler: (event: KeyboardEvent) => boolean
}

// Priority order (highest to lowest)
const PRIORITY_ORDER: KeyEventPriority[] = ['modal', 'player', 'navigation', 'default']

class KeyEventManagerImpl {
  private handlers: Map<string, KeyEventHandler> = new Map()
  private initialized = false

  /**
   * Initialize the key event manager
   */
  init(): void {
    if (this.initialized) return

    window.addEventListener('keydown', this.handleKeyDown, true)
    this.initialized = true
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (!this.initialized) return

    window.removeEventListener('keydown', this.handleKeyDown, true)
    this.handlers.clear()
    this.initialized = false
  }

  /**
   * Register a key event handler
   */
  register(handler: KeyEventHandler): () => void {
    this.handlers.set(handler.id, handler)

    // Return unregister function
    return () => {
      this.handlers.delete(handler.id)
    }
  }

  /**
   * Unregister a handler by ID
   */
  unregister(id: string): void {
    this.handlers.delete(id)
  }

  /**
   * Get all registered handler IDs (for debugging)
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Central keydown handler that dispatches to registered handlers
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Skip if target is an input element
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Get handlers sorted by priority
    const sortedHandlers = this.getSortedHandlers()

    // Try each handler in priority order
    for (const handler of sortedHandlers) {
      try {
        const handled = handler.handler(event)
        if (handled) {
          // Handler consumed the event, stop propagation
          event.preventDefault()
          event.stopPropagation()
          return
        }
      } catch (error) {
        console.error(`KeyEventManager: Error in handler "${handler.id}":`, error)
      }
    }
  }

  /**
   * Sort handlers by priority (highest first)
   */
  private getSortedHandlers(): KeyEventHandler[] {
    return Array.from(this.handlers.values()).sort((a, b) => {
      const aIndex = PRIORITY_ORDER.indexOf(a.priority)
      const bIndex = PRIORITY_ORDER.indexOf(b.priority)
      return aIndex - bIndex
    })
  }
}

// Export singleton instance
export const KeyEventManager = new KeyEventManagerImpl()

/**
 * Check if a key event is a back button press
 */
export function isBackKey(event: KeyboardEvent): boolean {
  const keyCode = event.keyCode || event.which
  return (
    keyCode === VIDAA_KEY_CODES.BACK ||
    keyCode === VIDAA_KEY_CODES.BACK_ALT ||
    event.key === 'Escape' ||
    event.key === 'Backspace' ||
    keyCode === 10009 // Samsung/LG Back
  )
}

/**
 * Check if a key event is a navigation key
 */
export function isNavigationKey(event: KeyboardEvent): boolean {
  const keyCode = event.keyCode || event.which
  return (
    keyCode === VIDAA_KEY_CODES.LEFT ||
    keyCode === VIDAA_KEY_CODES.RIGHT ||
    keyCode === VIDAA_KEY_CODES.UP ||
    keyCode === VIDAA_KEY_CODES.DOWN ||
    keyCode === VIDAA_KEY_CODES.ENTER
  )
}

/**
 * Check if a key event is the OK/Enter key
 */
export function isEnterKey(event: KeyboardEvent): boolean {
  const keyCode = event.keyCode || event.which
  return keyCode === VIDAA_KEY_CODES.ENTER || event.key === 'Enter'
}
