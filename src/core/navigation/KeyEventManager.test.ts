import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  KeyEventManager,
  isBackKey,
  isNavigationKey,
  isEnterKey,
} from './KeyEventManager'
import { VIDAA_KEY_CODES } from './SpatialNavigationProvider'

describe('KeyEventManager', () => {
  beforeEach(() => {
    // Clean up any existing handlers
    KeyEventManager.destroy()
  })

  afterEach(() => {
    KeyEventManager.destroy()
  })

  describe('initialization', () => {
    it('should initialize and add event listener', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')

      KeyEventManager.init()

      expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
    })

    it('should only initialize once', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')

      KeyEventManager.init()
      KeyEventManager.init()

      expect(addEventSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('destroy', () => {
    it('should remove event listener and clear handlers', () => {
      const removeEventSpy = vi.spyOn(window, 'removeEventListener')

      KeyEventManager.init()
      KeyEventManager.destroy()

      expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(KeyEventManager.getRegisteredHandlers()).toHaveLength(0)
    })
  })

  describe('register/unregister', () => {
    it('should register a handler', () => {
      KeyEventManager.init()
      const handler = vi.fn(() => false)

      KeyEventManager.register({
        id: 'test-handler',
        priority: 'default',
        handler,
      })

      expect(KeyEventManager.getRegisteredHandlers()).toContain('test-handler')
    })

    it('should return unregister function', () => {
      KeyEventManager.init()
      const handler = vi.fn(() => false)

      const unregister = KeyEventManager.register({
        id: 'test-handler',
        priority: 'default',
        handler,
      })

      expect(KeyEventManager.getRegisteredHandlers()).toContain('test-handler')

      unregister()

      expect(KeyEventManager.getRegisteredHandlers()).not.toContain('test-handler')
    })

    it('should unregister a handler by ID', () => {
      KeyEventManager.init()
      const handler = vi.fn(() => false)

      KeyEventManager.register({
        id: 'test-handler',
        priority: 'default',
        handler,
      })

      KeyEventManager.unregister('test-handler')

      expect(KeyEventManager.getRegisteredHandlers()).not.toContain('test-handler')
    })
  })

  describe('priority handling', () => {
    it('should call modal priority handlers first', () => {
      KeyEventManager.init()
      const callOrder: string[] = []

      KeyEventManager.register({
        id: 'modal-handler',
        priority: 'modal',
        handler: () => {
          callOrder.push('modal')
          return true // Stop propagation
        },
      })

      KeyEventManager.register({
        id: 'navigation-handler',
        priority: 'navigation',
        handler: () => {
          callOrder.push('navigation')
          return false
        },
      })

      const event = new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.BACK })
      window.dispatchEvent(event)

      // Only modal should be called since it returns true
      expect(callOrder).toEqual(['modal'])
    })

    it('should call handlers in priority order', () => {
      KeyEventManager.init()
      const callOrder: string[] = []

      KeyEventManager.register({
        id: 'default-handler',
        priority: 'default',
        handler: () => {
          callOrder.push('default')
          return false
        },
      })

      KeyEventManager.register({
        id: 'navigation-handler',
        priority: 'navigation',
        handler: () => {
          callOrder.push('navigation')
          return false
        },
      })

      KeyEventManager.register({
        id: 'modal-handler',
        priority: 'modal',
        handler: () => {
          callOrder.push('modal')
          return false
        },
      })

      const event = new KeyboardEvent('keydown', { keyCode: 32 }) // Space key
      window.dispatchEvent(event)

      expect(callOrder).toEqual(['modal', 'navigation', 'default'])
    })

    it('should stop propagation when handler returns true', () => {
      KeyEventManager.init()
      const callOrder: string[] = []

      KeyEventManager.register({
        id: 'player-handler',
        priority: 'player',
        handler: () => {
          callOrder.push('player')
          return true // Stop propagation
        },
      })

      KeyEventManager.register({
        id: 'navigation-handler',
        priority: 'navigation',
        handler: () => {
          callOrder.push('navigation')
          return false
        },
      })

      const event = new KeyboardEvent('keydown', { keyCode: 32 })
      window.dispatchEvent(event)

      // Player is higher priority than navigation, and it returns true
      // So navigation should not be called
      expect(callOrder).toEqual(['player'])
    })
  })

  describe('input element handling', () => {
    it('should skip handlers when target is an input element', () => {
      KeyEventManager.init()
      const handler = vi.fn(() => false)

      KeyEventManager.register({
        id: 'test-handler',
        priority: 'default',
        handler,
      })

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        keyCode: VIDAA_KEY_CODES.BACK,
        bubbles: true,
      })

      // Dispatch on the input element
      input.dispatchEvent(event)

      expect(handler).not.toHaveBeenCalled()

      // Clean up
      document.body.removeChild(input)
    })
  })

  describe('error handling', () => {
    it('should catch and log errors in handlers', () => {
      KeyEventManager.init()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      KeyEventManager.register({
        id: 'error-handler',
        priority: 'default',
        handler: () => {
          throw new Error('Test error')
        },
      })

      const event = new KeyboardEvent('keydown', { keyCode: 32 })
      window.dispatchEvent(event)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('KeyEventManager: Error in handler "error-handler"'),
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})

describe('isBackKey', () => {
  it('should return true for VIDAA back button (461)', () => {
    const event = new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.BACK })
    expect(isBackKey(event)).toBe(true)
  })

  it('should return true for Backspace (8)', () => {
    const event = new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.BACK_ALT })
    expect(isBackKey(event)).toBe(true)
  })

  it('should return true for Escape key', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    expect(isBackKey(event)).toBe(true)
  })

  it('should return true for Backspace key string', () => {
    const event = new KeyboardEvent('keydown', { key: 'Backspace' })
    expect(isBackKey(event)).toBe(true)
  })

  it('should return true for Samsung/LG back button (10009)', () => {
    const event = new KeyboardEvent('keydown', { keyCode: 10009 })
    expect(isBackKey(event)).toBe(true)
  })

  it('should return false for other keys', () => {
    const event = new KeyboardEvent('keydown', { keyCode: 32 }) // Space
    expect(isBackKey(event)).toBe(false)
  })
})

describe('isNavigationKey', () => {
  it('should return true for arrow keys', () => {
    expect(isNavigationKey(new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.LEFT }))).toBe(true)
    expect(isNavigationKey(new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.RIGHT }))).toBe(true)
    expect(isNavigationKey(new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.UP }))).toBe(true)
    expect(isNavigationKey(new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.DOWN }))).toBe(true)
  })

  it('should return true for Enter key', () => {
    const event = new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.ENTER })
    expect(isNavigationKey(event)).toBe(true)
  })

  it('should return false for non-navigation keys', () => {
    const event = new KeyboardEvent('keydown', { keyCode: 32 }) // Space
    expect(isNavigationKey(event)).toBe(false)
  })
})

describe('isEnterKey', () => {
  it('should return true for Enter keyCode', () => {
    const event = new KeyboardEvent('keydown', { keyCode: VIDAA_KEY_CODES.ENTER })
    expect(isEnterKey(event)).toBe(true)
  })

  it('should return true for Enter key string', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    expect(isEnterKey(event)).toBe(true)
  })

  it('should return false for other keys', () => {
    const event = new KeyboardEvent('keydown', { keyCode: 32 }) // Space
    expect(isEnterKey(event)).toBe(false)
  })
})
